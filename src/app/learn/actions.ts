"use server";

import type { LessonResultInput, SaveOutcome } from "@/components/lesson/lesson-player";
import { requireAccount } from "@/lib/auth";
import type { Language } from "@/lib/content/types";
import { calibrationVerdict, type CalibrationVerdict, lessonAverage, readyForNextLevel } from "@/lib/levels";
import { getLearner, getOpenRequest, getResults, getSettings } from "@/lib/lesson/next";

const pct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Saves a finished lesson. The database checks the child is the caller's and
 * the lesson is published. Afterwards: finishes a challenge lesson, or checks
 * whether to ask "Ready for the next level?".
 */
export async function saveLessonResult(learnerId: string, contentId: string, challengeRequestId: number | null, r: LessonResultInput): Promise<SaveOutcome> {
  const { supabase } = await requireAccount("/parent");
  const { data: resultId, error } = await supabase.rpc("record_lesson_result", {
    p_learner_id: learnerId,
    p_content_id: contentId,
    p_words_per_minute: r.wordsPerMinute > 0 ? Math.round(r.wordsPerMinute) : null,
    p_unusually_fast: Boolean(r.unusuallyFast),
    p_comprehension_pct: pct(r.comprehensionPct),
    p_spelling_pct: pct(r.spellingPct),
    p_grammar_pct: pct(r.grammarPct),
    p_vocabulary_pct: pct(r.vocabularyPct),
    p_eye_mode: r.eyeMode && ["lines", "groups", "pacer"].includes(r.eyeMode) ? r.eyeMode : null,
    p_duration_seconds: Math.max(0, Math.round(r.durationSeconds)),
    p_is_challenge: challengeRequestId !== null,
  });
  if (error) return { ok: false };

  const { data: item } = await supabase.from("content_items").select("language").eq("id", contentId).single<{ language: Language }>();
  if (!item) return { ok: true };
  const language = item.language;

  if (challengeRequestId !== null) {
    const average = lessonAverage({
      comprehension_pct: pct(r.comprehensionPct),
      spelling_pct: pct(r.spellingPct),
      grammar_pct: pct(r.grammarPct),
      vocabulary_pct: pct(r.vocabularyPct),
    });
    const request = await getOpenRequest(supabase, learnerId, language);
    if (!request || request.id !== challengeRequestId || request.status !== "approved") return { ok: true };
    const { data: passed } = await supabase.rpc("finish_challenge", { p_request_id: challengeRequestId, p_result_id: resultId, p_average: average });
    return { ok: true, challenge: { passed: Boolean(passed), toLevel: request.toLevel } };
  }

  const [learner, settings, results, open] = await Promise.all([
    getLearner(supabase, learnerId, language),
    getSettings(supabase),
    getResults(supabase, learnerId, language),
    getOpenRequest(supabase, learnerId, language),
  ]);
  if (!learner || open) return { ok: true };
  const total = results.filter((x) => x.content_type === "lesson").length;
  const ready = readyForNextLevel(results, learner.level, total, learner.promptSnoozedAt, settings);
  return ready ? { ok: true, promptLevel: learner.level + 1 } : { ok: true };
}

/**
 * The child's answer to "Ready for the next level?". "Yes" asks the parent
 * (or, with "move up after a challenge lesson", goes straight to the challenge).
 * "Not yet" is always fine: the prompt waits a few lessons.
 */
export async function answerLevelPrompt(learnerId: string, language: Language, yes: boolean): Promise<{ ok: boolean; mode?: "ask" | "auto" }> {
  const { supabase } = await requireAccount("/parent");
  const learner = await getLearner(supabase, learnerId, language);
  if (!learner) return { ok: false };
  if (!yes) {
    const results = await getResults(supabase, learnerId, language);
    const total = results.filter((x) => x.content_type === "lesson").length;
    const { error } = await supabase
      .from("learner_languages")
      .update({ prompt_snoozed_at: total })
      .eq("learner_id", learnerId)
      .eq("language", language);
    return { ok: !error };
  }
  const { error } = await supabase.from("level_requests").insert({
    learner_id: learnerId,
    language,
    from_level: learner.level,
    to_level: learner.level + 1,
    status: learner.levelUpMode === "auto" ? "approved" : "pending",
    decided_at: learner.levelUpMode === "auto" ? new Date().toISOString() : null,
  });
  // A request that is already open counts as done.
  if (error && !/duplicate key/.test(error.message)) return { ok: false };
  return { ok: true, mode: learner.levelUpMode };
}

export interface CalibrationInput {
  wordsPerMinute: number;
  unusuallyFast: boolean;
  comprehensionRight: number;
  questions: number;
  spellingRight: number;
  words: number;
  durationSeconds: number;
}

/** Saves a calibration (marked as such in reports) and returns the suggested level. */
export async function saveCalibrationResult(
  learnerId: string,
  contentId: string,
  c: CalibrationInput,
): Promise<{ ok: boolean; verdict?: CalibrationVerdict }> {
  const { supabase } = await requireAccount("/parent");
  const { error } = await supabase.rpc("record_lesson_result", {
    p_learner_id: learnerId,
    p_content_id: contentId,
    p_words_per_minute: c.wordsPerMinute > 0 ? Math.round(c.wordsPerMinute) : null,
    p_unusually_fast: Boolean(c.unusuallyFast),
    p_comprehension_pct: pct((c.comprehensionRight / Math.max(1, c.questions)) * 100),
    p_spelling_pct: pct((c.spellingRight / Math.max(1, c.words)) * 100),
    p_grammar_pct: null,
    p_vocabulary_pct: null,
    p_eye_mode: null,
    p_duration_seconds: Math.max(0, Math.round(c.durationSeconds)),
    p_is_challenge: false,
  });
  if (error) return { ok: false };
  return { ok: true, verdict: calibrationVerdict(c.comprehensionRight, c.questions, c.spellingRight, c.words) };
}

"use server";

import type { LessonResultInput } from "@/components/lesson/lesson-player";
import { requireAccount } from "@/lib/auth";

const pct = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/** Saves a finished lesson. The database checks the child is the caller's and the lesson is published. */
export async function saveLessonResult(learnerId: string, contentId: string, r: LessonResultInput): Promise<{ ok: boolean }> {
  const { supabase } = await requireAccount("/parent");
  const { error } = await supabase.rpc("record_lesson_result", {
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
  });
  return { ok: !error };
}

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Calibration, Language, Lesson } from "@/lib/content/types";
import { DEFAULT_SETTINGS, type ResultScores, type Settings } from "@/lib/levels";
import { type EyeMode, eyeModeFor } from "./logic";

export type DisplayStyle = "plain" | "border" | "tint";

export interface OpenRequest {
  id: number;
  status: "pending" | "approved";
  toLevel: number;
}

export interface LearnerInLanguage {
  id: string;
  name: string;
  grade: number | null;
  level: number;
  readingWpm: number | null;
  displayStyle: DisplayStyle;
  eyeModeFixed: EyeMode | null;
  levelUpMode: "ask" | "auto";
  promptSnoozedAt: number;
  suggestionSnoozedAt: number;
}

interface LearnerRow {
  id: string;
  name: string;
  grade: number | null;
  display_style: DisplayStyle;
  eye_mode_fixed: EyeMode | null;
  level_up_mode: "ask" | "auto";
  learner_languages: {
    language: Language;
    level: number;
    reading_wpm: number | null;
    prompt_snoozed_at: number;
    suggestion_snoozed_at: number;
  }[];
}

/** The child and their level, speed and settings in one language, or null if not the caller's child. */
export async function getLearner(supabase: SupabaseClient, learnerId: string, language: Language): Promise<LearnerInLanguage | null> {
  const { data } = await supabase
    .from("learners")
    .select(
      "id, name, grade, display_style, eye_mode_fixed, level_up_mode, learner_languages(language, level, reading_wpm, prompt_snoozed_at, suggestion_snoozed_at)",
    )
    .eq("id", learnerId)
    .maybeSingle<LearnerRow>();
  if (!data) return null;
  const lang = data.learner_languages.find((l) => l.language === language);
  return {
    id: data.id,
    name: data.name,
    grade: data.grade,
    level: lang?.level ?? 1,
    readingWpm: lang?.reading_wpm ?? null,
    displayStyle: data.display_style ?? "border",
    eyeModeFixed: data.eye_mode_fixed ?? null,
    levelUpMode: data.level_up_mode ?? "ask",
    promptSnoozedAt: lang?.prompt_snoozed_at ?? 0,
    suggestionSnoozedAt: lang?.suggestion_snoozed_at ?? 0,
  };
}

/** The admin-adjustable thresholds, with the brief's defaults as a fallback. */
export async function getSettings(supabase: SupabaseClient): Promise<Settings> {
  const { data } = await supabase.from("app_settings").select("key, value");
  const s: Settings = { ...DEFAULT_SETTINGS };
  for (const row of data ?? []) if (row.key in s) s[row.key as keyof Settings] = Number(row.value);
  return s;
}

/** The child's open "move up" request in a language (waiting for the parent, or approved for a challenge lesson). */
export async function getOpenRequest(supabase: SupabaseClient, learnerId: string, language: Language): Promise<OpenRequest | null> {
  const { data } = await supabase
    .from("level_requests")
    .select("id, status, to_level")
    .eq("learner_id", learnerId)
    .eq("language", language)
    .in("status", ["pending", "approved"])
    .maybeSingle<{ id: number; status: "pending" | "approved"; to_level: number }>();
  return data ? { id: data.id, status: data.status, toLevel: data.to_level } : null;
}

/** All results of a child in one language, for the level rules. */
export async function getResults(supabase: SupabaseClient, learnerId: string, language: Language) {
  const { data } = await supabase
    .from("lesson_results")
    .select("content_id, completed_at, words_per_minute, comprehension_pct, spelling_pct, grammar_pct, vocabulary_pct, content_type, level, is_challenge, eye_mode")
    .eq("learner_id", learnerId)
    .eq("language", language)
    .order("completed_at", { ascending: false });
  return (data ?? []) as (ResultScores & { content_id: string | null; eye_mode: EyeMode | null })[];
}

export type NextLesson =
  | { kind: "lesson"; lesson: Lesson; eyeMode: EyeMode; reread: boolean; challenge: OpenRequest | null }
  | { kind: "allDone"; count: number }
  | { kind: "none" };

/**
 * Picks the next lesson: the first unread published lesson at the child's
 * level, in the order of the lessons document. After the parent approves a
 * move up, it is a challenge lesson from the next level instead. When all are
 * read, `again` picks the one read longest ago. (Topics come in Phase 5.)
 */
export async function nextLesson(supabase: SupabaseClient, learner: LearnerInLanguage, language: Language, again: boolean): Promise<NextLesson> {
  const request = await getOpenRequest(supabase, learner.id, language);
  const challenge = request?.status === "approved" ? request : null;
  const level = challenge ? challenge.toLevel : learner.level;

  const [{ data: lessons, error }, results] = await Promise.all([
    supabase
      .from("content_items")
      .select("id, sequence")
      .eq("type", "lesson")
      .eq("language", language)
      .eq("level", level)
      // Children only ever see published content. Row level security enforces
      // this too, but an admin who is also a parent can see everything.
      .eq("status", "published")
      .order("sequence"),
    getResults(supabase, learner.id, language),
  ]);
  if (error) throw error;
  if (!lessons?.length) return { kind: "none" };

  const lastRead = new Map<string, string>();
  for (const r of results) if (r.content_id && !lastRead.has(r.content_id)) lastRead.set(r.content_id, r.completed_at);
  const eyeSessions = results.filter((r) => r.eye_mode).length;

  let pick = lessons.find((l) => !lastRead.has(l.id));
  let reread = false;
  if (!pick) {
    if (!again && !challenge) return { kind: "allDone", count: lessons.length };
    pick = [...lessons].sort((a, b) => (lastRead.get(a.id) ?? "").localeCompare(lastRead.get(b.id) ?? ""))[0];
    reread = true;
  }

  const { data: item } = await supabase
    .from("content_items")
    .select("data")
    .eq("id", pick.id)
    .eq("status", "published")
    .single<{ data: Omit<Lesson, "status"> }>();
  if (!item) return { kind: "none" };
  return {
    kind: "lesson",
    lesson: { ...item.data, status: "published" } as Lesson,
    eyeMode: learner.eyeModeFixed ?? eyeModeFor(eyeSessions),
    reread,
    challenge,
  };
}

/** The published calibration passages at a level (normally 3), for the child to choose from. */
export async function calibrationChoices(supabase: SupabaseClient, language: Language, level: number) {
  const { data } = await supabase
    .from("content_items")
    .select("id, title, sequence")
    .eq("type", "calibration")
    .eq("language", language)
    .eq("level", level)
    .eq("status", "published")
    .order("sequence");
  return (data ?? []) as { id: string; title: string; sequence: number }[];
}

export async function getCalibration(supabase: SupabaseClient, id: string, language: Language) {
  const { data } = await supabase
    .from("content_items")
    .select("data")
    .eq("id", id)
    .eq("type", "calibration")
    .eq("language", language)
    .eq("status", "published")
    .maybeSingle<{ data: Omit<Calibration, "status"> }>();
  return data ? ({ ...data.data, status: "published" } as Calibration) : null;
}

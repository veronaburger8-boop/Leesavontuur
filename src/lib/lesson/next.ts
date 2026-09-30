import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Language, Lesson } from "@/lib/content/types";
import { type EyeMode, eyeModeFor } from "./logic";

export interface LearnerInLanguage {
  id: string;
  name: string;
  level: number;
  readingWpm: number | null;
}

/** The child and their level and reading speed in one language, or null if not the caller's child. */
export async function getLearner(supabase: SupabaseClient, learnerId: string, language: Language): Promise<LearnerInLanguage | null> {
  const { data } = await supabase
    .from("learners")
    .select("id, name, learner_languages(language, level, reading_wpm)")
    .eq("id", learnerId)
    .maybeSingle<{ id: string; name: string; learner_languages: { language: Language; level: number; reading_wpm: number | null }[] }>();
  if (!data) return null;
  const lang = data.learner_languages.find((l) => l.language === language);
  return { id: data.id, name: data.name, level: lang?.level ?? 1, readingWpm: lang?.reading_wpm ?? null };
}

export type NextLesson =
  | { kind: "lesson"; lesson: Lesson; eyeMode: EyeMode; reread: boolean }
  | { kind: "allDone"; count: number }
  | { kind: "none" };

/**
 * Picks the next lesson: the first unread published lesson at the child's
 * level, in the order of the lessons document. When all are read, `again`
 * picks the one read longest ago. (Choosing by favourite topics comes in Phase 5.)
 */
export async function nextLesson(supabase: SupabaseClient, learner: LearnerInLanguage, language: Language, again: boolean): Promise<NextLesson> {
  const [{ data: lessons, error }, { data: results }] = await Promise.all([
    supabase
      .from("content_items")
      .select("id, sequence")
      .eq("type", "lesson")
      .eq("language", language)
      .eq("level", learner.level)
      // Children only ever see published content. Row level security enforces
      // this too, but an admin who is also a parent can see everything.
      .eq("status", "published")
      .order("sequence"),
    supabase
      .from("lesson_results")
      .select("content_id, completed_at, eye_mode")
      .eq("learner_id", learner.id)
      .eq("language", language)
      .order("completed_at", { ascending: false }),
  ]);
  if (error) throw error;
  if (!lessons?.length) return { kind: "none" };

  const lastRead = new Map<string, string>();
  for (const r of results ?? []) if (r.content_id && !lastRead.has(r.content_id)) lastRead.set(r.content_id, r.completed_at);
  const eyeSessions = (results ?? []).filter((r) => r.eye_mode).length;

  let pick = lessons.find((l) => !lastRead.has(l.id));
  let reread = false;
  if (!pick) {
    if (!again) return { kind: "allDone", count: lessons.length };
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
  return { kind: "lesson", lesson: { ...item.data, status: "published" } as Lesson, eyeMode: eyeModeFor(eyeSessions), reread };
}

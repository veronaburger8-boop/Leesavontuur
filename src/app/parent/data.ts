import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface LearnerRow {
  id: string;
  name: string;
  grade: number | null;
  created_at: string;
  learner_languages: { language: "af" | "en"; level: number; reading_wpm: number | null }[];
}

/** The signed-in parent's children. Row level security limits this to their own. */
export async function listLearners(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("learners")
    .select("id, name, grade, created_at, learner_languages(language, level, reading_wpm)")
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as LearnerRow[];
}

export const levelIn = (l: LearnerRow, language: "af" | "en") => l.learner_languages.find((x) => x.language === language)?.level ?? 1;

/** Levels that have lessons so far. */
export const AVAILABLE_LEVELS = [1, 2, 3, 4, 5];
export const GRADES = [0, 1, 2, 3, 4, 5, 6, 7];

export interface ResultRow {
  learner_id: string;
  content_title: string;
  language: "af" | "en";
  level: number;
  completed_at: string;
  words_per_minute: number | null;
  comprehension_pct: number | null;
  spelling_pct: number | null;
  grammar_pct: number | null;
  vocabulary_pct: number | null;
}

/** The most recent lesson results of the parent's children (full reports come in Phase 4). */
export async function recentResults(supabase: SupabaseClient) {
  const { data } = await supabase
    .from("lesson_results")
    .select("learner_id, content_title, language, level, completed_at, words_per_minute, comprehension_pct, spelling_pct, grammar_pct, vocabulary_pct")
    .order("completed_at", { ascending: false })
    .limit(20);
  return (data ?? []) as ResultRow[];
}

export const MAX_CHILDREN = 2;

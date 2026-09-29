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

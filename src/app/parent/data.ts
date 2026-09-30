import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface LearnerRow {
  id: string;
  name: string;
  grade: number | null;
  created_at: string;
  display_style: "plain" | "border" | "tint";
  eye_mode_fixed: "lines" | "groups" | "pacer" | null;
  level_up_mode: "ask" | "auto";
  learner_languages: { language: "af" | "en"; level: number; reading_wpm: number | null; suggestion_snoozed_at: number }[];
  learner_topics: { topic: string }[];
}

export interface TopicRow {
  key: string;
  name_en: string;
  name_af: string;
}

/** The signed-in parent's children. Row level security limits this to their own. */
export async function listLearners(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("learners")
    .select("id, name, grade, created_at, display_style, eye_mode_fixed, level_up_mode, learner_languages(language, level, reading_wpm, suggestion_snoozed_at), learner_topics(topic)")
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as LearnerRow[];
}

/** Topics a child can choose: active topics that have published lessons. */
export async function availableTopics(supabase: SupabaseClient): Promise<TopicRow[]> {
  const [{ data: topics }, { data: lessons }] = await Promise.all([
    supabase.from("topics").select("key, name_en, name_af").eq("active", true).order("sort_order").order("name_en"),
    supabase.from("content_items").select("topic").eq("type", "lesson").eq("status", "published"),
  ]);
  const withLessons = new Set((lessons ?? []).map((l) => l.topic as string));
  return ((topics ?? []) as TopicRow[]).filter((t) => withLessons.has(t.key));
}

export const topicName = (t: TopicRow, locale: "af" | "en") => (locale === "af" ? t.name_af : t.name_en);

export const MIN_TOPICS = 2;
export const MAX_TOPICS = 4;

export const levelIn = (l: LearnerRow, language: "af" | "en") => l.learner_languages.find((x) => x.language === language)?.level ?? 1;

/** Levels that have lessons so far. */
export const AVAILABLE_LEVELS = [1, 2, 3, 4, 5];
export const GRADES = [0, 1, 2, 3, 4, 5, 6, 7];

export const MAX_CHILDREN = 2;

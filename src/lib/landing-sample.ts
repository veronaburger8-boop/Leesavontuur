import "server-only";
import type { Language, Lesson, WordCard } from "@/lib/content/types";
import { createAdminClient } from "@/lib/supabase/admin";

export interface LessonSample {
  title: string;
  card: WordCard;
  lines: string[];
}

const LINES = 4;

/**
 * A peek into one real lesson for the welcome page: one word card (one with a
 * picture when there is one) and the first few lines of the passage. Visitors
 * aren't signed in, so this reads with the server's key, and only ever from
 * published Level 1 lessons.
 */
export async function lessonSample(language: Language): Promise<LessonSample | null> {
  try {
    const { data } = await createAdminClient()
      .from("content_items")
      .select("title, data")
      .eq("status", "published")
      .eq("type", "lesson")
      .eq("language", language)
      .eq("level", 1)
      .order("sequence")
      .limit(10);
    const lessons = (data ?? []) as { title: string; data: Lesson }[];
    for (const withPicture of [true, false]) {
      for (const l of lessons) {
        const card = (l.data.wordCards ?? []).find((c) => !c.extra && (!withPicture || c.image));
        if (card && l.data.passage?.length) return { title: l.title, card, lines: l.data.passage.slice(0, LINES) };
      }
    }
  } catch {
    // The welcome page still works without the sample.
  }
  return null;
}

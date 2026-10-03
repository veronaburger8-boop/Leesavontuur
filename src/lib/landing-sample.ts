import "server-only";
import type { Language, Lesson, WordCard } from "@/lib/content/types";
import { createAdminClient } from "@/lib/supabase/admin";

export interface LessonSample {
  /** Up to three word cards, from different lessons, with pictures when there are any. */
  cards: WordCard[];
  /** One whole Level 1 passage, for the "How fast do you read?" try-out. */
  passage: { title: string; lines: string[]; words: number };
}

const CARDS = 3;

/**
 * Real lesson content for the welcome page's "Try it yourself". Visitors aren't
 * signed in, so this reads with the server's key, and only ever from published
 * Level 1 lessons.
 */
export async function lessonSample(language: Language): Promise<LessonSample | null> {
  try {
    const { data } = await createAdminClient()
      .from("content_items")
      .select("title, word_count, data")
      .eq("status", "published")
      .eq("type", "lesson")
      .eq("language", language)
      .eq("level", 1)
      .order("sequence")
      .limit(10);
    const lessons = (data ?? []) as { title: string; word_count: number; data: Lesson }[];
    const first = lessons.find((l) => l.data.passage?.length && l.word_count > 0);
    if (!first) return null;
    const cards: WordCard[] = [];
    // One card per lesson: pictured cards first, then any card to fill up.
    for (const withPicture of [true, false]) {
      for (const l of lessons) {
        if (cards.length === CARDS) break;
        const card = (l.data.wordCards ?? []).find((c) => !c.extra && (!withPicture || c.image) && !cards.includes(c));
        if (card && !cards.some((c) => c.word === card.word)) cards.push(card);
      }
    }
    return { cards, passage: { title: first.title, lines: first.data.passage, words: first.word_count } };
  } catch {
    // The welcome page still works without the samples.
    return null;
  }
}

// The rules of a lesson (brief, section 2), kept separate from the screens so
// they can be tested.

import type { GrammarItem, Language, Layout } from "@/lib/content/types";
import { splitSentences } from "@/lib/content/parse-source";

// ---------------------------------------------------------------- answers

/**
 * Makes typed answers comparable: ignores capital letters, extra spaces and
 * a missing full stop, and treats straight and curly apostrophes the same.
 */
export function normalise(s: string): string {
  return s
    .normalize("NFC")
    .replace(/[’‘`´]/g, "'")
    .replace(/[“”]/g, '"')
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*[.]+$/, "")
    .toLowerCase();
}

export const matches = (typed: string, accepted: string[]) => accepted.some((a) => normalise(a) === normalise(typed));

/** Spelling must match exactly, apart from capital letters and spaces around the word. */
export const spellingMatches = (typed: string, word: string) =>
  typed.normalize("NFC").trim().replace(/[’‘`´]/g, "'").toLowerCase() === word.normalize("NFC").trim().replace(/[’‘`´]/g, "'").toLowerCase();

/** The accepted answers per blank of a grammar item (one blank, or two for e.g. min – minder – minste). */
export function grammarBlanks(item: GrammarItem): string[][] {
  return item.blanks ?? [item.accepted ?? []];
}

export function grammarCorrect(item: GrammarItem, typed: string[]): boolean {
  const blanks = grammarBlanks(item);
  return blanks.length === typed.length && blanks.every((accepted, i) => matches(typed[i] ?? "", accepted));
}

// ---------------------------------------------------------------- scores

export const percent = (score: number, total: number) => (total ? Math.round((score / total) * 100) : 0);

export type Band = "perfect" | "great" | "good" | "keepGoing" | "tryAgain";

/** Score bands for the encouraging messages: 100%, 80–99, 60–79, 40–59, below 40. */
export function band(pct: number): Band {
  if (pct >= 100) return "perfect";
  if (pct >= 80) return "great";
  if (pct >= 60) return "good";
  if (pct >= 40) return "keepGoing";
  return "tryAgain";
}

/** Words per minute = word count ÷ minutes. */
export const wordsPerMinute = (words: number, ms: number) => (ms > 0 ? Math.round(words / (ms / 60000)) : 0);

/** Readings faster than this are "Did you really read every word?". */
export const IMPOSSIBLY_FAST = 350;

/** The eye exercise runs about 5% faster than the last reading speed. */
export const eyeSpeed = (readingWpm: number) => Math.round(readingWpm * 1.05);

// ---------------------------------------------------------------- eye exercise

export type EyeMode = "lines" | "groups" | "pacer";
export const EYE_MODES: EyeMode[] = ["lines", "groups", "pacer"];

/** Modes take turns between sessions. */
export const eyeModeFor = (lessonsDone: number): EyeMode => EYE_MODES[lessonsDone % EYE_MODES.length];

/** The passage as lines: its lines (Levels 1–3) or its sentences (paragraphs, Levels 4+). */
export function passageLines(passage: string[], layout: Layout): string[] {
  return layout === "lines" ? passage : passage.flatMap((p) => splitSentences(p));
}

/** Word groups of about 3 words. */
export function wordGroups(passage: string[], size = 3): string[] {
  const words = passage.join(" ").split(/\s+/).filter(Boolean);
  const groups: string[] = [];
  for (let i = 0; i < words.length; i += size) groups.push(words.slice(i, i + size).join(" "));
  return groups;
}

/** How long a line or group stays on screen at the given speed. */
export function displayMs(text: string, wpm: number, minimumMs: number): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(minimumMs, Math.round((words / wpm) * 60000));
}

// ---------------------------------------------------------------- pages

/** Splits long paragraph passages into pages of roughly `wordsPerPage` words; line passages stay on one page. */
export function pages(passage: string[], layout: Layout, wordsPerPage = 140): string[][] {
  if (layout === "lines") return [passage];
  const out: string[][] = [];
  let current: string[] = [];
  let count = 0;
  for (const p of passage) {
    const n = p.split(/\s+/).length;
    if (current.length && count + n > wordsPerPage) {
      out.push(current);
      current = [];
      count = 0;
    }
    current.push(p);
    count += n;
  }
  if (current.length) out.push(current);
  return out;
}

// ---------------------------------------------------------------- shuffling

/** Shuffles options for display and remembers where the correct one went. */
export function shuffleOptions(options: string[], answer: number, random: () => number = Math.random) {
  const order = options.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { options: order.map((i) => options[i]), answer: order.indexOf(answer) };
}

/** Time a spelling word stays on screen: 2 seconds at Levels 1–2, 1.5 from Level 3. */
export const spellingFlashMs = (level: number) => (level <= 2 ? 2000 : 1500);

export type { Language };

/** The first unread lesson in a favourite topic, or else the first unread lesson (in the document's order). */
export function pickUnread<L extends { id: string; topic: string | null }>(lessons: L[], read: Map<string, string> | Set<string>, favourites: Set<string>): L | undefined {
  const unread = lessons.filter((l) => !read.has(l.id));
  return unread.find((l) => l.topic !== null && favourites.has(l.topic)) ?? unread[0];
}

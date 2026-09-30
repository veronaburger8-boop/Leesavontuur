// Galgie (hangman, brief section 7): words come from the spelling and word
// card lists of the child's level and language, so the game revises lesson
// words. Instead of a gallows, a bunch of balloons pops one by one.

import type { Lesson } from "@/lib/content/types";

export const BALLOONS = 7;

/** Letters on the screen: a–z plus the Afrikaans special letters. */
export const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
export const SPECIAL = ["ê", "ë", "é", "è", "ô", "ö", "û", "ï", "î"];

/** Single words of 3 to 12 letters, lower case, without doubles. */
export function galgieWords(lessons: Pick<Lesson, "spelling" | "wordCards">[]): string[] {
  const allowed = new Set([...LETTERS, ...SPECIAL]);
  const words = lessons.flatMap((l) => [...l.spelling, ...l.wordCards.map((c) => c.word)]).map((w) => w.normalize("NFC").trim().toLowerCase());
  return [...new Set(words)].filter((w) => w.length >= 3 && w.length <= 12 && [...w].every((ch) => allowed.has(ch)));
}

export interface Round {
  word: string;
  guessed: string[];
}

export function roundState({ word, guessed }: Round) {
  const letters = [...word];
  const wrong = guessed.filter((g) => !letters.includes(g));
  const shown = letters.map((ch) => (guessed.includes(ch) ? ch : null));
  const won = shown.every((ch) => ch !== null);
  const lost = !won && wrong.length >= BALLOONS;
  return { shown, wrong, balloonsLeft: BALLOONS - wrong.length, won, lost, over: won || lost };
}

/** A random order of the words (Fisher–Yates). */
export function shuffled<T>(list: T[], random: () => number = Math.random): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

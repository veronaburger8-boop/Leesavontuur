// The shape Claude fills in when drafting a lesson ("Draft passages"), and how
// a draft becomes a lesson in the section 9 format. Kept free of server code
// so it can be tested.

import { z } from "zod";
import { makeId } from "./editor";
import { type Language, type Lesson, layoutForLevel } from "./types";

// Only plain types here: structured outputs don't support every schema feature.
export const ideasSchema = z.object({
  ideas: z.array(z.object({ title: z.string(), idea: z.string() })),
});

export const draftSchema = z.object({
  title: z.string(),
  passage: z.array(z.string()),
  wordCards: z.array(
    z.object({
      word: z.string(),
      definitions: z.array(z.string()),
      example: z.string(),
      forms: z.string().nullable(),
      translation: z.string(),
      imageNote: z.string().nullable(),
      extra: z.boolean(),
    }),
  ),
  comprehension: z.array(z.object({ question: z.string(), options: z.array(z.string()), answer: z.number().int(), thinking: z.boolean() })),
  spelling: z.array(z.string()),
  grammar: z.object({
    focus: z.string(),
    instruction: z.string(),
    items: z.array(
      z.object({
        prompt: z.string(),
        accepted: z.array(z.string()),
        secondBlank: z.array(z.string()),
        choices: z.array(z.string()),
      }),
    ),
  }),
  vocabulary: z.array(z.object({ sentence: z.string(), options: z.array(z.string()), answer: z.number().int() })),
});

export type Draft = z.infer<typeof draftSchema>;

/** A drafted lesson as a Draft item. The id is made unique by the caller. */
export function draftToLesson(d: Draft, language: Language, level: number, topic: string, sequence: number): Lesson {
  const clean = (s: string) => s.trim();
  return {
    id: makeId(language, level, d.title),
    type: "lesson",
    language,
    level,
    topic,
    status: "draft",
    title: clean(d.title),
    sequence,
    layout: layoutForLevel(level),
    passage: d.passage.map(clean).filter(Boolean),
    wordCards: d.wordCards.map((c) => ({
      word: clean(c.word),
      definitions: c.definitions.map(clean).filter(Boolean),
      example: clean(c.example),
      forms: c.forms?.trim() || null,
      translation: clean(c.translation),
      image: null,
      imageNote: c.imageNote?.trim() || null,
      extra: c.extra,
    })),
    extraWords: [],
    comprehension: d.comprehension.map((q) => ({ question: clean(q.question), options: q.options.map(clean), answer: q.answer, thinking: q.thinking })),
    spelling: d.spelling.map(clean).filter(Boolean),
    grammar: {
      focus: clean(d.grammar.focus),
      instruction: clean(d.grammar.instruction),
      items: d.grammar.items.map((g) => ({
        prompt: clean(g.prompt),
        ...(g.secondBlank.length ? { blanks: [g.accepted.map(clean), g.secondBlank.map(clean)] } : { accepted: g.accepted.map(clean) }),
        ...(g.choices.length ? { choices: g.choices.map(clean) } : {}),
      })),
    },
    vocabulary: d.vocabulary.map((v) => ({ sentence: clean(v.sentence), options: v.options.map(clean), answer: v.answer })),
  };
}

/** Claude Opus 5.5 list prices in US dollars per million tokens, for the cost shown to the admin. */
export const PRICE_PER_MILLION = { input: 4, output: 20 };

export const estimateCost = (input: number, output: number) => (input * PRICE_PER_MILLION.input + output * PRICE_PER_MILLION.output) / 1_000_000;

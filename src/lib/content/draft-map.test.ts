import { expect, it } from "vitest";
import { type Draft, draftToLesson, estimateCost } from "./draft-map";
import { contentItemSchema } from "./validate";

const draft: Draft = {
  title: "Thabo se perd",
  passage: ["Thabo het 'n perd.", " Die perd is bruin. "],
  wordCards: [{ word: "perd", definitions: ["'n Groot dier."], example: "Die perd hardloop.", forms: "", translation: "horse", imageNote: null, extra: false }],
  comprehension: [{ question: "Wat het Thabo?", options: ["'n perd", "'n hond", "'n kat", "'n koei", "'n bok"], answer: 0, thinking: false }],
  spelling: ["perd", "bruin"],
  grammar: {
    focus: "trappe van vergelyking",
    instruction: "Gee die trappe.",
    items: [
      { prompt: "groot", accepted: ["groter"], secondBlank: ["grootste"], choices: [] },
      { prompt: "Feit of mening?", accepted: ["F"], secondBlank: [], choices: ["F", "M"] },
    ],
  },
  vocabulary: [{ sentence: "Die ______ eet gras.", options: ["perd", "perde", "pers", "pad"], answer: 0 }],
};

it("turns a draft into a valid Draft lesson", () => {
  const lesson = draftToLesson(draft, "af", 2, "horses", 11);
  expect(lesson).toMatchObject({ id: "af-l2-thabo-se-perd", status: "draft", layout: "lines", sequence: 11, topic: "horses" });
  expect(lesson.passage).toEqual(["Thabo het 'n perd.", "Die perd is bruin."]);
  expect(lesson.wordCards[0]).toMatchObject({ forms: null, image: null });
  expect(lesson.grammar.items[0]).toEqual({ prompt: "groot", blanks: [["groter"], ["grootste"]] });
  expect(lesson.grammar.items[1]).toEqual({ prompt: "Feit of mening?", accepted: ["F"], choices: ["F", "M"] });
  expect(contentItemSchema.safeParse(lesson).success).toBe(true);
});

it("estimates the cost of a run", () => {
  expect(estimateCost(1_000_000, 100_000)).toBeCloseTo(6);
});

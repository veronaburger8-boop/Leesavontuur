import { describe, expect, it } from "vitest";
import {
  band,
  displayMs,
  eyeModeFor,
  eyeSpeed,
  grammarCorrect,
  matches,
  normalise,
  pages,
  passageLines,
  percent,
  shuffleOptions,
  spellingMatches,
  wordGroups,
  wordsPerMinute,
} from "./logic";

describe("answer checking", () => {
  it("ignores capitals, extra spaces, a missing full stop and apostrophe style", () => {
    expect(matches("  ek HET   geëet ", ["Ek het geëet."])).toBe(true);
    expect(matches("don’t", ["don't"])).toBe(true);
    expect(matches("dont", ["don't"])).toBe(false);
    expect(matches("hartseer", ["hartseer", "treurig"])).toBe(true);
    expect(matches("treurig", ["hartseer", "treurig"])).toBe(true);
    expect(normalise("Ons was bang vir die storm...")).toBe("ons was bang vir die storm");
  });

  it("does not ignore Afrikaans special letters", () => {
    expect(matches("geeet", ["geëet"])).toBe(false);
    expect(spellingMatches("vervaardig", "vervaardig")).toBe(true);
    expect(spellingMatches("Gieter ", "gieter")).toBe(true);
    expect(spellingMatches("geiter", "gieter")).toBe(false);
  });

  it("checks both blanks of a two-blank grammar item", () => {
    const item = { prompt: "far", blanks: [["farther", "further"], ["farthest", "furthest"]] };
    expect(grammarCorrect(item, ["further", "furthest"])).toBe(true);
    expect(grammarCorrect(item, ["further", "farther"])).toBe(false);
    expect(grammarCorrect({ prompt: "blaar", accepted: ["blaartjie"] }, ["Blaartjie"])).toBe(true);
  });
});

describe("scores and speed", () => {
  it("works out percentages and bands", () => {
    expect(percent(4, 5)).toBe(80);
    expect(percent(7, 10)).toBe(70);
    expect([100, 99, 80, 79, 60, 59, 40, 39, 0].map(band)).toEqual([
      "perfect", "great", "great", "good", "good", "keepGoing", "keepGoing", "tryAgain", "tryAgain",
    ]);
  });

  it("works out words per minute and the next eye-exercise speed", () => {
    expect(wordsPerMinute(162, 120000)).toBe(81);
    expect(eyeSpeed(100)).toBe(105);
  });

  it("rotates the eye-exercise modes", () => {
    expect([0, 1, 2, 3].map(eyeModeFor)).toEqual(["lines", "groups", "pacer", "lines"]);
  });
});

describe("eye exercise and pages", () => {
  it("makes groups of about 3 words", () => {
    expect(wordGroups(["Ek het 'n hond.", "Sy naam is Tokkie."])).toEqual(["Ek het 'n", "hond. Sy naam", "is Tokkie."]);
  });

  it("uses sentences as lines for paragraph passages", () => {
    expect(passageLines(["Een. Twee is hier.", "Drie."], "paragraphs")).toEqual(["Een.", "Twee is hier.", "Drie."]);
    expect(passageLines(["Ek het 'n hond."], "lines")).toEqual(["Ek het 'n hond."]);
  });

  it("shows each line for as long as the speed allows, but not shorter than the minimum", () => {
    expect(displayMs("een twee drie vier vyf ses", 60, 700)).toBe(6000);
    expect(displayMs("een", 300, 700)).toBe(700);
  });

  it("splits long paragraph passages into pages", () => {
    const para = (n: number) => Array(n).fill("woord").join(" ");
    expect(pages([para(60), para(60), para(60), para(60), para(60)], "paragraphs").map((p) => p.length)).toEqual([2, 2, 1]);
    expect(pages(["a", "b"], "lines")).toEqual([["a", "b"]]);
  });
});

describe("shuffleOptions", () => {
  it("keeps track of the correct answer", () => {
    let seed = 0.3;
    const random = () => (seed = (seed * 9301 + 0.49297) % 1);
    for (let k = 0; k < 20; k++) {
      const s = shuffleOptions(["a", "b", "c", "d", "e"], 2, random);
      expect(s.options[s.answer]).toBe("c");
      expect([...s.options].sort()).toEqual(["a", "b", "c", "d", "e"]);
    }
  });
});

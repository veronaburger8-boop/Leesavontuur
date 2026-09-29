import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { expandShorthand, parseSource, splitSentences, unescapeMd } from "./parse-source";
import { wordCount } from "./types";

describe("expandShorthand", () => {
  it("leaves full options alone", () => {
    expect(expandShorthand(["Tokkie is swart.", "Tokkie is wit.", "Tokkie is bruin."])).toBeNull();
    expect(expandShorthand(["'n Groen grasperk", "Aalwyne en vetplante", "Waterlelies"])).toBeNull();
  });

  it("expands options that replace the end of the first sentence", () => {
    expect(expandShorthand(["Karel woon saam met sy ma.", "sy oupa.", "sy ouma."])).toEqual([
      "Karel woon saam met sy ma.",
      "Karel woon saam met sy oupa.",
      "Karel woon saam met sy ouma.",
    ]);
  });

  it("expands options with a shared start and end", () => {
    expect(expandShorthand(["Want groente het baie lig", "skaduwee", "wind", "reën", "sand nodig."])).toEqual([
      "Want groente het baie lig nodig.",
      "Want groente het baie skaduwee nodig.",
      "Want groente het baie wind nodig.",
      "Want groente het baie reën nodig.",
      "Want groente het baie sand nodig.",
    ]);
  });

  it("keeps multi-word options whole", () => {
    expect(expandShorthand(["Dit duur twee dae", "een week", "twee weke", "drie weke", "twee maande."])).toEqual([
      "Dit duur twee dae.",
      "Dit duur een week.",
      "Dit duur twee weke.",
      "Dit duur drie weke.",
      "Dit duur twee maande.",
    ]);
    expect(
      expandShorthand(["She wanted to make new friends", "help her dad", "earn some pocket money", "use up the sugar", "stay out of the sun."]),
    ).toEqual([
      "She wanted to make new friends.",
      "She wanted to help her dad.",
      "She wanted to earn some pocket money.",
      "She wanted to use up the sugar.",
      "She wanted to stay out of the sun.",
    ]);
  });

  it("keeps prepositions in the shared start", () => {
    expect(expandShorthand(["They were coming home from school", "swimming lessons", "the park", "church."])).toEqual([
      "They were coming home from school.",
      "They were coming home from swimming lessons.",
      "They were coming home from the park.",
      "They were coming home from church.",
    ]);
  });

  it("handles options with no shared start", () => {
    expect(expandShorthand(["Four to six", "six to eight", "nine to twelve", "ten to fifteen hours."])).toEqual([
      "Four to six hours.",
      "Six to eight hours.",
      "Nine to twelve hours.",
      "Ten to fifteen hours.",
    ]);
  });
});

describe("helpers", () => {
  it("removes Markdown escapes", () => {
    expect(unescapeMd("Die kat swaai sy \\_\\_\\_\\_\\_\\_.")).toBe("Die kat swaai sy ______.");
  });

  it("splits sentences, including ones starting with 'n", () => {
    expect(splitSentences("Kompos is goed. 'n Houer is rond. Dit hou water.")).toEqual([
      "Kompos is goed.",
      "'n Houer is rond.",
      "Dit hou water.",
    ]);
  });

  it("counts 'n as a word and ignores dashes", () => {
    expect(wordCount(["Ek het 'n hond – hy is bruin."])).toBe(7);
  });
});

describe("parseSource on the real lessons file", () => {
  const source = readFileSync(join(__dirname, "../../../content/lessons-source.md"), "utf8");
  const result = parseSource(source);
  const lessons = result.items.filter((i) => i.type === "lesson");
  const calibrations = result.items.filter((i) => i.type === "calibration");

  it("finds 100 lessons and 30 calibration passages", () => {
    expect(lessons).toHaveLength(100);
    expect(calibrations).toHaveLength(30);
  });

  it("gives every item a unique id", () => {
    expect(new Set(result.items.map((i) => i.id)).size).toBe(130);
  });

  it("matches the prototype lesson exactly", () => {
    const karel = result.items.find((i) => i.id === "af-l3-karel-se-groentetuin");
    expect(karel?.type).toBe("lesson");
    if (karel?.type !== "lesson") return;
    expect(karel.topic).toBe("nature");
    expect(karel.layout).toBe("lines");
    expect(karel.passage).toHaveLength(13);
    expect(karel.passage[12]).toBe('"Wag maar," sê Ouma, "die lekkerste deel is wanneer ons die eerste groente kan eet!"');
    expect(karel.wordCards.map((c) => c.word)).toEqual(["spit", "kompos", "onkruid", "versigtig", "heining", "gieter"]);
    expect(karel.wordCards[1]).toMatchObject({
      definitions: ["Verrotte blare, gras en groenteskille wat die grond ryk maak.", "Dit is goed vir plante."],
      example: "Ma gooi die ou groenteskille op die komposhoop.",
      forms: null,
      translation: "compost",
    });
    expect(karel.wordCards[3].forms).toBe("Teenoorgestelde: onversigtig");
    expect(karel.extraWords).toEqual(["sonnig", "opgewonde"]);
    expect(karel.comprehension.map((q) => q.answer)).toEqual([2, 0, 3, 1, 2]);
    expect(karel.grammar.items[0]).toEqual({ prompt: "blaar", accepted: ["blaartjie"] });
    expect(karel.vocabulary[1]).toEqual({
      sentence: "Die hond kan nie uitkom nie, want daar is 'n hoë ______ om die erf.",
      options: ["heuning", "heining", "heinings", "horing"],
      answer: 1,
    });
    expect(karel.status).toBe("in_review"); // expanded questions must be checked
  });

  it("uses paragraphs from Level 4", () => {
    const l4 = lessons.filter((l) => l.level >= 4);
    expect(l4.every((l) => l.layout === "paragraphs" && l.passage.length >= 3)).toBe(true);
  });

  it("marks thinking questions and removes the label", () => {
    const q = lessons.flatMap((l) => l.comprehension).filter((q) => q.thinking);
    expect(q.length).toBeGreaterThan(0);
    expect(q.some((x) => /Dinkvraag|Thinking/.test(x.question))).toBe(false);
  });

  it("keeps Afrikaans letters intact", () => {
    const json = JSON.stringify(result.items);
    for (const ch of ["ê", "ë", "ô", "ï", "'n "]) expect(json).toContain(ch);
    expect(json).not.toMatch(/\\\\_/);
  });

  it("stores two-blank grammar items and their alternatives", () => {
    const far = lessons.flatMap((l) => (l.type === "lesson" ? l.grammar.items : [])).find((g) => g.prompt === "far" && g.blanks);
    expect(far?.blanks).toEqual([
      ["farther", "further"],
      ["farthest", "furthest"],
    ]);
  });

  it("stores choices for words that sound the same and fact or opinion", () => {
    const items = lessons.flatMap((l) => (l.type === "lesson" ? l.grammar.items : []));
    expect(items.find((g) => g.prompt === "The farmers cut ___ pods open.")?.choices).toEqual(["their", "there"]);
    expect(items.find((g) => g.prompt === "Dieretuine is vervelig.")).toMatchObject({ accepted: ["M"], choices: ["F", "M"] });
  });

  it("only flags items that need checking", () => {
    const inReview = result.items.filter((i) => i.status === "in_review").map((i) => i.id);
    expect(inReview.sort()).toEqual(
      ["af-l3-karel-se-groentetuin", "af-l5-elke-druppel-tel", "en-l3-mias-lemonade-stand", "en-l5-why-sleep-matters"].sort(),
    );
  });
});

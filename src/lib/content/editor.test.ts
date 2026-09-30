import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { emptyForm, formChecks, fromForm, makeId, passageStats, toForm } from "./editor";
import type { ContentItem } from "./types";

const items = JSON.parse(readFileSync(join(__dirname, "../../../content/lessons.json"), "utf8")) as ContentItem[];

describe("lesson form", () => {
  it("turns every imported item into a form and back without changing it", () => {
    for (const item of items) {
      const rest: Partial<ContentItem> = { ...item };
      delete rest.status;
      delete rest.reviewNote;
      expect(fromForm(toForm(item)), item.id).toEqual(rest);
    }
  });

  it("makes ids like the import does", () => {
    expect(makeId("af", 3, "Karel se groentetuin")).toBe("af-l3-karel-se-groentetuin");
    expect(makeId("af", 3, "'n Nag by die sterrewag")).toBe("af-l3-n-nag-by-die-sterrewag");
    expect(makeId("en", 3, "Mia's Lemonade Stand")).toBe("en-l3-mia-s-lemonade-stand");
  });

  it("warns about missing answers, a wrong length and spelling words not in the passage", () => {
    const f = emptyForm("lesson", "af", 1, "animals");
    f.title = "Toets";
    f.passage = "Die hond hardloop.";
    f.spelling = "hond, kat";
    const messages = formChecks(f).map((c) => `${c.level}: ${c.message}`);
    expect(messages).toContain("problem: Question 1 has no correct answer.");
    expect(messages).toContain("problem: Vocabulary sentence 1 has no correct answer.");
    expect(messages.some((m) => /warning: The passage has 3 words: much shorter than Level 1's benchmark of about 70/.test(m))).toBe(true);
    expect(messages).toContain("warning: Spelling words not found in the passage: kat.");
    expect(messages.some((m) => /2 spelling words \(expected 10\)/.test(m))).toBe(true);
  });

  it("finds nothing wrong with a published lesson except its known notes", () => {
    const item = items.find((i) => i.id === "af-l1-my-hond-tokkie")!;
    expect(formChecks(toForm(item)).filter((c) => c.level === "problem")).toEqual([]);
  });

  it("counts words and sentence length for the benchmark box", () => {
    expect(passageStats("Ek sien 'n hond.\nDie hond blaf hard!")).toEqual({ words: 8, sentences: 2, average: 4 });
  });
});

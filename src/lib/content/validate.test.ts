import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateContentFile } from "./validate";

describe("validateContentFile", () => {
  const items = JSON.parse(readFileSync(join(__dirname, "../../../content/lessons.json"), "utf8"));

  it("accepts the converted lessons file", () => {
    const r = validateContentFile(items);
    expect(r.errors).toEqual([]);
    expect(r.valid).toHaveLength(130);
    expect(r.valid.every((v) => v.warnings.length === 0)).toBe(true);
  });

  it("rejects items with a broken answer or a missing field", () => {
    const broken = structuredClone(items[0]);
    broken.comprehension[0].answer = 9;
    delete broken.title;
    const r = validateContentFile([broken]);
    expect(r.valid).toHaveLength(0);
    expect(r.errors[0].messages.join(" ")).toMatch(/answer must point/);
    expect(r.errors[0].messages.join(" ")).toMatch(/title/);
  });

  it("rejects the same id twice", () => {
    const r = validateContentFile([items[0], items[0]]);
    expect(r.valid).toHaveLength(1);
    expect(r.errors[0].messages[0]).toMatch(/more than once/);
  });

  it("warns about items that do not match the lesson rules", () => {
    const short = structuredClone(items[1]);
    short.spelling = short.spelling.slice(0, 5);
    const r = validateContentFile(short);
    expect(r.valid[0].warnings).toContain("5 spelling words (expected 10).");
  });
});

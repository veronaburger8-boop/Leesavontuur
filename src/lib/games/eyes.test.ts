import { describe, expect, it } from "vitest";
import { clampStep, fireflySettings, flashMs, jumpSpot, makeGrid, nextStep, wordChoices } from "./eyes";

// A repeatable "random" for the tests.
const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

describe("eye games", () => {
  it("adapts the difficulty to how the session went", () => {
    expect(nextStep(5, 10, 9)).toBe(6);
    expect(nextStep(5, 10, 6)).toBe(5);
    expect(nextStep(5, 10, 3)).toBe(4);
    expect(nextStep(1, 10, 0)).toBe(1);
    expect(nextStep(20, 10, 10)).toBe(20);
    expect(clampStep(99)).toBe(20);
  });

  it("makes the firefly faster and the gold time shorter as the step rises", () => {
    expect(fireflySettings(10).speed).toBeGreaterThan(fireflySettings(1).speed);
    expect(fireflySettings(10).goldMs).toBeLessThan(fireflySettings(1).goldMs);
    expect(fireflySettings(10, true).speed).toBeLessThan(fireflySettings(10).speed);
  });

  it("builds a letter grid with 3 to 6 targets, words at higher steps", () => {
    const easy = makeGrid(1, [], seeded(3));
    expect(easy.cells).toHaveLength(12);
    expect(easy.cells.filter((c) => c === easy.target)).toHaveLength(3);
    const words = ["hond", "huis", "hoed", "kat", "kar", "kop", "boom", "bal"];
    const hard = makeGrid(16, words, seeded(7));
    expect(words).toContain(hard.target);
    expect(hard.cells.filter((c) => c === hard.target).length).toBeGreaterThanOrEqual(3);
  });

  it("flashes words shorter as the step rises, never below 180 ms", () => {
    expect(flashMs(1)).toBe(1242);
    expect(flashMs(20)).toBe(180);
  });

  it("offers the right word and two others, and jumps to a new area each time", () => {
    const choices = wordChoices("hond", ["hond", "huis", "kat", "hoed", "boom"], seeded(5));
    expect(choices).toHaveLength(3);
    expect(choices).toContain("hond");
    expect(new Set(choices).size).toBe(3);
    const a = jumpSpot(null, seeded(2));
    const b = jumpSpot(a, seeded(9));
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(0.35);
  });
});

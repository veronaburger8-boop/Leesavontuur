import { describe, expect, it } from "vitest";
import { calibrationVerdict, DEFAULT_SETTINGS, levelSuggestion, readyForNextLevel, type ResultScores, speedSteadyOrRising } from "./levels";

const lesson = (i: number, pct: number, wpm = 100, extra: Partial<ResultScores> = {}): ResultScores => ({
  completed_at: `2026-10-${String(10 + i).padStart(2, "0")}T10:00:00Z`,
  words_per_minute: wpm,
  comprehension_pct: pct,
  spelling_pct: pct,
  grammar_pct: pct,
  vocabulary_pct: pct,
  content_type: "lesson",
  level: 3,
  is_challenge: false,
  ...extra,
});

describe("calibrationVerdict", () => {
  it("follows the owner's rule", () => {
    expect(calibrationVerdict(3, 4, 5, 7)).toBe("fits");
    expect(calibrationVerdict(4, 4, 5, 7)).toBe("fits");
    expect(calibrationVerdict(4, 4, 6, 7)).toBe("up");
    expect(calibrationVerdict(4, 4, 7, 7)).toBe("up");
    expect(calibrationVerdict(1, 4, 7, 7)).toBe("down");
    expect(calibrationVerdict(4, 4, 3, 7)).toBe("down");
    expect(calibrationVerdict(2, 4, 4, 7)).toBe("fits");
  });
});

describe("readyForNextLevel", () => {
  const five = [1, 2, 3, 4, 5].map((i) => lesson(i, 95, 100 + i));

  it("needs 5 lessons at 90%+ in every score", () => {
    expect(readyForNextLevel(five, 3, 5, 0, DEFAULT_SETTINGS)).toBe(true);
    expect(readyForNextLevel(five.slice(0, 4), 3, 4, 0, DEFAULT_SETTINGS)).toBe(false);
    const oneLow = [...five.slice(0, 4), lesson(5, 95, 105, { grammar_pct: 40 })];
    expect(readyForNextLevel(oneLow, 3, 5, 0, DEFAULT_SETTINGS)).toBe(false);
  });

  it("waits 3 lessons after 'Not yet'", () => {
    expect(readyForNextLevel(five, 3, 6, 5, DEFAULT_SETTINGS)).toBe(false);
    expect(readyForNextLevel(five, 3, 8, 5, DEFAULT_SETTINGS)).toBe(true);
  });

  it("needs a steady or rising reading speed", () => {
    const slowing = [1, 2, 3, 4, 5].map((i) => lesson(i, 95, 200 - i * 20));
    expect(speedSteadyOrRising([...slowing].reverse())).toBe(false);
    expect(readyForNextLevel(slowing, 3, 5, 0, DEFAULT_SETTINGS)).toBe(false);
  });

  it("ignores calibrations, challenge lessons and other levels, and stops at the highest level", () => {
    const mixed = [...five.slice(0, 4), lesson(9, 95, 110, { is_challenge: true })];
    expect(readyForNextLevel(mixed, 3, 5, 0, DEFAULT_SETTINGS)).toBe(false);
    expect(readyForNextLevel(five.map((r) => ({ ...r, level: 5 })), 5, 5, 0, DEFAULT_SETTINGS)).toBe(false);
  });
});

describe("levelSuggestion", () => {
  it("suggests up at 90%+ and down below 50%", () => {
    expect(levelSuggestion([1, 2, 3, 4, 5].map((i) => lesson(i, 92)), 3, 5, 0, DEFAULT_SETTINGS)).toEqual({ direction: "up", average: 92 });
    expect(levelSuggestion([1, 2, 3, 4, 5].map((i) => lesson(i, 40)), 3, 5, 0, DEFAULT_SETTINGS)).toEqual({ direction: "down", average: 40 });
    expect(levelSuggestion([1, 2, 3, 4, 5].map((i) => lesson(i, 70)), 3, 5, 0, DEFAULT_SETTINGS)).toBeNull();
  });

  it("waits after 'Ignore' and never suggests below Level 1", () => {
    const low = [1, 2, 3, 4, 5].map((i) => lesson(i, 30, 100, { level: 1 }));
    expect(levelSuggestion(low, 1, 5, 0, DEFAULT_SETTINGS)).toBeNull();
    const high = [1, 2, 3, 4, 5].map((i) => lesson(i, 95));
    expect(levelSuggestion(high, 3, 7, 5, DEFAULT_SETTINGS)).toBeNull();
    expect(levelSuggestion(high, 3, 10, 5, DEFAULT_SETTINGS)).not.toBeNull();
  });
});

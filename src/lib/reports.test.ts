import { describe, expect, it } from "vitest";
import { averages, monthSummary, type ReportResult, reportRows, speedPoints, speedTicks } from "./reports";

const r = (day: string, extra: Partial<ReportResult> = {}): ReportResult => ({
  completed_at: `2026-${day}T08:00:00Z`,
  content_title: "Les",
  content_type: "lesson",
  level: 3,
  is_challenge: false,
  words_per_minute: 100,
  unusually_fast: false,
  comprehension_pct: 80,
  spelling_pct: 90,
  grammar_pct: 100,
  vocabulary_pct: 60,
  ...extra,
});

describe("reports", () => {
  const results = [
    r("09-10", { words_per_minute: 90, comprehension_pct: 60 }),
    r("09-12", { words_per_minute: 110, comprehension_pct: 100 }),
    r("09-11", { content_type: "calibration", grammar_pct: null, vocabulary_pct: null, comprehension_pct: 25 }),
    r("09-13", { words_per_minute: 500, unusually_fast: true }),
    r("09-14", { is_challenge: true, level: 4, comprehension_pct: 0 }),
    r("08-30", { level: 2 }),
  ];

  it("lists one level oldest first", () => {
    const rows = reportRows(results, 3);
    expect(rows.map((x) => x.completed_at.slice(5, 10))).toEqual(["09-10", "09-11", "09-12", "09-13"]);
  });

  it("averages lessons only, without impossibly fast speeds", () => {
    const a = averages(reportRows(results, 3));
    expect(a.words_per_minute).toBe(100); // (90 + 110) / 2, the 500 is left out
    expect(a.comprehension_pct).toBe(80); // (60 + 100 + 80) / 3, calibration left out
    expect(a.vocabulary_pct).toBe(60);
  });

  it("summarises the month in South African time", () => {
    const s = monthSummary(results, new Date("2026-09-20T10:00:00Z"));
    expect(s.lessons).toBe(4); // 10, 12, 13, 14 September
    expect(s.comprehension).toBe(60); // (60 + 100 + 80 + 0) / 4
    expect(monthSummary([r("09-30", { completed_at: "2026-09-30T23:30:00Z" })], new Date("2026-10-01T08:00:00Z")).lessons).toBe(1);
  });

  it("charts believable speeds only, with round ticks", () => {
    expect(speedPoints(results).map((p) => p.wpm)).toEqual([100, 90, 100, 110, 100]);
    expect(speedTicks(137)).toEqual([0, 25, 50, 75, 100, 125, 150]);
    expect(speedTicks(212)).toEqual([0, 50, 100, 150, 200, 250]);
  });
});

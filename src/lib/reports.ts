// Report calculations (brief, section 5): one row per lesson with an
// average row, calibrations marked, and a summary line for the month.

export interface ReportResult {
  completed_at: string;
  content_title: string;
  content_type: "lesson" | "calibration";
  level: number;
  is_challenge: boolean;
  words_per_minute: number | null;
  unusually_fast: boolean;
  comprehension_pct: number | null;
  spelling_pct: number | null;
  grammar_pct: number | null;
  vocabulary_pct: number | null;
}

export type ScoreKey = "words_per_minute" | "comprehension_pct" | "spelling_pct" | "grammar_pct" | "vocabulary_pct";
export const SCORE_KEYS: ScoreKey[] = ["words_per_minute", "comprehension_pct", "spelling_pct", "grammar_pct", "vocabulary_pct"];

const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

/** Rows at one level, oldest first (like the original program's report). */
export function reportRows(results: ReportResult[], level: number): ReportResult[] {
  return results.filter((r) => r.level === level).sort((a, b) => a.completed_at.localeCompare(b.completed_at));
}

/**
 * The average row. Calibrations and challenge lessons are shown but left out
 * of the averages (a calibration has no grammar or vocabulary score, and a
 * challenge lesson is from another level). Impossibly fast readings are left
 * out of the reading-speed average.
 */
export function averages(rows: ReportResult[]): Record<ScoreKey, number | null> {
  const lessons = rows.filter((r) => r.content_type === "lesson" && !r.is_challenge);
  const out = {} as Record<ScoreKey, number | null>;
  for (const k of SCORE_KEYS) {
    const values = lessons
      .filter((r) => !(k === "words_per_minute" && r.unusually_fast))
      .map((r) => r[k])
      .filter((v): v is number => typeof v === "number");
    out[k] = avg(values);
  }
  return out;
}

/** Year and month of a date in South Africa, e.g. "2026-09". */
export const saMonth = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit" }).format(new Date(iso)).slice(0, 7);

/** Lessons this month (in one language, all levels) and their average comprehension. */
export function monthSummary(results: ReportResult[], now: Date): { lessons: number; comprehension: number | null } {
  const month = saMonth(now.toISOString());
  const lessons = results.filter((r) => r.content_type === "lesson" && saMonth(r.completed_at) === month);
  return { lessons: lessons.length, comprehension: avg(lessons.map((r) => r.comprehension_pct).filter((v): v is number => typeof v === "number")) };
}

/** Points for the reading-speed chart: every result with a believable speed, oldest first. */
export function speedPoints(results: ReportResult[]) {
  return results
    .filter((r) => typeof r.words_per_minute === "number" && !r.unusually_fast)
    .sort((a, b) => a.completed_at.localeCompare(b.completed_at))
    .map((r) => ({ at: r.completed_at, wpm: r.words_per_minute as number, level: r.level, title: r.content_title, calibration: r.content_type === "calibration" }));
}

/** Round, even axis ticks from 0 to just above the highest value. */
export function speedTicks(max: number): number[] {
  const step = max <= 60 ? 10 : max <= 150 ? 25 : max <= 300 ? 50 : 100;
  const top = Math.max(step, Math.ceil(max / step) * step);
  const ticks: number[] = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  return ticks;
}

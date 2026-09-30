// Rules for calibration and levels (brief, section 3, and the owner's
// decisions in section 11). No level ever changes by itself: these only
// produce suggestions and prompts.

export interface Settings {
  prompt_lessons: number;
  prompt_min_pct: number;
  prompt_wait_lessons: number;
  challenge_pass_pct: number;
  suggest_lessons: number;
  suggest_up_pct: number;
  suggest_down_pct: number;
  suggest_wait_lessons: number;
}

export const DEFAULT_SETTINGS: Settings = {
  prompt_lessons: 5,
  prompt_min_pct: 90,
  prompt_wait_lessons: 3,
  challenge_pass_pct: 80,
  suggest_lessons: 5,
  suggest_up_pct: 90,
  suggest_down_pct: 50,
  suggest_wait_lessons: 5,
};

/** Highest level with content at the moment (Levels 6–15 come later). */
export const HIGHEST_LEVEL_WITH_CONTENT = 5;

// ---------------------------------------------------------------- calibration

export type CalibrationVerdict = "fits" | "up" | "down";

/**
 * The owner's calibration rule: the level fits with at least 3 of 4 questions
 * and 5 of 7 spelling words right; test one level up with 4 of 4 and at least
 * 6 of 7; test one level down with at most 1 of 4 or at most 3 of 7.
 * Scaled to the actual number of questions and words.
 */
export function calibrationVerdict(comprehensionRight: number, questions: number, spellingRight: number, words: number): CalibrationVerdict {
  const comp = questions ? comprehensionRight / questions : 0;
  const spell = words ? spellingRight / words : 0;
  if (comp <= 1 / 4 || spell <= 3 / 7) return "down";
  if (comp >= 1 && spell >= 6 / 7) return "up";
  return "fits";
}

// ---------------------------------------------------------------- results

export interface ResultScores {
  completed_at: string;
  words_per_minute: number | null;
  comprehension_pct: number | null;
  spelling_pct: number | null;
  grammar_pct: number | null;
  vocabulary_pct: number | null;
  content_type: "lesson" | "calibration";
  level: number;
  is_challenge: boolean;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Regular lessons at the given level, newest first. */
export function levelLessons(results: ResultScores[], level: number): ResultScores[] {
  return results
    .filter((r) => r.content_type === "lesson" && !r.is_challenge && r.level === level)
    .sort((a, b) => b.completed_at.localeCompare(a.completed_at));
}

/** Average of the four scores of one lesson. */
export const lessonAverage = (r: Pick<ResultScores, "comprehension_pct" | "spelling_pct" | "grammar_pct" | "vocabulary_pct">) =>
  mean([r.comprehension_pct ?? 0, r.spelling_pct ?? 0, r.grammar_pct ?? 0, r.vocabulary_pct ?? 0]);

/** Reading speed is steady or rising: the newer half is not more than 5% slower than the older half. */
export function speedSteadyOrRising(newestFirst: ResultScores[]): boolean {
  const speeds = newestFirst.map((r) => r.words_per_minute).filter((w): w is number => typeof w === "number");
  if (speeds.length < 2) return true;
  const half = Math.floor(speeds.length / 2);
  const newer = mean(speeds.slice(0, half));
  const older = mean(speeds.slice(speeds.length - half));
  return newer >= older * 0.95;
}

/**
 * The child's "Ready for the next level?" prompt: the last N lessons at this
 * level average at least the minimum in each of the four scores, reading
 * speed is steady or rising, and enough lessons have passed since "Not yet".
 */
export function readyForNextLevel(
  results: ResultScores[],
  level: number,
  totalLessonsInLanguage: number,
  promptSnoozedAt: number,
  s: Settings,
): boolean {
  if (level >= HIGHEST_LEVEL_WITH_CONTENT) return false;
  if (promptSnoozedAt > 0 && totalLessonsInLanguage < promptSnoozedAt + s.prompt_wait_lessons) return false;
  const recent = levelLessons(results, level).slice(0, s.prompt_lessons);
  if (recent.length < s.prompt_lessons) return false;
  const keys = ["comprehension_pct", "spelling_pct", "grammar_pct", "vocabulary_pct"] as const;
  const allHigh = keys.every((k) => mean(recent.map((r) => r[k] ?? 0)) >= s.prompt_min_pct);
  return allHigh && speedSteadyOrRising(recent);
}

export type Suggestion = { direction: "up" | "down"; average: number } | null;

/** The parent's level suggestion from the average of the last N lessons at this level. */
export function levelSuggestion(
  results: ResultScores[],
  level: number,
  totalLessonsInLanguage: number,
  suggestionSnoozedAt: number,
  s: Settings,
): Suggestion {
  if (suggestionSnoozedAt > 0 && totalLessonsInLanguage < suggestionSnoozedAt + s.suggest_wait_lessons) return null;
  const recent = levelLessons(results, level).slice(0, s.suggest_lessons);
  if (recent.length < s.suggest_lessons) return null;
  const average = Math.round(mean(recent.map(lessonAverage)));
  if (average >= s.suggest_up_pct && level < HIGHEST_LEVEL_WITH_CONTENT) return { direction: "up", average };
  if (average < s.suggest_down_pct && level > 1) return { direction: "down", average };
  return null;
}

/** Whether a child in this grade is younger than the recommended start (Grade 1, Term 3). */
export const belowRecommendedGrade = (grade: number | null) => grade !== null && grade <= 1;

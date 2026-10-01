// Eye-movement games (brief, section 7). No camera: the games train smooth
// following (firefly), scanning (find it) and quick jumps (jumping words).
// Difficulty is a step from 1 to 20 that adapts to each child.

export type EyeGame = "vuurvliegie" | "soek" | "springwoorde";
export const EYE_GAMES: EyeGame[] = ["vuurvliegie", "soek", "springwoorde"];

export const MIN_STEP = 1;
export const MAX_STEP = 20;
export const clampStep = (n: number) => Math.min(MAX_STEP, Math.max(MIN_STEP, Math.round(n) || MIN_STEP));

/** After a session: up a step when nearly everything went well, down when it was hard. */
export function nextStep(step: number, tries: number, hits: number): number {
  if (tries === 0) return clampStep(step);
  const rate = hits / tries;
  if (rate >= 0.8) return clampStep(step + 1);
  if (rate < 0.5) return clampStep(step - 1);
  return clampStep(step);
}

// ---------------------------------------------------------------- Catch the firefly

/** Speed in screen-widths per second, and how long the firefly stays gold (ms). */
export function fireflySettings(step: number, calm = false) {
  const s = clampStep(step);
  return {
    speed: (0.08 + s * 0.012) * (calm ? 0.6 : 1),
    goldMs: Math.max(900, 2200 - s * 65),
  };
}

/** A smooth looping path across the play area (0–1 in both directions). */
export function fireflyAt(t: number) {
  return {
    x: 0.5 + 0.42 * Math.sin(t * 1.0) * Math.cos(t * 0.31),
    y: 0.5 + 0.38 * Math.sin(t * 0.73 + 1.1),
  };
}

// ---------------------------------------------------------------- Find it

/** Letters that are easily mixed up, used as distractors at higher steps. */
const LOOKALIKES: Record<string, string[]> = {
  b: ["d", "p", "q", "h"],
  d: ["b", "p", "q", "a"],
  p: ["q", "b", "d", "g"],
  m: ["n", "w", "u", "h"],
  n: ["m", "u", "h", "r"],
  e: ["c", "o", "a", "ê"],
  a: ["o", "e", "d", "g"],
  s: ["z", "c", "e", "a"],
};
const TARGETS = Object.keys(LOOKALIKES);
const OTHERS = "abcdefghijklmnoprstuvwyz".split("");

export interface Grid {
  target: string;
  cells: string[];
  cols: number;
}

/** A grid of letters (or short words) with 3 to 6 targets to find. */
export function makeGrid(step: number, words: string[], random: () => number = Math.random): Grid {
  const s = clampStep(step);
  const pick = <T,>(list: T[]) => list[Math.floor(random() * list.length)];
  const shortWords = [...new Set(words.filter((w) => w.length >= 3 && w.length <= 5))];
  const useWords = s >= 8 && shortWords.length >= 6;
  // Words need wider cells, so fewer columns (it must still fit a phone).
  const cols = Math.min(useWords ? 5 : 8, 4 + Math.floor(s / 4));
  const rows = Math.min(6, 3 + Math.floor(s / 5));
  const size = cols * rows;
  const count = Math.min(6, 3 + Math.floor(s / 6));

  let target: string;
  let distractor: () => string;
  if (useWords) {
    target = pick(shortWords);
    // Similar words first: same first letter or same length.
    const near = shortWords.filter((w) => w !== target && (w[0] === target[0] || w.length === target.length));
    const pool = near.length >= 3 ? near : shortWords.filter((w) => w !== target);
    distractor = () => pick(pool);
  } else {
    target = pick(TARGETS);
    const hard = LOOKALIKES[target];
    const easy = OTHERS.filter((l) => l !== target && !hard.includes(l));
    // More look-alike letters as the step goes up.
    distractor = () => (random() < Math.min(0.75, s * 0.06) ? pick(hard) : pick(easy));
  }
  const cells = Array.from({ length: size }, distractor);
  const spots = new Set<number>();
  while (spots.size < count) spots.add(Math.floor(random() * size));
  for (const i of spots) cells[i] = target;
  return { target, cells, cols };
}

// ---------------------------------------------------------------- Jumping words

/** How long the word shows (ms): shorter as the child improves. */
export const flashMs = (step: number) => Math.max(180, 1300 - clampStep(step) * 58);

/** The word plus two others to choose from, in a random order. */
export function wordChoices(word: string, words: string[], random: () => number = Math.random): string[] {
  const others = [...new Set(words.filter((w) => w !== word))];
  const similar = others.filter((w) => w[0] === word[0] || Math.abs(w.length - word.length) <= 1);
  const pool = similar.length >= 2 ? similar : others;
  const picked: string[] = [];
  while (picked.length < 2 && pool.length > picked.length) {
    const w = pool[Math.floor(random() * pool.length)];
    if (!picked.includes(w)) picked.push(w);
  }
  const all = [word, ...picked];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

/** A spot for the word (0–1 across and down), never the same area twice in a row. */
export function jumpSpot(previous: { x: number; y: number } | null, random: () => number = Math.random) {
  for (;;) {
    const spot = { x: 0.1 + random() * 0.8, y: 0.12 + random() * 0.76 };
    if (!previous || Math.hypot(spot.x - previous.x, spot.y - previous.y) > 0.35) return spot;
  }
}

"use client";

import { useState } from "react";
import type { Language } from "@/lib/content/types";
import { type Grid, makeGrid } from "@/lib/games/eyes";
import { EYE_TEXT } from "@/lib/games/eye-text";
import type { GameResult } from "./eye-shell";

const GRIDS = 3;

/**
 * Find it: find every copy of the target letter or word in a grid. Trains
 * scanning from left to right, row by row. Three grids per session.
 */
export function FindIt({ step, words, language, finish }: { step: number; words: string[]; language: Language; finish: (r: GameResult) => void }) {
  const t = EYE_TEXT[language].soek;
  const [grid, setGrid] = useState<Grid>(() => makeGrid(step, words));
  const [found, setFound] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<number | null>(null);
  const [done, setDone] = useState(0);
  const [score, setScore] = useState({ tries: 0, hits: 0 });
  const total = grid.cells.filter((c) => c === grid.target).length;

  const tap = (i: number) => {
    if (found.has(i)) return;
    if (grid.cells[i] !== grid.target) {
      setWrong(i);
      setScore((s) => ({ ...s, tries: s.tries + 1 }));
      return;
    }
    const nowFound = new Set(found).add(i);
    const nextScore = { tries: score.tries + 1, hits: score.hits + 1 };
    setFound(nowFound);
    setWrong(null);
    setScore(nextScore);
    if (nowFound.size === total) {
      if (done + 1 >= GRIDS) finish(nextScore);
      else {
        setDone(done + 1);
        setFound(new Set());
        setGrid(makeGrid(step, words));
      }
    }
  };

  return (
    <>
      <p className="find-target" aria-live="polite">
        {t.find} <strong>{grid.target}</strong>
        <span className="sub"> · {t.left(total - found.size)}</span>
      </p>
      <div className="find-grid" style={{ gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))` }} role="group" aria-label={EYE_TEXT[language].playArea}>
        {grid.cells.map((c, i) => (
          <button
            key={`${done}-${i}`}
            type="button"
            className={found.has(i) ? "found" : wrong === i ? "wrong" : ""}
            aria-pressed={found.has(i)}
            onClick={() => tap(i)}
          >
            {c}
          </button>
        ))}
      </div>
    </>
  );
}

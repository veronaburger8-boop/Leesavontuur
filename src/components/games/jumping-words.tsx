"use client";

import { useEffect, useRef, useState } from "react";
import type { Language } from "@/lib/content/types";
import { flashMs, jumpSpot, wordChoices } from "@/lib/games/eyes";
import { shuffled } from "@/lib/games/galgie";
import { EYE_TEXT } from "@/lib/games/eye-text";
import type { GameResult } from "./eye-shell";

const ROUNDS = 8;

type Phase = { kind: "ready" } | { kind: "show"; x: number; y: number } | { kind: "choose"; choices: string[] } | { kind: "answer"; correct: boolean; choices: string[] };

/**
 * Jumping words: a word appears briefly at a new place on the screen (a quick
 * eye jump), then the child picks the word they saw from three.
 */
export function JumpingWords({ step, words, language, finish }: { step: number; words: string[]; language: Language; finish: (r: GameResult) => void }) {
  const t = EYE_TEXT[language].springwoorde;
  const [list] = useState(() => shuffled(words).slice(0, ROUNDS));
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>({ kind: "ready" });
  const score = useRef({ tries: 0, hits: 0 });
  const spot = useRef<{ x: number; y: number } | null>(null);
  const word = list[round];

  // ready → show (a moment) → choose
  useEffect(() => {
    if (phase.kind === "ready") {
      const id = setTimeout(() => {
        spot.current = jumpSpot(spot.current);
        setPhase({ kind: "show", ...spot.current });
      }, 900);
      return () => clearTimeout(id);
    }
    if (phase.kind === "show") {
      const id = setTimeout(() => setPhase({ kind: "choose", choices: wordChoices(word, words) }), flashMs(step));
      return () => clearTimeout(id);
    }
  }, [phase, step, word, words]);

  const choose = (w: string) => {
    if (phase.kind !== "choose") return;
    const correct = w === word;
    score.current.tries++;
    if (correct) score.current.hits++;
    setPhase({ kind: "answer", correct, choices: phase.choices });
  };

  const next = () => {
    if (round + 1 >= list.length) finish({ ...score.current });
    else {
      setRound(round + 1);
      setPhase({ kind: "ready" });
    }
  };

  return (
    <>
      <p className="sub eye-message" aria-live="polite">
        {phase.kind === "ready" ? t.ready : phase.kind === "choose" ? t.which : phase.kind === "answer" ? (phase.correct ? t.right : t.wrong(word)) : " "}
      </p>
      <div className="jump-area" role="group" aria-label={EYE_TEXT[language].playArea}>
        {phase.kind === "ready" && <span className="jump-dot" aria-hidden="true" />}
        {phase.kind === "show" && (
          <span className="jump-word" style={{ left: `${phase.x * 100}%`, top: `${phase.y * 100}%` }}>
            {word}
          </span>
        )}
        {(phase.kind === "choose" || phase.kind === "answer") && (
          <div className="jump-choices">
            {phase.choices.map((c) => (
              <button
                key={c}
                type="button"
                className={phase.kind === "answer" && c === word ? "right" : ""}
                disabled={phase.kind === "answer"}
                onClick={() => choose(c)}
              >
                {c}
              </button>
            ))}
            {phase.kind === "answer" && (
              <button className="primary" type="button" onClick={next} autoFocus>
                ▶
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

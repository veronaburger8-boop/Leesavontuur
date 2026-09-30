"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Meerkat } from "@/components/art/meerkat";
import type { Language } from "@/lib/content/types";
import { LETTERS, roundState, SPECIAL } from "@/lib/games/galgie";

const TEXT = {
  af: {
    title: "Galgie",
    intro: "Raai die woord voordat al die ballonne bars!",
    wrong: "Verkeerde letters",
    won: "Mooi so! Die woord is",
    lost: "Ai, al die ballonne het gebars. Die woord was",
    next: "Volgende woord",
    done: "Klaar speel",
    score: (w: number, n: number) => `${w} van ${n} woorde reg`,
    left: (n: number) => `${n} ballonne oor`,
    letters: "Letters",
    word: "Die woord",
    unknown: "onbekende letter",
  },
  en: {
    title: "Hangman",
    intro: "Guess the word before all the balloons pop!",
    wrong: "Wrong letters",
    won: "Well done! The word is",
    lost: "Oh no, all the balloons popped. The word was",
    next: "Next word",
    done: "Stop playing",
    score: (w: number, n: number) => `${w} of ${n} words right`,
    left: (n: number) => `${n} balloons left`,
    letters: "Letters",
    word: "The word",
    unknown: "unknown letter",
  },
};

const COLOURS = ["#e8574a", "#f4be3a", "#4c9a5b", "#3f8fd2", "#9b6bc9", "#ef8a3c", "#e46aa0"];
// Where each balloon floats, around Mika's paws.
const SPOTS = [
  [60, 40],
  [100, 28],
  [140, 40],
  [40, 80],
  [80, 72],
  [120, 72],
  [160, 80],
];

function Balloons({ left, label }: { left: number; label: string }) {
  return (
    <svg viewBox="0 0 200 250" className="balloons" role="img" aria-label={label}>
      {SPOTS.map(([x, y], i) => {
        const popped = i >= left;
        return (
          <g key={i} className={popped ? "balloon popped" : "balloon"}>
            {!popped && <path d={`M${x} ${y + 26} Q${(x + 100) / 2 + (i % 2 ? 6 : -6)} ${(y + 170) / 2} 100 170`} fill="none" stroke="#7a8b99" strokeWidth="1.5" />}
            {popped ? (
              <g className="pop" stroke={COLOURS[i]} strokeWidth="3" strokeLinecap="round">
                <path d={`M${x - 10} ${y} L${x - 4} ${y}`} />
                <path d={`M${x + 4} ${y} L${x + 10} ${y}`} />
                <path d={`M${x} ${y - 10} L${x} ${y - 4}`} />
                <path d={`M${x} ${y + 4} L${x} ${y + 10}`} />
              </g>
            ) : (
              <>
                <ellipse cx={x} cy={y} rx="18" ry="22" fill={COLOURS[i]} />
                <ellipse cx={x - 6} cy={y - 8} rx="4" ry="6" fill="#ffffff" opacity="0.45" />
                <path d={`M${x - 4} ${y + 24} L${x + 4} ${y + 24} L${x} ${y + 20} Z`} fill={COLOURS[i]} />
              </>
            )}
          </g>
        );
      })}
      <foreignObject x="60" y="150" width="80" height="100">
        <Meerkat size={70} reading={false} />
      </foreignObject>
    </svg>
  );
}

/**
 * Galgie: guess the word letter by letter. Every finished word is saved as
 * time played (for the parent report); it never counts towards lesson scores.
 */
export function Galgie({
  words,
  language,
  backHref,
  onRound,
}: {
  words: string[];
  language: Language;
  backHref: string;
  onRound: (seconds: number, won: boolean) => Promise<void>;
}) {
  const t = TEXT[language];
  const [index, setIndex] = useState(0);
  const [guessed, setGuessed] = useState<string[]>([]);
  const [score, setScore] = useState({ played: 0, won: 0 });
  const started = useRef<number | null>(null);
  const word = words[index % words.length];
  const state = roundState({ word, guessed });

  const guess = (letter: string) => {
    if (state.over || guessed.includes(letter)) return;
    started.current ??= Date.now();
    const next = [...guessed, letter];
    setGuessed(next);
    const after = roundState({ word, guessed: next });
    if (after.over) {
      const seconds = Math.min(600, Math.round((Date.now() - (started.current ?? Date.now())) / 1000));
      setScore((s) => ({ played: s.played + 1, won: s.won + (after.won ? 1 : 0) }));
      void onRound(seconds, after.won);
    }
  };

  const nextWord = () => {
    started.current = null;
    setGuessed([]);
    setIndex((i) => i + 1);
  };

  // Typing on a keyboard works too.
  const guessRef = useRef(guess);
  useEffect(() => {
    guessRef.current = guess;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.normalize("NFC").toLowerCase();
      if ([...LETTERS, ...SPECIAL].includes(k)) guessRef.current(k);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section className="panel galgie" lang={language}>
      <h1>🎈 {t.title}</h1>
      <p className="sub">{t.intro}</p>
      <div className="galgie-play">
        <Balloons left={state.balloonsLeft} label={t.left(state.balloonsLeft)} />
        <div className="galgie-board">
          <p className="galgie-word">
            <span className="sr-only">{`${t.word}: ${state.shown.map((c) => c ?? t.unknown).join(", ")}`}</span>
            {state.shown.map((c, i) => (
              <span key={i} className={c ? "found" : ""} aria-hidden="true">
                {c ?? (state.lost ? word[i] : "")}
              </span>
            ))}
          </p>
          <p className="sub" aria-live="polite">
            {t.left(state.balloonsLeft)}
            {state.wrong.length > 0 && (
              <>
                {" · "}
                {t.wrong}: <span className="galgie-wrong">{state.wrong.join(" ")}</span>
              </>
            )}
          </p>
          <div aria-live="polite">
            {state.won && (
              <p className="message ok">
                {t.won} <strong>{word}</strong>.
              </p>
            )}
            {state.lost && (
              <p className="message info">
                {t.lost} <strong>{word}</strong>.
              </p>
            )}
          </div>
          {state.over ? (
            <div className="row">
              <button className="primary" type="button" onClick={nextWord} autoFocus>
                {t.next}
              </button>
              <Link className="button" href={backHref}>
                {t.done}
              </Link>
            </div>
          ) : (
            <div className="galgie-keys" role="group" aria-label={t.letters}>
              {[...LETTERS, ...SPECIAL].map((l) => (
                <button
                  key={l}
                  type="button"
                  className={guessed.includes(l) ? (word.includes(l) ? "hit" : "miss") : ""}
                  disabled={guessed.includes(l)}
                  onClick={() => guess(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          )}
          {score.played > 0 && <p className="sub">{t.score(score.won, score.played)}</p>}
        </div>
      </div>
    </section>
  );
}

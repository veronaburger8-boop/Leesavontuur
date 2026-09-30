"use client";

import { useRef, useState } from "react";
import { spellingMatches } from "@/lib/lesson/logic";
import type { LessonText } from "@/lib/lesson/text";
import { inputProps, SpecialLetters, useTimers } from "./shared";

type Phase = "ready" | "flash" | "type" | "wait" | "result";

/**
 * Step 5: "Show the word", the word flashes, then the child types it. Two
 * tries; the word flashes again before the second. Only a correct first try scores.
 */
export function Spelling({ title, words, flashMs, t, onDone }: { title: string; words: string[]; flashMs: number; t: LessonText; onDone: (score: number) => void }) {
  const [wi, setWi] = useState(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [attempt, setAttempt] = useState(1);
  const [tries, setTries] = useState<string[]>([]);
  const [value, setValue] = useState("");
  const [lastOk, setLastOk] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const { later } = useTimers();
  const word = words[wi];
  const n = words.length;

  const flash = () => {
    setPhase("flash");
    later(() => {
      setValue("");
      setPhase("type");
    }, flashMs);
  };

  const check = () => {
    if (!value.trim() || phase !== "type") return;
    const typed = value;
    setTries((x) => [...x, typed]);
    if (spellingMatches(typed, word)) {
      if (attempt === 1) setScore((s) => s + 1);
      setLastOk(true);
      setPhase("result");
    } else if (attempt === 1) {
      setAttempt(2);
      setPhase("wait");
      later(flash, 1600);
    } else {
      setLastOk(false);
      setPhase("result");
    }
  };

  const next = () => {
    if (wi + 1 >= n) return onDone(score);
    setWi(wi + 1);
    setAttempt(1);
    setTries([]);
    setValue("");
    setPhase("ready");
  };

  return (
    <section className="panel">
      <h2>{title}</h2>
      <p className="sub">{t.spellIntro}</p>
      <div className="attempts" aria-live="polite">
        {tries.length
          ? tries.map((x, i) => (
              <div key={i}>
                {t.attempt(i + 1)}: <strong>{x}</strong>
              </div>
            ))
          : t.attempts}
      </div>
      <div className="flashbox">
        {phase === "ready" && (
          <button className="primary" autoFocus onClick={flash}>
            {t.ready}
          </button>
        )}
        {phase === "flash" && <span className="flashword">{word}</span>}
        {(phase === "type" || phase === "wait") && (
          <span className="flashword" aria-hidden="true">
            ?
          </span>
        )}
        {phase === "result" && (
          <div>
            <span className="flashword">{word}</span>
            <p className={`feedback ${lastOk ? "good" : "bad"}`}>{lastOk ? (attempt === 1 ? t.right : t.rightSecond) : t.rightSpelling}</p>
          </div>
        )}
      </div>
      {(phase === "type" || phase === "wait") && (
        <>
          <label htmlFor="spell" className="sr-only">
            {t.typeWord}
          </label>
          <input
            id="spell"
            ref={input}
            className="answer"
            {...inputProps}
            value={value}
            disabled={phase === "wait"}
            autoFocus
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && check()}
          />
          <SpecialLetters target={input} t={t} disabled={phase === "wait"} />
          <p className="feedback bad" aria-live="polite">
            {phase === "wait" ? t.lookAgain : ""}
          </p>
        </>
      )}
      <div className="player-nav">
        <span className="count">{t.wordOf(wi + 1, n, score)}</span>
        {phase === "type" && (
          <button className="primary" onClick={check}>
            {t.check}
          </button>
        )}
        {phase === "result" && (
          <button className="primary" autoFocus onClick={next}>
            {wi + 1 < n ? t.nextWord : t.finish}
          </button>
        )}
      </div>
    </section>
  );
}

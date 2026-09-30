"use client";

import { useRef, useState } from "react";
import type { Layout } from "@/lib/content/types";
import { IMPOSSIBLY_FAST, pages, wordsPerMinute } from "@/lib/lesson/logic";
import type { LessonText } from "@/lib/lesson/text";

export interface ReadingResult {
  wpm: number;
  unusuallyFast: boolean;
}

/**
 * Step 3: the whole passage at the child's own pace. The timer starts when the
 * passage appears and stops at "Finished". Long passages are split into pages.
 */
export function TimedReading({
  title,
  passage,
  layout,
  words,
  t,
  onDone,
}: {
  title: string;
  passage: string[];
  layout: Layout;
  words: number;
  t: LessonText;
  onDone: (r: ReadingResult) => void;
}) {
  const [phase, setPhase] = useState<"intro" | "reading" | "tooFast" | "result">("intro");
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<{ wpm: number; ms: number; fast: boolean } | null>(null);
  const started = useRef(0);
  const allPages = pages(passage, layout);

  const begin = () => {
    setPage(0);
    setPhase("reading");
    started.current = performance.now();
  };

  const finish = () => {
    const ms = performance.now() - started.current;
    const wpm = wordsPerMinute(words, ms);
    setResult({ wpm, ms, fast: false });
    setPhase(wpm > IMPOSSIBLY_FAST ? "tooFast" : "result");
  };

  if (phase === "intro")
    return (
      <section className="panel">
        <h2>{title}</h2>
        <p className="sub">{t.readIntro}</p>
        <div className="player-nav">
          <span />
          <button className="primary" autoFocus onClick={begin}>
            {t.startReading}
          </button>
        </div>
      </section>
    );

  if (phase === "reading") {
    const last = page === allPages.length - 1;
    return (
      <section className="panel">
        <h2>{title}</h2>
        <div className={`passage reading ${layout}`}>
          {allPages[page].map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <div className="player-nav">
          {allPages.length > 1 ? (
            <button disabled={page === 0} onClick={() => setPage(page - 1)}>
              {t.previous}
            </button>
          ) : (
            <span className="count">{t.ownPace}</span>
          )}
          {allPages.length > 1 && <span className="count">{t.page(page + 1, allPages.length)}</span>}
          {last ? (
            <button className="primary" onClick={finish}>
              {t.finished}
            </button>
          ) : (
            <button className="primary" onClick={() => setPage(page + 1)}>
              {t.next}
            </button>
          )}
        </div>
      </section>
    );
  }

  if (phase === "tooFast" && result)
    return (
      <section className="panel">
        <h2>{t.tooFastTitle}</h2>
        <p className="sub">{t.tooFast(result.wpm)}</p>
        <div className="player-nav">
          <button autoFocus onClick={begin}>
            {t.readAgain}
          </button>
          <button
            className="primary"
            onClick={() => {
              setResult({ ...result, fast: true });
              setPhase("result");
            }}
          >
            {t.continue}
          </button>
        </div>
      </section>
    );

  if (!result) return null;
  const secs = Math.round(result.ms / 1000);
  const time = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  return (
    <section className="panel celebrate">
      <div className="big">{result.wpm}</div>
      <h2>{t.wpm}</h2>
      <p className="sub">{t.readIn(time, words)}</p>
      <div className="player-nav">
        <button className="primary" autoFocus onClick={() => onDone({ wpm: result.wpm, unusuallyFast: result.fast })}>
          {t.goOn}
        </button>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import type { Layout } from "@/lib/content/types";
import { displayMs, type EyeMode, passageLines, wordGroups } from "@/lib/lesson/logic";
import type { LessonText } from "@/lib/lesson/text";
import { useTimers } from "./shared";

/**
 * Step 2: the passage flashes while the child just watches. Three modes:
 * whole lines, word groups of about 3 words, or a pacer sweeping along each line.
 */
export function EyeExercise({
  title,
  passage,
  layout,
  wpm,
  mode,
  t,
  onDone,
}: {
  title: string;
  passage: string[];
  layout: Layout;
  wpm: number;
  mode: EyeMode;
  t: LessonText;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<"ready" | "running" | "done">("ready");
  const [unit, setUnit] = useState<string | null>(null);
  const [activeLine, setActiveLine] = useState(-1);
  const [lineMs, setLineMs] = useState(0);
  const { later } = useTimers();
  const lines = passageLines(passage, layout);

  const start = () => {
    setPhase("running");
    if (mode === "pacer") {
      const step = (j: number) => {
        if (j >= lines.length) {
          setActiveLine(-1);
          later(() => setPhase("done"), 400);
          return;
        }
        const d = displayMs(lines[j], wpm, 700);
        setLineMs(d);
        setActiveLine(j);
        later(() => step(j + 1), d);
      };
      step(0);
      return;
    }
    const units = mode === "groups" ? wordGroups(passage) : lines;
    const minimum = mode === "groups" ? 450 : 700;
    const show = (k: number) => {
      if (k >= units.length) {
        setUnit(null);
        setPhase("done");
        return;
      }
      setUnit(units[k]);
      later(() => {
        setUnit(null);
        later(() => show(k + 1), 200);
      }, displayMs(units[k], wpm, minimum));
    };
    show(0);
  };

  return (
    <section className="panel">
      <h2>{title}</h2>
      <p className="sub">{t.eyeIntro}</p>
      <div className="eye-stage" aria-live="off">
        {phase === "ready" && (
          <button className="primary" autoFocus onClick={start}>
            {t.eyeStart}
          </button>
        )}
        {phase === "running" && mode !== "pacer" && unit && <p className="reading eye-text">{unit}</p>}
        {phase === "running" && mode === "pacer" && (
          <div className="reading pacer">
            {lines.map((l, j) => (
              <span
                key={j}
                className={`pace-line${j === activeLine ? " on" : ""}`}
                style={j === activeLine ? ({ "--dur": `${lineMs}ms` } as React.CSSProperties) : undefined}
              >
                {l}
                <span className="bar" />
              </span>
            ))}
          </div>
        )}
        {phase === "done" && (
          <div>
            <p className="q">{t.eyeDone}</p>
            <button className="primary" autoFocus onClick={onDone}>
              {t.goOn}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/** Shown instead of the eye exercise while the child has no measured reading speed yet. */
export function EyeSkipped({ title, t, onDone }: { title: string; t: LessonText; onDone: () => void }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <p className="message info">{t.eyeSkipped}</p>
      <div className="player-nav">
        <span />
        <button className="primary" autoFocus onClick={onDone}>
          {t.goOn}
        </button>
      </div>
    </section>
  );
}

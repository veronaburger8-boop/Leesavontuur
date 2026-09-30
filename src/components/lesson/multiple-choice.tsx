"use client";

import { useMemo, useState } from "react";
import { shuffleOptions } from "@/lib/lesson/logic";
import type { LessonText } from "@/lib/lesson/text";

export interface ChoiceQuestion {
  question: string;
  options: string[];
  answer: number;
}

/**
 * Steps 4 and 7: one question per screen, options in a random order, two
 * tries. Only a correct first try scores. Afterwards the correct option is
 * green and the wrong ones red.
 */
export function MultipleChoice({
  title,
  intro,
  questions,
  t,
  onDone,
}: {
  title: string;
  intro: string;
  questions: ChoiceQuestion[];
  t: LessonText;
  onDone: (score: number) => void;
}) {
  const shuffled = useMemo(() => questions.map((q) => ({ question: q.question, ...shuffleOptions(q.options, q.answer) })), [questions]);
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState<{ good: boolean; text: string } | null>(null);
  const q = shuffled[qi];
  const n = shuffled.length;

  const choose = (k: number) => {
    if (revealed || wrong.includes(k)) return;
    if (k === q.answer) {
      if (wrong.length === 0) setScore((s) => s + 1);
      setFeedback({ good: true, text: wrong.length === 0 ? t.right : t.rightSecond });
      setRevealed(true);
    } else {
      const tries = [...wrong, k];
      setWrong(tries);
      if (tries.length >= 2) {
        setFeedback({ good: false, text: t.shownGreen });
        setRevealed(true);
      } else setFeedback({ good: false, text: t.tryAgain });
    }
  };

  const next = () => {
    if (qi + 1 >= n) return onDone(score);
    setQi(qi + 1);
    setWrong([]);
    setRevealed(false);
    setFeedback(null);
  };

  return (
    <section className="panel">
      <h2>{title}</h2>
      <p className="sub">{intro}</p>
      <p className="q">{q.question}</p>
      <div className="opts">
        {q.options.map((o, k) => {
          const state = revealed ? (k === q.answer ? "right" : "wrong") : wrong.includes(k) ? "wrong" : "";
          return (
            <button key={`${qi}-${k}`} className={`opt ${state}`} disabled={revealed || wrong.includes(k)} onClick={() => choose(k)}>
              <span>{o}</span>
              <span className="mark" aria-hidden="true">
                {state === "right" ? "✓" : state === "wrong" ? "✗" : ""}
              </span>
            </button>
          );
        })}
      </div>
      <p className={`feedback ${feedback?.good ? "good" : "bad"}`} aria-live="polite">
        {feedback?.text}
      </p>
      <div className="player-nav">
        <span className="count">{t.questionOf(qi + 1, n, score)}</span>
        {revealed && (
          <button className="primary" autoFocus onClick={next}>
            {qi + 1 < n ? t.nextQuestion : t.finish}
          </button>
        )}
      </div>
    </section>
  );
}

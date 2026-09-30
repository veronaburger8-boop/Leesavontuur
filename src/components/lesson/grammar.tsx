"use client";

import { useRef, useState } from "react";
import type { Grammar } from "@/lib/content/types";
import { grammarBlanks, grammarCorrect, matches } from "@/lib/lesson/logic";
import type { LessonText } from "@/lib/lesson/text";
import { inputProps, SpecialLetters } from "./shared";

/**
 * Step 6: typed answers with one grammar focus. Items with fixed choices
 * (their/there, fact or opinion) get buttons instead. Two tries.
 */
export function GrammarStep({ title, grammar, t, onDone }: { title: string; grammar: Grammar; t: LessonText; onDone: (score: number, total: number) => void }) {
  const [qi, setQi] = useState(0);
  const [score, setScore] = useState(0);
  const [tries, setTries] = useState(0);
  const [done, setDone] = useState(false);
  const [values, setValues] = useState<string[]>(() => grammarBlanks(grammar.items[0]).map(() => ""));
  const [wrongChoices, setWrongChoices] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ good: boolean; text: string } | null>(null);
  const lastInput = useRef<HTMLInputElement | null>(null);
  const items = grammar.items;
  const item = items[qi];
  const blanks = grammarBlanks(item);
  const n = items.length;

  const submit = (typed: string[]) => {
    if (done || typed.some((v) => !v.trim())) return;
    if (grammarCorrect(item, typed)) {
      if (tries === 0) setScore((s) => s + 1);
      setFeedback({ good: true, text: tries === 0 ? t.right : t.rightSecond });
      setDone(true);
    } else if (tries === 0) {
      setTries(1);
      if (item.choices) setWrongChoices([typed[0]]);
      setFeedback({ good: false, text: t.tryAgain });
      lastInput.current?.select();
    } else {
      setFeedback({ good: false, text: t.answerIs(blanks.map((b) => b[0]).join(" – ")) });
      setDone(true);
    }
  };

  const next = () => {
    if (qi + 1 >= n) return onDone(score, n);
    const nextItem = items[qi + 1];
    setQi(qi + 1);
    setTries(0);
    setDone(false);
    setFeedback(null);
    setWrongChoices([]);
    setValues(grammarBlanks(nextItem).map(() => ""));
  };

  return (
    <section className="panel">
      <h2>{title}</h2>
      <div className="instr">{grammar.instruction}</div>
      <p className="q">
        {item.prompt}
        {!item.choices && (
          <>
            {" "}
            – {blanks.map((_, i) => <span key={i} className="blank">{i > 0 ? " – " : ""}______</span>)}
          </>
        )}
      </p>

      {item.choices ? (
        <div className="opts" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
          {item.choices.map((c) => {
            const isAnswer = matches(c, blanks[0]);
            return (
              <button
                key={c}
                className={`opt ${done ? (isAnswer ? "right" : "wrong") : wrongChoices.includes(c) ? "wrong" : ""}`}
                disabled={done || wrongChoices.includes(c)}
                onClick={() => submit([c])}
              >
                <span>{c}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <>
          <div className="row">
            {blanks.map((_, i) => (
              <input
                key={`${qi}-${i}`}
                className="answer"
                {...inputProps}
                aria-label={blanks.length > 1 ? `${t.yourAnswer} ${i + 1}` : t.yourAnswer}
                value={values[i] ?? ""}
                disabled={done}
                autoFocus={i === 0}
                style={blanks.length > 1 ? { maxWidth: 260 } : undefined}
                onFocus={(e) => (lastInput.current = e.currentTarget)}
                onChange={(e) => setValues((v) => v.map((x, k) => (k === i ? e.target.value : x)))}
                onKeyDown={(e) => e.key === "Enter" && (done ? next() : submit(values))}
              />
            ))}
          </div>
          <SpecialLetters target={lastInput} t={t} disabled={done} />
        </>
      )}

      <p className={`feedback ${feedback?.good ? "good" : "bad"}`} aria-live="polite">
        {feedback?.text}
      </p>
      <div className="player-nav">
        <span className="count">{t.questionOf(qi + 1, n, score)}</span>
        {done ? (
          <button className="primary" autoFocus onClick={next}>
            {qi + 1 < n ? t.nextQuestion : t.finish}
          </button>
        ) : (
          !item.choices && (
            <button className="primary" onClick={() => submit(values)}>
              {t.check}
            </button>
          )
        )}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Lesson } from "@/lib/content/types";
import { wordCount } from "@/lib/content/types";
import { eyeSpeed, type EyeMode, percent, spellingFlashMs } from "@/lib/lesson/logic";
import { lessonText, STEP_NAMES } from "@/lib/lesson/text";
import { EyeExercise, EyeSkipped } from "./eye-exercise";
import { GrammarStep } from "./grammar";
import { MultipleChoice } from "./multiple-choice";
import { Cheer } from "./shared";
import type { DisplayStyle } from "@/lib/lesson/next";
import { Spelling } from "./spelling";
import { type ReadingResult, TimedReading } from "./timed-reading";
import { WordCards } from "./word-cards";

export interface SaveOutcome {
  ok: boolean;
  promptLevel?: number;
  challenge?: { passed: boolean; toLevel: number };
}

export interface LessonResultInput {
  wordsPerMinute: number;
  unusuallyFast: boolean;
  comprehensionPct: number;
  spellingPct: number;
  grammarPct: number;
  vocabularyPct: number;
  eyeMode: EyeMode | null;
  durationSeconds: number;
}

type Scores = { comprehension?: number; spelling?: number; grammar?: number; vocabulary?: number };

// Screens: the 7 steps with an encouraging message after steps 4–7.
type Screen =
  | { step: 0 | 1 | 2 | 3 | 4 | 5 | 6 }
  | { cheer: "comprehension" | "spelling" | "grammar" | "vocabulary"; next: number | null }
  | { report: true };

/**
 * The 7-step lesson (brief, section 2), following the approved prototype.
 * In preview mode (admin) nothing is saved.
 */
export function LessonPlayer({
  lesson,
  learnerName,
  readingWpm,
  eyeMode,
  onSave,
  onAnswerPrompt,
  backHref,
  preview = false,
  displayStyle = "border",
  challengeLevel = null,
}: {
  lesson: Lesson;
  learnerName: string;
  /** The child's last measured reading speed, or null (then the eye exercise is skipped). */
  readingWpm: number | null;
  eyeMode: EyeMode;
  onSave?: (result: LessonResultInput) => Promise<SaveOutcome>;
  onAnswerPrompt?: (yes: boolean) => Promise<{ ok: boolean; mode?: "ask" | "auto" }>;
  backHref: string;
  preview?: boolean;
  /** How the passage is shown (parent setting): plain, coloured border or tinted background. */
  displayStyle?: DisplayStyle;
  /** Set when this is a challenge lesson from the next level. */
  challengeLevel?: number | null;
}) {
  const t = lessonText(lesson.language);
  const names = STEP_NAMES[lesson.language];
  const [screen, setScreen] = useState<Screen>({ step: lesson.wordCards.some((c) => !c.extra) ? 0 : 1 });
  const [reading, setReading] = useState<ReadingResult | null>(null);
  const [scores, setScores] = useState<Scores>({});
  // When the lesson started, for the time spent (set once).
  const [startedAt] = useState(() => Date.now());
  const words = wordCount(lesson.passage);
  const eyeWpm = readingWpm ? eyeSpeed(readingWpm) : null;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [screen]);

  const stepIndex = "step" in screen ? screen.step : "cheer" in screen ? cheerStep(screen.cheer) : 7;

  const finishStep = (key: keyof Scores, pct: number, next: number | null) => {
    setScores((s) => ({ ...s, [key]: pct }));
    setScreen({ cheer: key, next });
  };

  let body: React.ReactNode = null;
  if ("step" in screen) {
    switch (screen.step) {
      case 0:
        body = <WordCards title={names[0]} cards={lesson.wordCards} t={t} onDone={() => setScreen({ step: 1 })} />;
        break;
      case 1:
        body = eyeWpm ? (
          <EyeExercise
            title={names[1]}
            passage={lesson.passage}
            layout={lesson.layout}
            wpm={eyeWpm}
            mode={eyeMode}
            displayStyle={displayStyle}
            t={t}
            onDone={() => setScreen({ step: 2 })}
          />
        ) : (
          <EyeSkipped title={names[1]} t={t} onDone={() => setScreen({ step: 2 })} />
        );
        break;
      case 2:
        body = (
          <TimedReading
            title={names[2]}
            passage={lesson.passage}
            layout={lesson.layout}
            words={words}
            displayStyle={displayStyle}
            t={t}
            onDone={(r) => {
              setReading(r);
              setScreen({ step: 3 });
            }}
          />
        );
        break;
      case 3:
        body = (
          <MultipleChoice
            title={names[3]}
            intro={t.compIntro}
            questions={lesson.comprehension}
            t={t}
            onDone={(score) => finishStep("comprehension", percent(score, lesson.comprehension.length), 4)}
          />
        );
        break;
      case 4:
        body = (
          <Spelling
            title={names[4]}
            words={lesson.spelling}
            flashMs={spellingFlashMs(lesson.level)}
            t={t}
            onDone={(score) => finishStep("spelling", percent(score, lesson.spelling.length), 5)}
          />
        );
        break;
      case 5:
        body = <GrammarStep title={names[5]} grammar={lesson.grammar} t={t} onDone={(score, total) => finishStep("grammar", percent(score, total), 6)} />;
        break;
      case 6:
        body = (
          <MultipleChoice
            title={names[6]}
            intro={t.vocabIntro}
            questions={lesson.vocabulary.map((v) => ({ question: v.sentence, options: v.options, answer: v.answer }))}
            t={t}
            onDone={(score) => finishStep("vocabulary", percent(score, lesson.vocabulary.length), null)}
          />
        );
        break;
    }
  } else if ("cheer" in screen) {
    const next = screen.next;
    body = (
      <Cheer
        pct={scores[screen.cheer] ?? 0}
        name={learnerName}
        language={lesson.language}
        t={t}
        nextName={next === null ? null : names[next]}
        onNext={() => setScreen(next === null ? { report: true } : { step: next as 4 | 5 | 6 })}
      />
    );
  } else {
    body = (
      <Report
        lesson={lesson}
        learnerName={learnerName}
        reading={reading}
        scores={scores}
        eyeMode={eyeWpm ? eyeMode : null}
        startedAt={startedAt}
        onSave={preview ? undefined : onSave}
        onAnswerPrompt={onAnswerPrompt}
        backHref={backHref}
      />
    );
  }

  return (
    <div lang={lesson.language} className={lesson.level <= 2 ? "grade1" : undefined}>
      <nav className="path" aria-label={t.done}>
        {names.map((s, i) => (
          <div key={s} className={`stone${i < stepIndex ? " done" : i === stepIndex ? " now" : ""}`} title={s} aria-label={s}>
            {i + 1}
          </div>
        ))}
        <div className="path-label">{stepIndex < 7 ? t.stepOf(stepIndex + 1, 7, names[stepIndex]) : t.done}</div>
      </nav>
      {challengeLevel && <p className="message info" style={{ textAlign: "center" }}>{t.challengeBanner(challengeLevel)}</p>}
      {body}
    </div>
  );
}

const cheerStep = (key: keyof Scores) => ({ comprehension: 3, spelling: 4, grammar: 5, vocabulary: 6 })[key];

function Report({
  lesson,
  learnerName,
  reading,
  scores,
  eyeMode,
  startedAt,
  onSave,
  onAnswerPrompt,
  backHref,
}: {
  lesson: Lesson;
  learnerName: string;
  reading: ReadingResult | null;
  scores: Scores;
  eyeMode: EyeMode | null;
  startedAt: number;
  onSave?: (result: LessonResultInput) => Promise<SaveOutcome>;
  onAnswerPrompt?: (yes: boolean) => Promise<{ ok: boolean; mode?: "ask" | "auto" }>;
  backHref: string;
}) {
  const t = lessonText(lesson.language);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "failed">(onSave ? "saving" : "idle");
  const [outcome, setOutcome] = useState<SaveOutcome | null>(null);
  const sent = useRef(false);

  const save = useCallback(async () => {
    if (!onSave || !reading) return;
    setStatus("saving");
    try {
      const r = await onSave({
        wordsPerMinute: reading.wpm,
        unusuallyFast: reading.unusuallyFast,
        comprehensionPct: scores.comprehension ?? 0,
        spellingPct: scores.spelling ?? 0,
        grammarPct: scores.grammar ?? 0,
        vocabularyPct: scores.vocabulary ?? 0,
        eyeMode,
        durationSeconds: Math.round((Date.now() - startedAt) / 1000),
      });
      setStatus(r.ok ? "saved" : "failed");
      if (r.ok) setOutcome(r);
    } catch {
      setStatus("failed");
    }
  }, [onSave, reading, scores, eyeMode, startedAt]);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void save();
  }, [save]);

  const cell = (v?: number) => (v === undefined ? "–" : `${v}%`);
  return (
    <section className="panel">
      <h2>
        {t.report}
        {learnerName ? `, ${learnerName}` : ""}
      </h2>
      <p className="sub">
        {lesson.title} · {t.level} {lesson.level}
      </p>
      <div className="table-wrap">
        <table className="report-table">
          <thead>
            <tr>
              <th>W/min</th>
              <th>{t.comprehension}</th>
              <th>{t.spelling}</th>
              <th>{t.grammar}</th>
              <th>{t.vocabulary}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{reading?.wpm ?? "–"}</td>
              <td>{cell(scores.comprehension)}</td>
              <td>{cell(scores.spelling)}</td>
              <td>{cell(scores.grammar)}</td>
              <td>{cell(scores.vocabulary)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {reading && !reading.unusuallyFast && <p>{t.nextSpeed(eyeSpeed(reading.wpm))}</p>}
      {status === "saving" && <p className="message info">{t.saving}</p>}
      {status === "saved" && <p className="message ok">{t.saved}</p>}
      {status === "failed" && (
        <p className="message error">
          {t.saveFailed}{" "}
          <button className="small" onClick={() => void save()}>
            {t.retrySave}
          </button>
        </p>
      )}
      {outcome?.challenge && (
        <div className={`celebrate${outcome.challenge.passed ? " full" : ""}`} style={{ marginTop: 18 }}>
          {outcome.challenge.passed && (
            <div className="stars" aria-hidden="true">
              <span>⭐</span>
              <span>⭐</span>
              <span>⭐</span>
            </div>
          )}
          <h2>{outcome.challenge.passed ? t.challengePassed(learnerName, outcome.challenge.toLevel) : t.challengeFailed}</h2>
        </div>
      )}
      {outcome?.promptLevel && onAnswerPrompt && (
        <LevelPrompt t={t} name={learnerName} level={outcome.promptLevel - 1} next={outcome.promptLevel} onAnswer={onAnswerPrompt} />
      )}
      <div className="player-nav">
        <span />
        <Link className="button primary" href={backHref}>
          {t.backHome}
        </Link>
      </div>
    </section>
  );
}

/** "Ready for the next level?": the child can always say "Not yet". */
function LevelPrompt({
  t,
  name,
  level,
  next,
  onAnswer,
}: {
  t: ReturnType<typeof lessonText>;
  name: string;
  level: number;
  next: number;
  onAnswer: (yes: boolean) => Promise<{ ok: boolean; mode?: "ask" | "auto" }>;
}) {
  const [answer, setAnswer] = useState<null | "asked" | "auto" | "later">(null);
  const [busy, setBusy] = useState(false);
  const answerWith = async (yes: boolean) => {
    setBusy(true);
    const r = await onAnswer(yes);
    setBusy(false);
    if (r.ok) setAnswer(yes ? (r.mode === "auto" ? "auto" : "asked") : "later");
  };
  return (
    <div className="celebrate full" style={{ marginTop: 18, border: "3px solid var(--sun)", borderRadius: 18, padding: 18 }}>
      <div className="stars" aria-hidden="true">
        <span>⭐</span>
        <span>⭐</span>
        <span>⭐</span>
      </div>
      {answer === null ? (
        <>
          <h2>{t.promptTitle(name, level, next)}</h2>
          <div className="player-nav">
            <button onClick={() => answerWith(false)} disabled={busy}>
              {t.promptNo}
            </button>
            <button className="primary" autoFocus onClick={() => answerWith(true)} disabled={busy}>
              {t.promptYes}
            </button>
          </div>
        </>
      ) : (
        <h2 role="status">{answer === "asked" ? t.promptAsked : answer === "auto" ? t.promptAuto(next) : t.promptLater(level)}</h2>
      )}
    </div>
  );
}

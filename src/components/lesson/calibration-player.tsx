"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Calibration } from "@/lib/content/types";
import { wordCount } from "@/lib/content/types";
import type { CalibrationVerdict } from "@/lib/levels";
import { spellingFlashMs } from "@/lib/lesson/logic";
import type { DisplayStyle } from "@/lib/lesson/next";
import { lessonText, STEP_NAMES } from "@/lib/lesson/text";
import { MultipleChoice } from "./multiple-choice";
import { Spelling } from "./spelling";
import { type ReadingResult, TimedReading } from "./timed-reading";

export interface CalibrationResultInput {
  wordsPerMinute: number;
  unusuallyFast: boolean;
  comprehensionRight: number;
  questions: number;
  spellingRight: number;
  words: number;
  durationSeconds: number;
}

/**
 * The placement test (brief, section 3): timed reading, 4 comprehension
 * questions and 7 spelling words. No word cards, eye exercise, grammar or
 * vocabulary. The reading speed becomes the child's starting speed.
 */
export function CalibrationPlayer({
  item,
  learnerName,
  displayStyle,
  onSave,
  setLevel,
  parentLocale,
  backHref,
}: {
  item: Calibration;
  learnerName: string;
  displayStyle: DisplayStyle;
  onSave: (r: CalibrationResultInput) => Promise<{ ok: boolean; verdict?: CalibrationVerdict }>;
  /** Server action that sets the child's level (form field "level"). */
  setLevel: (formData: FormData) => Promise<void>;
  /** Language of the parent area, for the parent's part of the result. */
  parentLocale: "af" | "en";
  backHref: string;
}) {
  const t = lessonText(item.language);
  const names = STEP_NAMES[item.language];
  const steps = [names[2], names[3], names[4]];
  const [step, setStep] = useState(0);
  const [reading, setReading] = useState<ReadingResult | null>(null);
  const [comp, setComp] = useState(0);
  const [startedAt] = useState(() => Date.now());
  const [result, setResult] = useState<CalibrationResultInput | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  let body: React.ReactNode;
  if (step === 0)
    body = (
      <TimedReading
        title={names[2]}
        passage={item.passage}
        layout={item.layout}
        words={wordCount(item.passage)}
        displayStyle={displayStyle}
        t={t}
        onDone={(r) => {
          setReading(r);
          setStep(1);
        }}
      />
    );
  else if (step === 1)
    body = (
      <MultipleChoice
        title={names[3]}
        intro={t.compIntro}
        questions={item.comprehension}
        t={t}
        onDone={(score) => {
          setComp(score);
          setStep(2);
        }}
      />
    );
  else if (step === 2)
    body = (
      <Spelling
        title={names[4]}
        words={item.spelling}
        flashMs={spellingFlashMs(item.level)}
        t={t}
        onDone={(score) => {
          setResult({
            wordsPerMinute: reading?.wpm ?? 0,
            unusuallyFast: reading?.unusuallyFast ?? false,
            comprehensionRight: comp,
            questions: item.comprehension.length,
            spellingRight: score,
            words: item.spelling.length,
            durationSeconds: Math.round((Date.now() - startedAt) / 1000),
          });
          setStep(3);
        }}
      />
    );
  else
    body = result && (
      <CalibrationEnd
        t={t}
        name={learnerName}
        result={result}
        onSave={onSave}
        parentBox={(verdict) => (
          <ParentBox verdict={verdict} result={result} level={item.level} language={item.language} locale={parentLocale} setLevel={setLevel} backHref={backHref} />
        )}
        backHref={backHref}
      />
    );

  return (
    <div lang={item.language} className={item.level <= 2 ? "grade1" : undefined}>
      <nav className="path" aria-label={t.calibrationTitle}>
        {steps.map((s, i) => (
          <div key={s} className={`stone${i < step ? " done" : i === step ? " now" : ""}`} title={s} aria-label={s}>
            {i + 1}
          </div>
        ))}
        <div className="path-label">
          {t.calibrationTitle} · {step < 3 ? t.stepOf(step + 1, 3, steps[step]) : t.testDone}
        </div>
      </nav>
      {body}
    </div>
  );
}

function CalibrationEnd({
  t,
  name,
  result,
  onSave,
  parentBox,
  backHref,
}: {
  t: ReturnType<typeof lessonText>;
  name: string;
  result: CalibrationResultInput;
  onSave: (r: CalibrationResultInput) => Promise<{ ok: boolean; verdict?: CalibrationVerdict }>;
  parentBox: (verdict: CalibrationVerdict) => React.ReactNode;
  backHref: string;
}) {
  const [status, setStatus] = useState<"saving" | "saved" | "failed">("saving");
  const [verdict, setVerdict] = useState<CalibrationVerdict | null>(null);
  const sent = useRef(false);

  const save = async () => {
    setStatus("saving");
    try {
      const r = await onSave(result);
      setStatus(r.ok ? "saved" : "failed");
      if (r.verdict) setVerdict(r.verdict);
    } catch {
      setStatus("failed");
    }
  };

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <section className="panel celebrate full">
        <div className="stars" aria-hidden="true">
          <span>⭐</span>
          <span>⭐</span>
          <span>⭐</span>
        </div>
        <h2>{t.calibrationDone(name)}</h2>
        {status === "saving" && <p className="message info">{t.saving}</p>}
        {status === "failed" && (
          <p className="message error">
            {t.saveFailed}{" "}
            <button className="small" onClick={() => void save()}>
              {t.retrySave}
            </button>
          </p>
        )}
        <div className="player-nav">
          <Link className="button" href={backHref}>
            {t.backHome}
          </Link>
        </div>
      </section>
      {verdict && parentBox(verdict)}
    </>
  );
}

const parentText = {
  af: {
    title: "Vir die ouer",
    summary: (level: number, r: CalibrationResultInput) =>
      `Uitslag op Vlak ${level}: begrip ${r.comprehensionRight} uit ${r.questions}, woordherkenning ${r.spellingRight} uit ${r.words}, leesspoed ${r.wordsPerMinute} woorde per minuut.`,
    fast: "Die leesstuk is baie vinnig gelees, so hierdie leesspoed word nie as beginspoed gebruik nie.",
    speed: "Hierdie leesspoed word die beginspoed vir die oogoefening.",
    fits: (level: number) => `Vlak ${level} pas goed.`,
    up: (next: number) => `Dit was maklik. Probeer gerus die toets op Vlak ${next}.`,
    upTop: (level: number) => `Dit was maklik. Vlak ${level} is tans die hoogste vlak.`,
    down: (prev: number) => `Dit was nog moeilik. Ons stel voor dat jy Vlak ${prev} toets.`,
    downBottom: "Dit was nog moeilik. Begin rustig by Vlak 1; die lesse help met elke stap.",
    setLevel: (level: number) => `Stel vlak op ${level}`,
    test: (level: number) => `Toets Vlak ${level}`,
  },
  en: {
    title: "For the parent",
    summary: (level: number, r: CalibrationResultInput) =>
      `Result at Level ${level}: comprehension ${r.comprehensionRight} of ${r.questions}, word recognition ${r.spellingRight} of ${r.words}, reading speed ${r.wordsPerMinute} words per minute.`,
    fast: "The passage was read very quickly, so this reading speed is not used as the starting speed.",
    speed: "This reading speed becomes the starting speed for the eye exercise.",
    fits: (level: number) => `Level ${level} is a good fit.`,
    up: (next: number) => `That was easy. You're welcome to try the test at Level ${next}.`,
    upTop: (level: number) => `That was easy. Level ${level} is currently the highest level.`,
    down: (prev: number) => `That was still hard. We suggest testing Level ${prev}.`,
    downBottom: "That was still hard. Start calmly at Level 1; the lessons help with every step.",
    setLevel: (level: number) => `Set level to ${level}`,
    test: (level: number) => `Test Level ${level}`,
  },
};

/** The parent's part of the result: what the test suggests, with buttons. The parent decides. */
function ParentBox({
  verdict,
  result,
  level,
  language,
  locale,
  setLevel,
  backHref,
}: {
  verdict: CalibrationVerdict;
  result: CalibrationResultInput;
  level: number;
  language: "af" | "en";
  locale: "af" | "en";
  setLevel: (formData: FormData) => Promise<void>;
  backHref: string;
}) {
  const p = parentText[locale];
  const top = level >= 5;
  const suggestion =
    verdict === "fits" ? p.fits(level) : verdict === "up" ? (top ? p.upTop(level) : p.up(level + 1)) : level <= 1 ? p.downBottom : p.down(level - 1);
  const testLevel = verdict === "up" && !top ? level + 1 : verdict === "down" && level > 1 ? level - 1 : null;
  const recommended = verdict === "down" && level > 1 ? level - 1 : level;
  const calibrateHref = (n: number) => `${backHref}/calibrate?language=${language}&level=${n}`;
  return (
    <section className="panel" lang={locale}>
      <h2>{p.title}</h2>
      <p>{p.summary(level, result)}</p>
      <p className="sub">{result.unusuallyFast ? p.fast : p.speed}</p>
      <p className="message info">{suggestion}</p>
      <div className="row">
        <form action={setLevel}>
          <input type="hidden" name="level" value={recommended} />
          <button className="primary" type="submit">
            {p.setLevel(recommended)}
          </button>
        </form>
        {testLevel && (
          <Link className="button" href={calibrateHref(testLevel)}>
            {p.test(testLevel)}
          </Link>
        )}
      </div>
    </section>
  );
}

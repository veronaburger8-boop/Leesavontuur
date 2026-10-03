"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Firefly } from "@/components/games/firefly";
import type { GameResult } from "@/components/games/eye-shell";
import type { Locale } from "@/lib/i18n";
import { landingText } from "@/lib/landing-text";
import type { LessonSample } from "@/lib/landing-sample";

type Tab = "cards" | "firefly" | "speed";

/** "Try it yourself" on the welcome page: nothing here is saved anywhere. */
export function LandingTry({ locale, sample }: { locale: Locale; sample: LessonSample | null }) {
  const t = landingText(locale);
  const tabs: { id: Tab; label: string }[] = [
    ...(sample?.cards.length ? [{ id: "cards" as const, label: t.tabCards }] : []),
    { id: "firefly", label: t.tabFirefly },
    ...(sample ? [{ id: "speed" as const, label: t.tabSpeed }] : []),
  ];
  const [tab, setTab] = useState<Tab>(tabs[0].id);
  return (
    <div className="try">
      <div className="try-tabs" role="tablist" aria-label={t.tryTitle}>
        {tabs.map((x) => (
          <button
            key={x.id}
            type="button"
            role="tab"
            id={`try-tab-${x.id}`}
            aria-selected={tab === x.id}
            aria-controls={`try-panel-${x.id}`}
            className={tab === x.id ? "primary" : ""}
            onClick={() => setTab(x.id)}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div className="try-panel" role="tabpanel" id={`try-panel-${tab}`} aria-labelledby={`try-tab-${tab}`}>
        {tab === "cards" && sample && <Cards locale={locale} sample={sample} />}
        {tab === "firefly" && <FireflyTry locale={locale} />}
        {tab === "speed" && sample && <Speed locale={locale} sample={sample} />}
      </div>
      <p className="try-join">
        <Link className="button primary big" href="/signup">
          {t.tryJoin}
        </Link>
      </p>
    </div>
  );
}

function Cards({ locale, sample }: { locale: Locale; sample: LessonSample }) {
  const t = landingText(locale);
  const [i, setI] = useState(0);
  const c = sample.cards[i];
  return (
    <>
      {/* The key restarts the slide-in each time the card changes. */}
      <div className="wordcard try-card" key={c.word} aria-live="polite">
        <div className="card-word">{c.word}</div>
        {c.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.image} alt={c.imageNote ?? ""} width={180} height={180} />
        )}
        {c.definitions.map((d) => (
          <p key={d} className="reading-sm">
            {d}
          </p>
        ))}
        {c.example && (
          <p className="reading-sm">
            <em>{t.eg}</em> {c.example}
          </p>
        )}
        <p className="translation">
          {t.otherLanguage}: “{c.translation}”
        </p>
      </div>
      <div className="player-nav">
        <button type="button" disabled={i === 0} onClick={() => setI(i - 1)}>
          {t.prevCard}
        </button>
        <span className="count">{t.cardOf(i + 1, sample.cards.length)}</span>
        <button type="button" className="primary" disabled={i === sample.cards.length - 1} onClick={() => setI(i + 1)}>
          {t.nextCard}
        </button>
      </div>
    </>
  );
}

function FireflyTry({ locale }: { locale: Locale }) {
  const t = landingText(locale);
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<GameResult | null>(null);
  if (result)
    return (
      <div className="try-result">
        <p className="try-big">{t.fireflyResult(result.hits, result.tries)}</p>
        <button
          type="button"
          className="primary"
          onClick={() => {
            setResult(null);
            setRound(round + 1);
          }}
        >
          {t.playAgain}
        </button>
      </div>
    );
  if (round === 0)
    return (
      <div className="try-result">
        <p>{t.fireflyIntro}</p>
        <button type="button" className="primary" onClick={() => setRound(1)}>
          {t.play}
        </button>
      </div>
    );
  return <Firefly key={round} step={1} language={locale} finish={setResult} />;
}

function Speed({ locale, sample }: { locale: Locale; sample: LessonSample }) {
  const t = landingText(locale);
  const { title, lines, words } = sample.passage;
  const [phase, setPhase] = useState<"ready" | "reading" | "done">("ready");
  const [seconds, setSeconds] = useState(0);
  const started = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );

  const start = () => {
    started.current = performance.now();
    setSeconds(0);
    setPhase("reading");
    timer.current = setInterval(() => setSeconds(Math.floor((performance.now() - started.current) / 1000)), 1000);
  };
  const finish = () => {
    if (timer.current) clearInterval(timer.current);
    setSeconds((performance.now() - started.current) / 1000);
    setPhase("done");
  };

  if (phase === "ready")
    return (
      <div className="try-result">
        <p>{t.speedIntro(title, words)}</p>
        <button type="button" className="primary" onClick={start}>
          {t.speedStart}
        </button>
      </div>
    );
  if (phase === "reading")
    return (
      <>
        <p className="count" aria-live="off">
          ⏱ {t.speedSeconds(seconds)}
        </p>
        <div className="passage reading lines try-passage" lang={locale}>
          {lines.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
        <div className="player-nav">
          <span />
          <button type="button" className="primary" autoFocus onClick={finish}>
            {t.speedDone}
          </button>
        </div>
      </>
    );
  const wpm = Math.round(words / (Math.max(seconds, 1) / 60));
  return (
    <div className="try-result" aria-live="polite">
      <p className="try-big">{t.speedResult(wpm)}</p>
      {wpm > 350 && <p>{t.speedTooFast}</p>}
      <p className="sub">{t.speedNote}</p>
      <button type="button" onClick={() => setPhase("ready")}>
        {t.speedAgain}
      </button>
    </div>
  );
}

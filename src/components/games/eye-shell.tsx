"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Meerkat } from "@/components/art/meerkat";
import type { Language } from "@/lib/content/types";
import type { EyeGame } from "@/lib/games/eyes";
import { EYE_TEXT, GAME_ICONS } from "@/lib/games/eye-text";


/** True when the device asks for less movement. */
export function useCalm() {
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setCalm(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return calm;
}

export interface GameResult {
  tries: number;
  hits: number;
}

export type GameRenderer = (props: { finish: (r: GameResult) => void }) => ReactNode;

/** Renders the game as its own component, so "Play again" starts it fresh. */
function GameSlot({ render: Render, finish }: { render: GameRenderer; finish: (r: GameResult) => void }) {
  return <Render finish={finish} />;
}

/**
 * Start screen, the game, and the "Well done!" screen. The time and score of
 * each session are saved for the parent report, and the difficulty adapts.
 */
export function EyeShell({
  game,
  language,
  backHref,
  onFinish,
  renderGame,
}: {
  game: EyeGame;
  language: Language;
  backHref: string;
  onFinish: (seconds: number, tries: number, hits: number) => Promise<boolean>;
  renderGame: GameRenderer;
}) {
  const t = EYE_TEXT[language];
  const g = t[game];
  const [phase, setPhase] = useState<"intro" | "play" | "done">("intro");
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<GameResult & { faster: boolean }>({ tries: 0, hits: 0, faster: false });
  const started = useRef(0);
  const router = useRouter();

  const start = () => {
    started.current = Date.now();
    setRound((r) => r + 1);
    setPhase("play");
  };
  const finish = (r: GameResult) => {
    const seconds = Math.min(1800, Math.round((Date.now() - started.current) / 1000));
    setResult({ ...r, faster: false });
    setPhase("done");
    // The server says whether the next session will be a step harder.
    void onFinish(seconds, r.tries, r.hits).then((harder) => {
      setResult({ ...r, faster: harder });
      // Load the new difficulty for "Play again".
      router.refresh();
    });
  };

  return (
    <section className="panel eye-game" lang={language}>
      <h1>
        <span aria-hidden="true">{GAME_ICONS[game]}</span> {g.title}
      </h1>
      {phase === "intro" && (
        <div className="eye-intro">
          <Meerkat size={90} reading={false} />
          <p>{g.how}</p>
          <button className="primary big" type="button" onClick={start} autoFocus>
            {t.start}
          </button>
        </div>
      )}
      {phase === "play" && <GameSlot key={round} render={renderGame} finish={finish} />}
      {phase === "done" && (
        <div className="eye-intro" aria-live="polite">
          <Meerkat size={110} />
          <h2>{t.done}</h2>
          <p>{t.result(result.hits, result.tries)}</p>
          {result.faster && <p className="sub">{t.harder}</p>}
          <div className="row" style={{ justifyContent: "center" }}>
            <button className="primary" type="button" onClick={start} autoFocus>
              {t.again}
            </button>
            <Link className="button" href={backHref}>
              {t.back}
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

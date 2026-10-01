"use client";

import { useEffect, useRef, useState } from "react";
import type { Language } from "@/lib/content/types";
import { fireflyAt, fireflySettings } from "@/lib/games/eyes";
import { EYE_TEXT } from "@/lib/games/eye-text";
import { type GameResult, useCalm } from "./eye-shell";

const FLASHES = 8;

/**
 * Catch the firefly: the firefly drifts along a smooth path (the eyes follow
 * it); now and then it turns gold for a moment and the child taps it.
 */
export function Firefly({ step, language, finish }: { step: number; language: Language; finish: (r: GameResult) => void }) {
  const t = EYE_TEXT[language].vuurvliegie;
  const calm = useCalm();
  const { speed, goldMs } = fireflySettings(step, calm);
  const area = useRef<HTMLDivElement>(null);
  const bug = useRef<HTMLButtonElement>(null);
  const [gold, setGold] = useState(false);
  const [message, setMessage] = useState("");
  const score = useRef({ tries: 0, hits: 0 });
  const goldRef = useRef(false);
  const finishRef = useRef(finish);
  useEffect(() => {
    finishRef.current = finish;
  });

  // Smooth movement, drawn every frame without re-rendering React.
  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    let pathT = 0;
    const tick = (now: number) => {
      pathT += ((now - last) / 1000) * speed * 9;
      last = now;
      const a = area.current;
      const b = bug.current;
      if (a && b) {
        const { x, y } = fireflyAt(pathT);
        b.style.transform = `translate(${x * (a.clientWidth - 64)}px, ${y * (a.clientHeight - 64)}px)`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [speed]);

  // Gold moments at unpredictable times.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    let flashes = 0;
    const next = () => {
      if (flashes >= FLASHES) {
        timers.push(setTimeout(() => finishRef.current({ ...score.current }), 700));
        return;
      }
      timers.push(
        setTimeout(
          () => {
            flashes++;
            score.current.tries++;
            goldRef.current = true;
            setGold(true);
            setMessage("");
            timers.push(
              setTimeout(() => {
                if (goldRef.current) {
                  goldRef.current = false;
                  setGold(false);
                  setMessage(t.missed);
                }
                next();
              }, goldMs),
            );
          },
          1400 + Math.random() * 2200,
        ),
      );
    };
    next();
    return () => timers.forEach(clearTimeout);
  }, [goldMs, t.missed]);

  const tap = () => {
    if (!goldRef.current) {
      setMessage(t.wait);
      return;
    }
    goldRef.current = false;
    score.current.hits++;
    setGold(false);
    setMessage(t.caught);
  };

  return (
    <>
      <p className="sub eye-message" aria-live="polite">
        {message || t.follow}
      </p>
      <div className="firefly-area" ref={area} role="group" aria-label={EYE_TEXT[language].playArea}>
        <button ref={bug} type="button" className={`firefly${gold ? " gold" : ""}${calm ? " calm" : ""}`} onPointerDown={tap} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && tap()} aria-label={gold ? `${t.title} ✨` : t.title}>
          <span aria-hidden="true" />
        </button>
      </div>
    </>
  );
}

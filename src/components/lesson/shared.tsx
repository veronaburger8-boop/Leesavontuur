"use client";

import { type RefObject, useCallback, useEffect, useRef } from "react";
import type { Language } from "@/lib/content/types";
import { band } from "@/lib/lesson/logic";
import { encourage, type LessonText, SPECIAL_LETTERS } from "@/lib/lesson/text";

/** setTimeout that is cancelled automatically when the screen changes. */
export function useTimers() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  return { later, clear };
}

/**
 * Large buttons for ê ë é è ô ö û ï î and 'n, inserted where the cursor is in
 * the input that was used last. Keyboard typing still works.
 */
export function SpecialLetters({ target, t, disabled }: { target: RefObject<HTMLInputElement | null>; t: LessonText; disabled?: boolean }) {
  return (
    <div className="letters" role="group" aria-label={t.specialLetters}>
      {SPECIAL_LETTERS.map((ch) => (
        <button
          key={ch}
          type="button"
          disabled={disabled}
          // Keep the cursor in the input while the button is pressed.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const input = target.current;
            if (!input || input.disabled) return;
            const start = input.selectionStart ?? input.value.length;
            const end = input.selectionEnd ?? input.value.length;
            const value = input.value.slice(0, start) + ch + input.value.slice(end);
            // Update React's copy of the value as well as the element.
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
            setter?.call(input, value);
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.focus();
            const pos = start + ch.length;
            input.setSelectionRange(pos, pos);
          }}
        >
          {ch}
        </button>
      ))}
    </div>
  );
}

/** The encouraging message between steps, with a small celebration at 100%. */
export function Cheer({
  pct,
  name,
  language,
  t,
  nextName,
  onNext,
}: {
  pct: number;
  name: string;
  language: Language;
  t: LessonText;
  nextName: string | null;
  onNext: () => void;
}) {
  const full = pct === 100;
  return (
    <section className={`panel celebrate${full ? " full" : ""}`}>
      {full && (
        <div className="stars" aria-hidden="true">
          <span>⭐</span>
          <span>⭐</span>
          <span>⭐</span>
        </div>
      )}
      <div className="big">{pct}%</div>
      <h2>{encourage(language, band(pct), name)}</h2>
      <p className="sub">{nextName ? t.nextStep(nextName) : t.seeReport}</p>
      <div className="player-nav">
        <button className="primary" autoFocus onClick={onNext}>
          {nextName ? t.goOn : t.showReport}
        </button>
      </div>
    </section>
  );
}

export const inputProps = {
  type: "text",
  autoComplete: "off",
  autoCapitalize: "off",
  autoCorrect: "off",
  spellCheck: false,
} as const;

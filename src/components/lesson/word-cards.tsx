"use client";

import { useState } from "react";
import type { WordCard } from "@/lib/content/types";
import type { LessonText } from "@/lib/lesson/text";

/** Step 1: the difficult words, one card at a time. */
export function WordCards({ title, cards, t, onDone }: { title: string; cards: WordCard[]; t: LessonText; onDone: () => void }) {
  const [i, setI] = useState(0);
  // Extra support cards come later; the parent skips this step when there are no cards.
  const main = cards.filter((c) => !c.extra);
  const c = main[i];
  const last = i === main.length - 1;
  return (
    <section className="panel">
      <h2>{title}</h2>
      <p className="sub">{t.cardsIntro}</p>
      <div className="wordcard">
        <div className="card-word">{c.word}</div>
        {c.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.image} alt={c.imageNote ?? ""} style={{ maxWidth: 220, display: "block", margin: "0 0 12px" }} />
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
        {c.forms && <p className="reading-sm">{c.forms}</p>}
        <p className="translation">
          {t.otherLanguage}: “{c.translation}”
        </p>
      </div>
      <div className="player-nav">
        <button disabled={i === 0} onClick={() => setI(i - 1)}>
          {t.previous}
        </button>
        <span className="count">{t.ofN(i + 1, main.length)}</span>
        {last ? (
          <button className="primary" autoFocus onClick={onDone}>
            {t.toEye}
          </button>
        ) : (
          <button className="primary" autoFocus onClick={() => setI(i + 1)}>
            {t.next}
          </button>
        )}
      </div>
    </section>
  );
}

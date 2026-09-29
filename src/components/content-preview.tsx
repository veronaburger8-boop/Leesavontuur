import { BENCHMARKS, type ContentItem, type GrammarItem, sentenceCount, wordCount } from "@/lib/content/types";

// Shows a lesson or calibration passage with the fonts and layout a child
// sees: Andika for Levels 1–2, Atkinson Hyperlegible from Level 3, regular
// weight, one sentence per line up to Level 3 and paragraphs from Level 4.
// Correct answers are marked for the reviewer. The step-by-step interactive
// preview arrives with the lesson player in Phase 2.

const labels = {
  af: {
    wordCards: "Woordkaarte",
    extra: "Ekstra ondersteuningswoorde (nog sonder kaarte)",
    eg: "Bv.",
    translation: "Engels",
    picture: "Prent",
    passage: "Die leesstuk",
    comprehension: "Begrip",
    thinking: "Dinkvraag",
    spelling: "Woordherkenning",
    grammar: "Grammatika",
    vocabulary: "Woordeskat",
  },
  en: {
    wordCards: "Word cards",
    extra: "Extra support words (no cards yet)",
    eg: "e.g.",
    translation: "Afrikaans",
    picture: "Picture",
    passage: "The passage",
    comprehension: "Comprehension",
    thinking: "Thinking question",
    spelling: "Word recognition",
    grammar: "Grammar",
    vocabulary: "Vocabulary",
  },
};

export function ContentPreview({ item }: { item: ContentItem }) {
  const l = labels[item.language];
  const words = wordCount(item.passage);
  const sentences = sentenceCount(item.passage);
  const bench = BENCHMARKS[item.level];
  return (
    <div lang={item.language} className={item.level <= 2 ? "grade1" : undefined}>
      {item.type === "lesson" && (
        <section className="panel">
          <h2>
            {l.wordCards} ({item.wordCards.length})
          </h2>
          <div className="cards">
            {item.wordCards.map((c) => (
              <div key={c.word} className="wordcard">
                <div className="card-word">{c.word}</div>
                {c.definitions.map((d) => (
                  <p key={d} className="reading-sm">
                    {d}
                  </p>
                ))}
                {c.example && (
                  <p className="reading-sm">
                    <em>{l.eg}</em> {c.example}
                  </p>
                )}
                {c.forms && <p className="reading-sm">{c.forms}</p>}
                <p className="translation">
                  {l.translation}: “{c.translation}”
                </p>
                {c.imageNote && (
                  <p className="sub" style={{ marginTop: 8 }}>
                    {l.picture}: {c.imageNote}
                  </p>
                )}
              </div>
            ))}
          </div>
          {item.extraWords.length > 0 && (
            <p style={{ marginTop: 14 }}>
              <strong>{l.extra}:</strong> {item.extraWords.join(", ")}
            </p>
          )}
        </section>
      )}

      <section className="panel">
        <h2>{l.passage}</h2>
        <p className="sub" lang="en">
          {words} words (Level {item.level} benchmark: ~{bench.words}) · {sentences} sentences · average {sentences ? (words / sentences).toFixed(1) : "–"}{" "}
          words per sentence (benchmark: {bench.sentence})
        </p>
        <div className={`passage reading ${item.layout}`}>
          {item.passage.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>
          {l.comprehension} ({item.comprehension.length})
        </h2>
        <ol>
          {item.comprehension.map((q, i) => (
            <li key={i} style={{ marginBottom: 18 }}>
              <p className="reading-sm">
                {q.thinking && <span className="badge in_review">{l.thinking}</span>} {q.question}
              </p>
              <ul className="options">
                {q.options.map((o, k) => (
                  <li key={k} className={k === q.answer ? "right" : undefined}>
                    {o} {k === q.answer && <span aria-label="correct">✓</span>}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel">
        <h2>
          {l.spelling} ({item.spelling.length})
        </h2>
        <p className="reading-sm">{item.spelling.join(" · ")}</p>
      </section>

      {item.type === "lesson" && (
        <>
          <section className="panel">
            <h2>
              {l.grammar}: {item.grammar.focus}
            </h2>
            <p className="message info">{item.grammar.instruction}</p>
            {item.grammar.instructionNote && (
              <p className="sub" lang="en">
                Note next to the instruction (not shown to children): {item.grammar.instructionNote}
              </p>
            )}
            <ol>
              {item.grammar.items.map((g, i) => (
                <li key={i} className="reading-sm">
                  {g.prompt}
                  {g.choices && <span className="sub"> ({g.choices.join(" / ")})</span>} → <GrammarAnswer item={g} />
                  {g.note && <span className="sub"> ({g.note})</span>}
                </li>
              ))}
            </ol>
          </section>

          <section className="panel">
            <h2>
              {l.vocabulary} ({item.vocabulary.length})
            </h2>
            <ol>
              {item.vocabulary.map((v, i) => (
                <li key={i} style={{ marginBottom: 18 }}>
                  <p className="reading-sm">{v.sentence}</p>
                  <ul className="options">
                    {v.options.map((o, k) => (
                      <li key={k} className={k === v.answer ? "right" : undefined}>
                        {o} {k === v.answer && <span aria-label="correct">✓</span>}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}

/** Accepted answers; alternatives after the first are shown in brackets. */
function GrammarAnswer({ item }: { item: GrammarItem }) {
  const show = (accepted: string[]) => (
    <>
      <strong>{accepted[0]}</strong>
      {accepted.length > 1 && <span className="sub"> (also: {accepted.slice(1).join(", ")})</span>}
    </>
  );
  if (item.blanks)
    return (
      <>
        {item.blanks.map((b, i) => (
          <span key={i}>
            {i > 0 && " – "}
            {show(b)}
          </span>
        ))}
      </>
    );
  return show(item.accepted ?? []);
}

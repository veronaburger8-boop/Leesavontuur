"use client";

import { useActionState, useMemo, useState } from "react";
import type { EditorState } from "@/app/admin/actions";
import {
  type CardForm,
  type EditorForm,
  emptyCard,
  emptyGrammarItem,
  emptyQuestion,
  formChecks,
  type GrammarItemForm,
  passageStats,
  type QuestionForm,
} from "@/lib/content/editor";
import { BENCHMARKS, layoutForLevel } from "@/lib/content/types";

type Topic = { key: string; name_en: string };

/**
 * The manual lesson form (brief, section 6): every part of a lesson, with
 * live checks against the level benchmark. Used to write a new lesson and to
 * edit an existing one.
 */
export function LessonEditor({
  initial,
  mode,
  topics,
  published,
  action,
}: {
  initial: EditorForm;
  mode: "new" | "edit";
  topics: Topic[];
  published: boolean;
  action: (prev: EditorState, formData: FormData) => Promise<EditorState>;
}) {
  const [f, setF] = useState(initial);
  const [state, formAction, pending] = useActionState(action, { errors: [] });
  const checks = useMemo(() => formChecks(f), [f]);
  const stats = passageStats(f.passage);
  const bench = BENCHMARKS[f.level];
  const lesson = f.type === "lesson";
  const lang = f.language;

  const set = <K extends keyof EditorForm>(key: K, value: EditorForm[K]) => setF((x) => ({ ...x, [key]: value }));
  const setCard = (i: number, patch: Partial<CardForm>) => set("wordCards", f.wordCards.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const setQ = (key: "comprehension" | "vocabulary", i: number, patch: Partial<QuestionForm>) =>
    set(
      key,
      f[key].map((q, j) => (j === i ? { ...q, ...patch } : q)),
    );
  const setG = (i: number, patch: Partial<GrammarItemForm>) =>
    set("grammar", { ...f.grammar, items: f.grammar.items.map((g, j) => (j === i ? { ...g, ...patch } : g)) });
  const remove = <T,>(list: T[], i: number) => list.filter((_, j) => j !== i);

  const problems = checks.filter((c) => c.level === "problem");
  const warnings = checks.filter((c) => c.level === "warning");

  const questions = (key: "comprehension" | "vocabulary") => {
    const vocab = key === "vocabulary";
    return f[key].map((q, i) => (
      <fieldset key={i} className="editor-block">
        <legend>
          {vocab ? "Sentence" : "Question"} {i + 1}
        </legend>
        <label htmlFor={`${key}-${i}`} className="sr-only">
          {vocab ? "Sentence with ______" : "Question"}
        </label>
        <input
          id={`${key}-${i}`}
          type="text"
          lang={lang}
          value={q.question}
          placeholder={vocab ? "Sentence with ______ where the word goes" : "Question"}
          onChange={(e) => setQ(key, i, { question: e.target.value })}
        />
        {!vocab && (
          <label className="check" style={{ fontWeight: 400 }}>
            <input type="checkbox" checked={q.thinking} onChange={(e) => setQ(key, i, { thinking: e.target.checked })} />
            <span>Thinking question (Dinkvraag): the answer is inferred, not stated</span>
          </label>
        )}
        <div className="editor-options">
          {q.options.map((o, k) => (
            <div key={k} className="editor-option">
              <input
                type="radio"
                name={`${key}-${i}-answer`}
                aria-label={`Option ${k + 1} is correct`}
                checked={q.answer === k}
                onChange={() => setQ(key, i, { answer: k })}
              />
              <input
                type="text"
                lang={lang}
                aria-label={`Option ${k + 1}`}
                value={o}
                onChange={(e) => setQ(key, i, { options: q.options.map((x, m) => (m === k ? e.target.value : x)) })}
              />
            </div>
          ))}
        </div>
        <p className="hint">Tick the circle next to the correct option. The site shuffles the options for children.</p>
        <button type="button" className="small" onClick={() => set(key, remove(f[key], i))}>
          Remove
        </button>
      </fieldset>
    ));
  };

  return (
    <form
      action={(fd) => {
        fd.set("form", JSON.stringify(f));
        fd.set("mode", mode);
        formAction(fd);
      }}
      className="editor"
    >
      {published && <p className="message info">This item is published: children see your changes as soon as you save.</p>}

      <section className="panel">
        <h2>About this {lesson ? "lesson" : "passage"}</h2>
        <div className="row">
          {mode === "new" && (
            <div>
              <label htmlFor="type">Kind</label>
              <select id="type" value={f.type} onChange={(e) => set("type", e.target.value as EditorForm["type"])} style={{ width: "auto" }}>
                <option value="lesson">Lesson</option>
                <option value="calibration">Calibration passage</option>
              </select>
            </div>
          )}
          <div>
            <label htmlFor="language">Language</label>
            <select id="language" value={f.language} onChange={(e) => set("language", e.target.value as EditorForm["language"])} style={{ width: "auto" }}>
              <option value="af">Afrikaans</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label htmlFor="level">Level</label>
            <select id="level" value={f.level} onChange={(e) => set("level", Number(e.target.value))} style={{ width: "auto" }}>
              {Array.from({ length: 15 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  Level {n}
                </option>
              ))}
            </select>
          </div>
          {lesson && (
            <div>
              <label htmlFor="topic">Topic</label>
              <select id="topic" value={f.topic} onChange={(e) => set("topic", e.target.value)} style={{ width: "auto" }}>
                <option value="">Choose…</option>
                {topics.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.name_en}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="title">Title</label>
          <input id="title" type="text" lang={lang} value={f.title} onChange={(e) => set("title", e.target.value)} />
          {mode === "edit" && <span className="hint">Id: {f.id} (stays the same)</span>}
        </div>
      </section>

      {lesson && (
        <section className="panel">
          <h2>Word cards</h2>
          <p className="sub">Level {f.level}: {bench?.wordCards ?? "–"}. Tick “support card” for extra cards shown only when a child needs more help.</p>
          {f.wordCards.map((c, i) => (
            <fieldset key={i} className="editor-block">
              <legend>Card {i + 1}</legend>
              <div className="editor-grid">
                <label>
                  Word
                  <input type="text" lang={lang} value={c.word} onChange={(e) => setCard(i, { word: e.target.value })} />
                </label>
                <label>
                  Translation ({lang === "af" ? "English" : "Afrikaans"})
                  <input type="text" lang={lang === "af" ? "en" : "af"} value={c.translation} onChange={(e) => setCard(i, { translation: e.target.value })} />
                </label>
                <label className="wide">
                  Definitions (1–2, one per line)
                  <textarea lang={lang} rows={2} value={c.definitions} onChange={(e) => setCard(i, { definitions: e.target.value })} />
                </label>
                <label className="wide">
                  Example sentence
                  <input type="text" lang={lang} value={c.example} onChange={(e) => setCard(i, { example: e.target.value })} />
                </label>
                <label>
                  Word forms (optional)
                  <input type="text" lang={lang} value={c.forms} placeholder="Een heining, baie heinings" onChange={(e) => setCard(i, { forms: e.target.value })} />
                </label>
                <label>
                  Picture idea (optional)
                  <input type="text" value={c.imageNote} onChange={(e) => setCard(i, { imageNote: e.target.value })} />
                </label>
              </div>
              <div className="row">
                <label className="check" style={{ fontWeight: 400 }}>
                  <input type="checkbox" checked={c.extra} onChange={(e) => setCard(i, { extra: e.target.checked })} />
                  <span>Support card</span>
                </label>
                <button type="button" className="small" onClick={() => set("wordCards", remove(f.wordCards, i))}>
                  Remove
                </button>
              </div>
            </fieldset>
          ))}
          <button type="button" className="small" onClick={() => set("wordCards", [...f.wordCards, emptyCard()])}>
            + Add a word card
          </button>
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="extraWords">Extra support words without a card yet (comma-separated)</label>
            <input id="extraWords" type="text" lang={lang} value={f.extraWords} onChange={(e) => set("extraWords", e.target.value)} />
          </div>
        </section>
      )}

      <section className="panel">
        <h2>The passage</h2>
        <div className="benchmark">
          <span>
            <strong>{stats.words}</strong> words {bench && <span className="sub">(Level {f.level}: about {bench.words})</span>}
          </span>
          <span>
            <strong>{stats.average || "–"}</strong> words per sentence {bench && <span className="sub">(Level {f.level}: {bench.sentence})</span>}
          </span>
        </div>
        <label htmlFor="passage" className="sr-only">
          Passage
        </label>
        <textarea id="passage" lang={lang} rows={14} value={f.passage} onChange={(e) => set("passage", e.target.value)} style={{ fontFamily: "var(--read-font)", fontSize: 18, lineHeight: 1.6 }} />
        <p className="hint">{layoutForLevel(f.level) === "lines" ? "Levels 1–3: one sentence per line." : "Levels 4 and up: one paragraph per line."}</p>
      </section>

      <section className="panel">
        <h2>Comprehension ({lesson ? 5 : 4} questions, 5 options each)</h2>
        {questions("comprehension")}
        <button type="button" className="small" onClick={() => set("comprehension", [...f.comprehension, emptyQuestion(5)])}>
          + Add a question
        </button>
      </section>

      <section className="panel">
        <h2>Spelling / word recognition ({lesson ? 10 : 7} words)</h2>
        <label htmlFor="spelling" className="sr-only">
          Spelling words
        </label>
        <textarea id="spelling" lang={lang} rows={2} value={f.spelling} onChange={(e) => set("spelling", e.target.value)} />
        <p className="hint">Separate the words with commas.</p>
      </section>

      {lesson && (
        <section className="panel">
          <h2>Grammar (5 items)</h2>
          <div className="editor-grid">
            <label>
              Focus
              <input type="text" lang={lang} value={f.grammar.focus} placeholder="meervoude" onChange={(e) => set("grammar", { ...f.grammar, focus: e.target.value })} />
            </label>
            <label className="wide">
              Instruction for the child
              <input
                type="text"
                lang={lang}
                value={f.grammar.instruction}
                placeholder="Gee die meervoud – Bv. hond – honde"
                onChange={(e) => set("grammar", { ...f.grammar, instruction: e.target.value })}
              />
            </label>
          </div>
          {f.grammar.items.map((g, i) => (
            <fieldset key={i} className="editor-block">
              <legend>Item {i + 1}</legend>
              <div className="editor-grid">
                <label className="wide">
                  Prompt
                  <input type="text" lang={lang} value={g.prompt} onChange={(e) => setG(i, { prompt: e.target.value })} />
                </label>
                <label>
                  Accepted answers (one per line)
                  <textarea lang={lang} rows={2} value={g.answers} onChange={(e) => setG(i, { answers: e.target.value })} />
                </label>
                <label>
                  Second blank, if any (e.g. min – minder – <em>minste</em>)
                  <textarea lang={lang} rows={2} value={g.answers2} onChange={(e) => setG(i, { answers2: e.target.value })} />
                </label>
                <label>
                  Choices to pick from (optional, comma-separated)
                  <input type="text" lang={lang} value={g.choices} placeholder="their, there" onChange={(e) => setG(i, { choices: e.target.value })} />
                </label>
                <label>
                  Note shown after answering (optional)
                  <input type="text" lang={lang} value={g.note} onChange={(e) => setG(i, { note: e.target.value })} />
                </label>
              </div>
              <button type="button" className="small" onClick={() => set("grammar", { ...f.grammar, items: remove(f.grammar.items, i) })}>
                Remove
              </button>
            </fieldset>
          ))}
          <button type="button" className="small" onClick={() => set("grammar", { ...f.grammar, items: [...f.grammar.items, emptyGrammarItem()] })}>
            + Add an item
          </button>
        </section>
      )}

      {lesson && (
        <section className="panel">
          <h2>Vocabulary (5 sentences, 4 near-miss options)</h2>
          {questions("vocabulary")}
          <button type="button" className="small" onClick={() => set("vocabulary", [...f.vocabulary, emptyQuestion(4)])}>
            + Add a sentence
          </button>
        </section>
      )}

      <section className="panel editor-footer" aria-live="polite">
        <details className="editor-checks">
          <summary>
            <strong>Checks:</strong>{" "}
            {checks.length === 0 ? "everything looks right." : `${problems.length} must be fixed · ${warnings.length} worth a second look (tap to see)`}
          </summary>
          {problems.length > 0 && (
            <div className="message error">
              <strong>Must be fixed:</strong>
              <ul>
                {problems.map((c) => (
                  <li key={c.message}>{c.message}</li>
                ))}
              </ul>
            </div>
          )}
          {warnings.length > 0 && (
            <div className="message info">
              <strong>Worth a second look:</strong>
              <ul>
                {warnings.map((c) => (
                  <li key={c.message}>{c.message}</li>
                ))}
              </ul>
            </div>
          )}
        </details>
        {state.errors.length > 0 && (
          <div className="message error" role="alert">
            <strong>Not saved:</strong>
            <ul>
              {state.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="row">
          <button className="primary" type="submit" disabled={pending}>
            {pending ? "Saving…" : mode === "new" ? "Save as draft" : "Save changes"}
          </button>
        </div>
      </section>
    </form>
  );
}

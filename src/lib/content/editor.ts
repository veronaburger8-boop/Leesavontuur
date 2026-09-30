// The admin's lesson form (brief, section 6): what the form holds, how it
// turns into a content item (section 9 format) and back, and the live checks
// shown while writing. Lists the admin types as text (one per line, or
// separated by commas) are kept as typed and only split when saving.

import { checkItem } from "./parse-source";
import {
  BENCHMARKS,
  type Calibration,
  type ContentItem,
  type ContentType,
  type Grammar,
  type GrammarItem,
  type Language,
  type Lesson,
  layoutForLevel,
  sentenceCount,
  wordCount,
} from "./types";

export interface CardForm {
  word: string;
  definitions: string; // one per line
  example: string;
  forms: string;
  translation: string;
  imageNote: string;
  image: string | null;
  extra: boolean;
}

export interface QuestionForm {
  question: string;
  options: string[];
  /** -1 = no correct answer chosen yet. */
  answer: number;
  thinking: boolean;
}

export interface GrammarItemForm {
  prompt: string;
  answers: string; // accepted answers, one per line
  answers2: string; // second blank, one per line (empty = one blank)
  choices: string; // comma-separated, optional
  note: string;
}

export interface EditorForm {
  id: string;
  type: ContentType;
  language: Language;
  level: number;
  topic: string;
  title: string;
  sequence: number | null;
  passage: string; // one sentence (Levels 1–3) or paragraph (4+) per line
  wordCards: CardForm[];
  extraWords: string; // comma-separated
  comprehension: QuestionForm[];
  spelling: string; // comma-separated
  grammar: { focus: string; instruction: string; instructionNote: string; items: GrammarItemForm[] };
  vocabulary: QuestionForm[];
}

const lines = (s: string) =>
  s
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
const commas = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export const emptyCard = (): CardForm => ({ word: "", definitions: "", example: "", forms: "", translation: "", imageNote: "", image: null, extra: false });
export const emptyQuestion = (options: number): QuestionForm => ({ question: "", options: Array(options).fill(""), answer: -1, thinking: false });
export const emptyGrammarItem = (): GrammarItemForm => ({ prompt: "", answers: "", answers2: "", choices: "", note: "" });

/** A blank form with the expected number of each part. */
export function emptyForm(type: ContentType, language: Language, level: number, topic: string): EditorForm {
  const lesson = type === "lesson";
  const cards = lesson ? (level <= 1 ? 4 : level === 2 ? 5 : 6) : 0;
  return {
    id: "",
    type,
    language,
    level,
    topic: lesson ? topic : "",
    title: "",
    sequence: null,
    passage: "",
    wordCards: Array.from({ length: cards }, emptyCard),
    extraWords: "",
    comprehension: Array.from({ length: lesson ? 5 : 4 }, () => emptyQuestion(5)),
    spelling: "",
    grammar: { focus: "", instruction: "", instructionNote: "", items: lesson ? Array.from({ length: 5 }, emptyGrammarItem) : [] },
    vocabulary: lesson ? Array.from({ length: 5 }, () => emptyQuestion(4)) : [],
  };
}

export function toForm(item: ContentItem): EditorForm {
  const q = (x: { question?: string; sentence?: string; options: string[]; answer: number; thinking?: boolean }): QuestionForm => ({
    question: x.question ?? x.sentence ?? "",
    options: [...x.options],
    answer: x.answer,
    thinking: Boolean(x.thinking),
  });
  const lesson = item.type === "lesson" ? item : null;
  return {
    id: item.id,
    type: item.type,
    language: item.language,
    level: item.level,
    topic: lesson?.topic ?? "",
    title: item.title,
    sequence: item.sequence ?? null,
    passage: item.passage.join("\n"),
    wordCards: (lesson?.wordCards ?? []).map((c) => ({
      word: c.word,
      definitions: c.definitions.join("\n"),
      example: c.example,
      forms: c.forms ?? "",
      translation: c.translation,
      imageNote: c.imageNote ?? "",
      image: c.image,
      extra: c.extra,
    })),
    extraWords: (lesson?.extraWords ?? []).join(", "),
    comprehension: item.comprehension.map(q),
    spelling: item.spelling.join(", "),
    grammar: {
      focus: lesson?.grammar.focus ?? "",
      instruction: lesson?.grammar.instruction ?? "",
      instructionNote: lesson?.grammar.instructionNote ?? "",
      items: (lesson?.grammar.items ?? []).map((g) => ({
        prompt: g.prompt,
        answers: (g.blanks ? g.blanks[0] : (g.accepted ?? [])).join("\n"),
        answers2: g.blanks ? g.blanks.slice(1).map((b) => b.join("\n")).join("\n") : "",
        choices: (g.choices ?? []).join(", "),
        note: g.note ?? "",
      })),
    },
    vocabulary: (lesson?.vocabulary ?? []).map(q),
  };
}

export type ItemData = Omit<Lesson, "status"> | Omit<Calibration, "status">;

/** The form as a content item (without status, which lives in its own column). */
export function fromForm(f: EditorForm): ItemData {
  const base = {
    id: f.id,
    language: f.language,
    level: f.level,
    title: f.title.trim(),
    // New items get the next number when they are saved.
    sequence: f.sequence ?? 0,
    layout: layoutForLevel(f.level),
    passage: lines(f.passage),
    comprehension: f.comprehension.map((q) => ({ question: q.question.trim(), options: q.options.map((o) => o.trim()), answer: q.answer, thinking: q.thinking })),
    spelling: commas(f.spelling),
  };
  if (f.type === "calibration") return { ...base, type: "calibration", topic: null };
  const grammar: Grammar = {
    focus: f.grammar.focus.trim(),
    instruction: f.grammar.instruction.trim(),
    ...(f.grammar.instructionNote.trim() ? { instructionNote: f.grammar.instructionNote.trim() } : {}),
    items: f.grammar.items.map((g): GrammarItem => {
      const second = lines(g.answers2);
      const choices = commas(g.choices);
      return {
        prompt: g.prompt.trim(),
        ...(second.length ? { blanks: [lines(g.answers), second] } : { accepted: lines(g.answers) }),
        ...(choices.length ? { choices } : {}),
        ...(g.note.trim() ? { note: g.note.trim() } : {}),
      };
    }),
  };
  return {
    ...base,
    type: "lesson",
    topic: f.topic,
    wordCards: f.wordCards.map((c) => ({
      word: c.word.trim(),
      definitions: lines(c.definitions),
      example: c.example.trim(),
      forms: c.forms.trim() || null,
      translation: c.translation.trim(),
      image: c.image,
      imageNote: c.imageNote.trim() || null,
      extra: c.extra,
    })),
    extraWords: commas(f.extraWords),
    grammar,
    vocabulary: f.vocabulary.map((v) => ({ sentence: v.question.trim(), options: v.options.map((o) => o.trim()), answer: v.answer })),
  };
}

/** An id from the language, level and title, e.g. "af-l3-karel-se-groentetuin". */
export function makeId(language: Language, level: number, title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/'n\b/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return `${language}-l${level}-${slug || "lesson"}`;
}

export interface Check {
  level: "problem" | "warning";
  message: string;
}

/**
 * Live checks while writing: problems must be fixed before saving is useful
 * (the lesson would not work), warnings are worth a second look.
 */
export function formChecks(f: EditorForm): Check[] {
  const item = { ...fromForm(f), status: "draft" } as ContentItem;
  const out: Check[] = [];
  const problem = (message: string) => out.push({ level: "problem", message });
  const warning = (message: string) => out.push({ level: "warning", message });

  if (!item.title) problem("The title is empty.");
  if (item.type === "lesson" && !item.topic) problem("Choose a topic.");

  // Structure (counts, options) – the same checks as the import report.
  for (const message of checkItem(item)) warning(message);

  f.comprehension.forEach((q, i) => {
    if (!q.question.trim()) problem(`Question ${i + 1} has no question.`);
    if (q.answer < 0 || q.answer >= q.options.length) problem(`Question ${i + 1} has no correct answer.`);
    if (q.options.some((o) => !o.trim())) problem(`Question ${i + 1} has an empty option.`);
    const trimmed = q.options.map((o) => o.trim().toLowerCase()).filter(Boolean);
    if (new Set(trimmed).size < trimmed.length) warning(`Question ${i + 1} has the same option twice.`);
  });
  if (item.type === "lesson") {
    item.wordCards.forEach((c, i) => {
      if (!c.word) problem(`Word card ${i + 1} has no word.`);
      else if (!c.definitions.length) warning(`Word card “${c.word}” has no definition.`);
      else if (!c.translation) warning(`Word card “${c.word}” has no translation.`);
    });
    item.grammar.items.forEach((g, i) => {
      if (!g.prompt) problem(`Grammar item ${i + 1} has no prompt.`);
      const answers = g.blanks ? g.blanks.flat() : (g.accepted ?? []);
      if (!answers.length) problem(`Grammar item ${i + 1} has no accepted answer.`);
      if (g.choices && !answers.some((a) => g.choices!.includes(a))) warning(`Grammar item ${i + 1}: the answer is not one of the choices.`);
    });
    if (!item.grammar.focus) warning("The grammar exercise has no focus (e.g. meervoude).");
    f.vocabulary.forEach((v, i) => {
      if (!v.question.includes("___")) warning(`Vocabulary sentence ${i + 1} has no blank (______).`);
      if (v.answer < 0 || v.answer >= v.options.length) problem(`Vocabulary sentence ${i + 1} has no correct answer.`);
      if (v.options.some((o) => !o.trim())) problem(`Vocabulary sentence ${i + 1} has an empty option.`);
    });
  }

  // Level benchmark (appendix of the brief).
  const bench = BENCHMARKS[item.level];
  const words = wordCount(item.passage);
  if (bench && words > 0) {
    if (words < bench.words * 0.75) warning(`The passage has ${words} words: much shorter than Level ${item.level}'s benchmark of about ${bench.words}.`);
    if (words > bench.words * 1.25) warning(`The passage has ${words} words: much longer than Level ${item.level}'s benchmark of about ${bench.words}.`);
    if (item.type === "lesson") {
      const thinking = item.comprehension.filter((q) => q.thinking).length;
      if (thinking !== bench.thinking) warning(`${thinking} thinking question(s); Level ${item.level} usually has ${bench.thinking}.`);
    }
  }
  const lower = item.passage.join(" ").toLowerCase();
  const missing = item.spelling.filter((w) => !lower.includes(w.toLowerCase()));
  if (missing.length) warning(`Spelling words not found in the passage: ${missing.join(", ")}.`);
  return out;
}

/** Word count and sentence length for the benchmark box next to the passage. */
export function passageStats(passage: string) {
  const p = lines(passage);
  const words = wordCount(p);
  const sentences = sentenceCount(p);
  return { words, sentences, average: sentences ? Math.round((words / sentences) * 10) / 10 : 0 };
}

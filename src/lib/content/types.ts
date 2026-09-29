// The content data format from section 9 of PROJECT-BRIEF.md.
// Lessons and calibration passages are stored as data, never built into code.

export type Language = "af" | "en";
export type ContentType = "lesson" | "calibration";
export type Status = "draft" | "in_review" | "published" | "retired";
export type Layout = "lines" | "paragraphs";

export const LANGUAGES: Language[] = ["af", "en"];
export const STATUSES: Status[] = ["draft", "in_review", "published", "retired"];

export interface WordCard {
  word: string;
  /** 1–2 simple definitions, one sentence each. */
  definitions: string[];
  example: string;
  /** Plural, verb forms or opposite, e.g. "Een heining, baie heinings". */
  forms: string | null;
  /** The word in the other language. */
  translation: string;
  /** Picture file, once pictures exist. */
  image: string | null;
  /** Description of the picture still to be made (Levels 1–2). */
  imageNote: string | null;
  /** true = support card, shown only when the learner needs more help. */
  extra: boolean;
}

export interface MultipleChoice {
  question: string;
  options: string[];
  /** Position of the correct option in `options`, counting from 0. */
  answer: number;
  /** A thinking question (Dinkvraag): the answer is inferred, not stated. */
  thinking: boolean;
}

export interface GrammarItem {
  prompt: string;
  /** Accepted answers for a one-blank item. */
  accepted?: string[];
  /** Accepted answers per blank, for items with two blanks (e.g. min – minder – minste). */
  blanks?: string[][];
  /** Fixed choices, e.g. ["their", "there"] or ["F", "O"]. */
  choices?: string[];
  /** A note for the reviewer, shown after answering, e.g. "(knead)". */
  note?: string;
}

export interface Grammar {
  focus: string;
  instruction: string;
  /** Extra note written next to the instruction, meant for the reviewer or developer. */
  instructionNote?: string;
  items: GrammarItem[];
}

export interface Vocabulary {
  /** Sentence with "______" where the word goes. */
  sentence: string;
  options: string[];
  answer: number;
}

interface ContentBase {
  id: string;
  language: Language;
  level: number;
  status: Status;
  title: string;
  /** Order within the language and level, from the source document. */
  sequence: number;
  layout: Layout;
  /** Sentences (layout "lines") or paragraphs (layout "paragraphs"). */
  passage: string[];
  comprehension: MultipleChoice[];
  spelling: string[];
  /** Why the item needs checking (set by the import for items in review). */
  reviewNote?: string;
}

export interface Lesson extends ContentBase {
  type: "lesson";
  topic: string;
  wordCards: WordCard[];
  /** Support words that do not have full word cards yet. */
  extraWords: string[];
  grammar: Grammar;
  vocabulary: Vocabulary[];
}

export interface Calibration extends ContentBase {
  type: "calibration";
  topic: null;
}

export type ContentItem = Lesson | Calibration;

export const TOPICS: { key: string; en: string; af: string }[] = [
  { key: "animals", en: "Animals", af: "Diere" },
  { key: "nature", en: "Nature and outdoors", af: "Natuur en buitelug" },
  { key: "sport", en: "Sport and games", af: "Sport en speletjies" },
  { key: "space", en: "Space and stars", af: "Die ruimte en sterre" },
  { key: "food", en: "Food and cooking", af: "Kos en kook" },
  { key: "adventure", en: "Adventure and make-believe", af: "Avontuur en fantasie" },
  { key: "body", en: "My body and health", af: "My liggaam en gesondheid" },
  { key: "how-things-work", en: "How things work", af: "Hoe dinge werk" },
];

/** Level benchmarks from the brief's appendix. */
export const BENCHMARKS: Record<number, { words: number; sentence: string; wordCards: string; thinking: number }> = {
  1: { words: 70, sentence: "~6 words", wordCards: "4 + pictures", thinking: 0 },
  2: { words: 110, sentence: "~8–9 words", wordCards: "5 + pictures", thinking: 0 },
  3: { words: 165, sentence: "12–13 words", wordCards: "6 + 2 extra", thinking: 1 },
  4: { words: 250, sentence: "13–15 words", wordCards: "6 + 2 extra", thinking: 1 },
  5: { words: 340, sentence: "15–18 words", wordCards: "6 + 2 extra", thinking: 2 },
};

export const layoutForLevel = (level: number): Layout => (level <= 3 ? "lines" : "paragraphs");

/** Word count, calculated automatically from the passage. 'n counts as a word. */
export function wordCount(passage: string[]): number {
  return passage
    .join(" ")
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export function sentenceCount(passage: string[]): number {
  const text = passage.join(" ");
  const matches = text.match(/[.!?]+["”’']?(?=\s|$)/g);
  return matches ? matches.length : 0;
}

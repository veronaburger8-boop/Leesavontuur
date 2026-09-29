// Converts content/lessons-source.md (the Markdown export of the owner's
// lessons document) into the content data format. The rules are in CLAUDE.md
// under "Converting the content".
//
// The parser never rewrites content. It only removes Markdown formatting and
// expands the shortened comprehension options described in CLAUDE.md. Anything
// it cannot read with confidence is recorded as an issue for the owner.

import {
  type Calibration,
  type ContentItem,
  type Grammar,
  type GrammarItem,
  type Language,
  type Lesson,
  type MultipleChoice,
  type Vocabulary,
  type WordCard,
  layoutForLevel,
} from "./types";

export type IssueKind = "flag" | "note";

export interface Issue {
  /** "flag" = the owner must check it; the item is imported as "in_review". */
  kind: IssueKind;
  itemId: string;
  title: string;
  message: string;
}

export interface Expansion {
  itemId: string;
  title: string;
  question: string;
  original: string;
  options: string[];
}

export interface ParseResult {
  items: ContentItem[];
  issues: Issue[];
  expansions: Expansion[];
  /** Word counts stated in the source ("About 162 words"), by item id. */
  statedWordCounts: Record<string, number>;
}

/** Topics for the first lesson of each level, which has no Topic line (CLAUDE.md). */
const FIRST_LESSON_TOPICS: Record<string, string> = {
  "af-1": "animals",
  "en-1": "nature",
  "af-2": "animals",
  "en-2": "food",
  "af-3": "nature",
  "en-3": "food",
  "af-4": "animals",
  "en-4": "space",
  "af-5": "nature",
  "en-5": "body",
};

const TOPIC_NAMES: Record<string, string> = {
  animals: "animals",
  "nature and outdoors": "nature",
  "sport and games": "sport",
  "space and stars": "space",
  "food and cooking": "food",
  "adventure and make-believe": "adventure",
  "my body and health": "body",
  "how things work": "how-things-work",
};

const LANGUAGE_NAMES: Record<string, Language> = { Afrikaans: "af", English: "en" };

/** Removes Markdown backslash escapes, e.g. \_ and \~. */
export function unescapeMd(s: string): string {
  return s.replace(/\\([\\`*_{}[\]()#+\-.!~|>"'])/g, "$1");
}

const stripBold = (s: string) => s.replace(/\*\*/g, "");

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Splits text into sentences. A sentence ends with . ! or ? (optionally
 * followed by a closing quote), then a space and a capital letter, a digit,
 * an opening quote or Afrikaans 'n.
 */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?]["”’]?)\s+(?=[\p{Lu}\p{N}"“'‘])/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

interface Block {
  heading: string;
  lines: string[];
}

/** Splits lines into blocks at every heading of the given depth. */
function splitBlocks(lines: string[], depth: number): { preamble: string[]; blocks: Block[] } {
  const marker = "#".repeat(depth) + " ";
  const preamble: string[] = [];
  const blocks: Block[] = [];
  for (const line of lines) {
    if (line.startsWith(marker)) blocks.push({ heading: line.slice(marker.length).trim(), lines: [] });
    else if (blocks.length) blocks[blocks.length - 1].lines.push(line);
    else preamble.push(line);
  }
  return { preamble, blocks };
}

/** Groups lines into paragraphs separated by blank lines. */
function paragraphs(lines: string[]): string[][] {
  const out: string[][] = [];
  let cur: string[] = [];
  for (const line of lines) {
    if (line.trim() === "") {
      if (cur.length) out.push(cur);
      cur = [];
    } else cur.push(line);
  }
  if (cur.length) out.push(cur);
  return out;
}

class Collector {
  issues: Issue[] = [];
  expansions: Expansion[] = [];
  constructor(
    public itemId: string,
    public title: string,
  ) {}
  flag(message: string) {
    this.issues.push({ kind: "flag", itemId: this.itemId, title: this.title, message });
  }
  note(message: string) {
    this.issues.push({ kind: "note", itemId: this.itemId, title: this.title, message });
  }
}

// ---------------------------------------------------------------- passage

function parsePassage(lines: string[], level: number, c: Collector): string[] {
  const paras = paragraphs(lines);
  const layout = layoutForLevel(level);
  if (layout === "lines") {
    const out: string[] = [];
    for (const p of paras) for (const l of p) out.push(unescapeMd(l.replace(/\\$/, "").trim()));
    if (paras.length > 1) c.note(`Passage has ${paras.length} blocks separated by blank lines; they were joined line by line.`);
    const multi = out.filter((l) => splitSentences(l).length > 1);
    if (multi.length)
      c.note(`${multi.length} passage line(s) hold more than one sentence (fine for dialogue, but check): "${multi[0]}"`);
    return out.filter(Boolean);
  }
  const out = paras.map((p) =>
    unescapeMd(
      p
        .map((l) => l.replace(/\\$/, "").trim())
        .join(" ")
        .replace(/\s+/g, " "),
    ),
  );
  if (paras.some((p) => p.length > 1)) c.note("A paragraph contains line breaks; the lines were joined.");
  return out;
}

// ---------------------------------------------------------------- word cards

const CARD_RE = /^\*\*(.+?)\*\*\s+–\s+(.*)$/;

export function parseWordCard(text: string, language: Language, c: Collector): WordCard | null {
  const m = text.match(CARD_RE);
  if (!m) {
    c.flag(`Could not read word card: "${text.slice(0, 80)}…"`);
    return null;
  }
  const word = unescapeMd(m[1].trim());
  let rest = m[2].trim();

  let imageNote: string | null = null;
  const img = rest.match(/\s*\*(?:Prent|Picture):\s*(.*?)\*\s*$/);
  if (img) {
    imageNote = unescapeMd(img[1].trim());
    rest = rest.slice(0, img.index).trim();
  }

  const otherLang = language === "af" ? "Engels" : "Afrikaans";
  const tr = rest.match(new RegExp(`\\s*${otherLang}:\\s*["“](.*?)["”]\\.?\\s*$`));
  let translation = "";
  if (tr) {
    translation = unescapeMd(tr[1].trim());
    rest = rest.slice(0, tr.index).trim();
  } else c.flag(`Word card "${word}" has no translation ("${otherLang}: "…"").`);

  const marker = language === "af" ? /\s(?:Bv\.)\s/ : /\s(?:e\.g\.)\s/;
  const mk = rest.match(marker);
  let definitions: string[] = [];
  let example = "";
  let forms: string | null = null;
  if (mk && mk.index !== undefined) {
    definitions = splitSentences(unescapeMd(rest.slice(0, mk.index).trim()));
    const after = splitSentences(unescapeMd(rest.slice(mk.index + mk[0].length).trim()));
    example = after[0] ?? "";
    if (after.length > 1) forms = after.slice(1).join(" ").replace(/\.$/, "");
  } else {
    definitions = splitSentences(unescapeMd(rest));
    c.flag(`Word card "${word}" has no example sentence (no "${language === "af" ? "Bv." : "e.g."}").`);
  }
  if (!definitions.length) c.flag(`Word card "${word}" has no definition.`);
  if (definitions.length > 2) c.note(`Word card "${word}" has ${definitions.length} definition sentences (the guide says 1–2).`);
  if (forms && !looksLikeForms(forms, language))
    c.note(`Word card "${word}": check the example / forms split. Example: "${example}" Forms: "${forms}"`);

  return { word, definitions, example, forms, translation, image: null, imageNote, extra: false };
}

/** The usual shapes of the "forms" part of a word card. */
function looksLikeForms(forms: string, language: Language): boolean {
  const af = /^(Een |Ek |Hulle |Teenoorgestelde|Meervoud|Verkleinwoord|Hy |Sy |Dit |Trappe|Ons )/;
  const en = /^(One |I |Opposite|Plural|He |She |It |We |They |[A-Za-z]+, [A-Za-z]+er, [A-Za-z]+est)/;
  return (language === "af" ? af : en).test(forms);
}

// ---------------------------------------------------------------- multiple choice

interface RawOption {
  text: string;
  correct: boolean;
}

function splitOptions(s: string): RawOption[] {
  return s.split(" / ").map((raw) => {
    const correct = raw.includes("✓");
    const text = unescapeMd(stripBold(raw).replace("✓", "").replace(/\s+/g, " ").trim());
    return { text, correct };
  });
}

const endsSentence = (s: string) => /[.!?]["”’]?$/.test(s);
const startsLower = (s: string) => /^\p{Ll}/u.test(s);
const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const words = (s: string) => s.split(/\s+/).filter(Boolean);

function mode(nums: number[]): number {
  const counts = new Map<number, number>();
  for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1);
  let best = nums[0] ?? 1;
  let bestCount = 0;
  for (const [n, k] of counts)
    if (k > bestCount || (k === bestCount && n < best)) {
      best = n;
      bestCount = k;
    }
  return best;
}

/** Articles and prepositions: an option rarely starts or ends with one of these. */
const FUNCTION_WORDS = new Set(
  (
    "a an the to from at in on of for with by into onto like as about " +
    "'n die van na op met vir uit om te soos aan oor tot deur"
  ).split(" "),
);

/**
 * Chooses how many words at the end ("end") or start ("start") of a segment
 * form the option. Prefers the length closest to the other options' usual
 * length, and rejects options that start or end with an article or
 * preposition (unless the middle options start with the same word).
 */
function bestOptionLength(segment: string[], usual: number, middleStarts: Set<string>, side: "start" | "end"): number | null {
  const maxK = segment.length;
  let best: number | null = null;
  for (let k = 1; k <= maxK; k++) {
    const opt = side === "end" ? segment.slice(segment.length - k) : segment.slice(0, k);
    const firstWord = opt[0].toLowerCase();
    const lastWord = opt[opt.length - 1].toLowerCase();
    if (FUNCTION_WORDS.has(firstWord) && !middleStarts.has(firstWord)) continue;
    if (FUNCTION_WORDS.has(lastWord)) continue;
    if (best === null || Math.abs(k - usual) < Math.abs(best - usual)) best = k;
  }
  return best;
}

/**
 * Expands shortened options (CLAUDE.md, "Watch out"). Returns null when the
 * options are already full.
 *
 * Shape A: "Karel woon saam met sy ma. / sy oupa. / sy ouma." – the later
 * options replace the end of the first one.
 * Shape B: "Want groente het baie lig / skaduwee / wind / reën / sand nodig." –
 * a shared start on the first option and a shared end on the last one.
 */
export function expandShorthand(opts: string[]): string[] | null {
  if (opts.length < 2) return null;
  const first = opts[0];
  const last = opts[opts.length - 1];
  const middle = opts.slice(1, -1);

  // Shape B: only the last option ends the sentence.
  if (!endsSentence(first) && endsSentence(last) && middle.every((o) => !endsSentence(o))) {
    const n = middle.length ? mode(middle.map((o) => words(o).length)) : 1;
    const middleStarts = new Set(middle.map((o) => words(o)[0]?.toLowerCase()));
    const fw = words(first);
    const punct = last.match(/[.!?]["”’]?$/)![0];
    const lw = words(last.slice(0, -punct.length));
    // How many words of the first segment form the first option (the rest is
    // the shared start), and how many of the last segment form the last option
    // (the rest is the shared end).
    const k1 = bestOptionLength(fw, n, middleStarts, "end");
    const k2 = bestOptionLength(lw, n, middleStarts, "start");
    if (k1 === null || k2 === null) return null;
    const prefix = fw.slice(0, fw.length - k1).join(" ");
    const firstOpt = fw.slice(fw.length - k1).join(" ");
    const lastOpt = lw.slice(0, k2).join(" ");
    const suffix = lw.slice(k2).join(" ");
    const build = (o: string) => capitalise(`${prefix ? prefix + " " : ""}${o}${suffix ? " " + suffix : ""}${punct}`);
    return [firstOpt, ...middle, lastOpt].map(build);
  }

  // Shape A: a full first sentence, followed by fragments starting in lower case.
  const rest = opts.slice(1);
  if (endsSentence(first) && !startsLower(first) && rest.some(startsLower)) {
    const fragments = rest.filter(startsLower);
    const n = mode(fragments.map((o) => words(o).length));
    const fw = words(first);
    if (fw.length <= n) return null;
    const prefix = fw.slice(0, fw.length - n).join(" ");
    return [first, ...rest.map((o) => (startsLower(o) ? `${prefix} ${o}` : o))];
  }
  return null;
}

const QUESTION_RE = /^\d+\.\s+\*\*(.+?)\*\*\s+(.*)$/;

function parseMultipleChoiceQuestion(line: string, c: Collector): MultipleChoice | null {
  const m = line.match(QUESTION_RE);
  if (!m) {
    c.flag(`Could not read comprehension question: "${line.slice(0, 90)}"`);
    return null;
  }
  let question = unescapeMd(m[1].trim());
  let thinking = false;
  const th = question.match(/^\((?:Dinkvraag|Thinking)\)\s*/i);
  if (th) {
    thinking = true;
    question = question.slice(th[0].length);
  }
  const raw = splitOptions(m[2]);
  let options = raw.map((o) => o.text);
  const expanded = expandShorthand(options);
  if (expanded) {
    c.expansions.push({ itemId: c.itemId, title: c.title, question, original: m[2], options: expanded });
    c.flag(`Shortened options were expanded into full sentences for "${question}"; please check them.`);
    options = expanded;
  }
  const correct = raw.map((o, i) => (o.correct ? i : -1)).filter((i) => i >= 0);
  if (correct.length !== 1) c.flag(`Question "${question}" has ${correct.length} options marked ✓ (expected exactly 1).`);
  if (options.some((o) => !o)) c.flag(`Question "${question}" has an empty option.`);
  return { question, options, answer: correct[0] ?? 0, thinking };
}

function parseNumberedList(lines: string[]): string[] {
  return lines.filter((l) => /^\d+\.\s/.test(l.trim())).map((l) => l.trim());
}

// ---------------------------------------------------------------- grammar

const CHOICES_RE = /\s*\(([^()]+?\s\/\s[^()]+?)\)\s*$/;

export function parseGrammarItem(line: string, focus: string, language: Language, c: Collector): GrammarItem | null {
  const body = line.replace(/^\d+\.\s+/, "");
  const split = body.indexOf(" – **");
  if (split < 0) {
    c.flag(`Could not read grammar item: "${line}"`);
    return null;
  }
  let prompt = unescapeMd(body.slice(0, split).trim());
  let tail = body.slice(split + 3).trim();

  // *(accept: x, y)* – alternative answers.
  let alternatives: string[] = [];
  const acc = tail.match(/\s*\*\(accept:\s*(.*?)\)\*/i);
  if (acc) {
    alternatives = acc[1].split(",").map((s) => unescapeMd(s.trim())).filter(Boolean);
    tail = (tail.slice(0, acc.index) + tail.slice(acc.index! + acc[0].length)).trim();
  }

  // The answers: **a** or **a** – **b**, then an optional note in brackets.
  const answers: string[] = [];
  let pos = 0;
  const boldRe = /\*\*(.+?)\*\*/y;
  for (;;) {
    boldRe.lastIndex = pos;
    const b = boldRe.exec(tail);
    if (!b) break;
    answers.push(unescapeMd(b[1].trim()));
    pos = boldRe.lastIndex;
    const sep = tail.slice(pos).match(/^\s+–\s+(?=\*\*)/);
    if (!sep) break;
    pos += sep[0].length;
  }
  let note: string | undefined;
  const remainder = tail.slice(pos).trim();
  if (remainder) {
    const n = remainder.match(/^\*?\((.*)\)\*?$/);
    if (n) note = unescapeMd(n[1].trim());
    else c.flag(`Grammar item "${prompt}" has unexpected text after the answer: "${remainder}"`);
  }
  if (!answers.length) {
    c.flag(`Grammar item "${prompt}" has no answer in bold.`);
    return null;
  }

  const item: GrammarItem = { prompt, accepted: [] };
  if (answers.length === 1) {
    item.accepted = [answers[0], ...alternatives];
  } else {
    delete item.accepted;
    item.blanks = answers.map((a) => [a]);
    if (alternatives.length === answers.length) alternatives.forEach((a, i) => item.blanks![i].push(a));
    else if (alternatives.length) {
      c.flag(
        `Grammar item "${prompt}" has ${answers.length} blanks but ${alternatives.length} extra accepted answer(s); I could not tell which blank they belong to, so they were left out.`,
      );
    }
  }

  const ch = prompt.match(CHOICES_RE);
  if (ch) {
    item.choices = ch[1].split(" / ").map((s) => s.trim());
    prompt = prompt.slice(0, ch.index).trim();
    item.prompt = prompt;
    if (!item.choices.includes(answers[0])) c.flag(`Grammar item "${prompt}": the answer "${answers[0]}" is not one of the choices.`);
  } else if (/feit of mening|fact or opinion/i.test(focus)) {
    item.choices = language === "af" ? ["F", "M"] : ["F", "O"];
    if (!item.choices.includes(answers[0])) c.flag(`Grammar item "${prompt}": expected ${item.choices.join(" or ")}, found "${answers[0]}".`);
  }
  if (note) item.note = note;
  return item;
}

function parseGrammar(heading: string, lines: string[], language: Language, c: Collector): Grammar {
  const focus = heading.replace(/^(Grammatika|Grammar):\s*/, "").replace(/\s*\(\d+\)\s*$/, "").trim();
  const instrLine = lines.find((l) => l.trim().startsWith("*") && !/^\d+\./.test(l.trim()))?.trim() ?? "";
  let instruction = "";
  let instructionNote: string | undefined;
  const im = instrLine.match(/^\*(.+?)\*(?:\s+\((.+)\))?\s*$/);
  if (im) {
    instruction = unescapeMd(im[1].trim());
    if (im[2]) instructionNote = unescapeMd(im[2].trim());
  } else c.flag("Grammar exercise has no instruction line in italics.");
  const items = parseNumberedList(lines)
    .map((l) => parseGrammarItem(l, focus, language, c))
    .filter((x): x is GrammarItem => x !== null);
  const grammar: Grammar = { focus: unescapeMd(focus), instruction, items };
  if (instructionNote) grammar.instructionNote = instructionNote;
  return grammar;
}

// ---------------------------------------------------------------- vocabulary

export function parseVocabularyLine(line: string, c: Collector): Vocabulary | null {
  const body = unescapeMd(line.replace(/^\d+\.\s+/, ""));
  const firstSlash = body.indexOf(" / ");
  if (firstSlash < 0) {
    c.flag(`Could not read vocabulary item: "${line}"`);
    return null;
  }
  const head = body.slice(0, firstSlash);
  // The sentence ends at the last sentence end (with an optional closing quote) before the first option.
  const ends = [...head.matchAll(/[.!?]["”’]?\s/g)];
  const last = ends[ends.length - 1];
  if (!last || last.index === undefined) {
    c.flag(`Could not find where the sentence ends in vocabulary item: "${line}"`);
    return null;
  }
  const sentence = head.slice(0, last.index + last[0].length).trim();
  const rawOptions = head.slice(last.index + last[0].length) + body.slice(firstSlash);
  const opts = splitOptions(rawOptions);
  const correct = opts.map((o, i) => (o.correct ? i : -1)).filter((i) => i >= 0);
  const vocab: Vocabulary = { sentence, options: opts.map((o) => o.text), answer: correct[0] ?? 0 };
  if (!sentence.includes("______")) c.flag(`Vocabulary sentence has no blank: "${sentence}"`);
  if (correct.length !== 1) c.flag(`Vocabulary item "${sentence}" has ${correct.length} options marked ✓ (expected exactly 1).`);
  if (opts.length !== 4) c.flag(`Vocabulary item "${sentence}" has ${opts.length} options (expected 4).`);
  return vocab;
}

// ---------------------------------------------------------------- spelling

function parseSpelling(text: string): string[] {
  return unescapeMd(text)
    .split(",")
    .map((w) => w.trim().replace(/\.$/, ""))
    .filter(Boolean);
}

// ---------------------------------------------------------------- lessons

const LESSON_HEADING = /^Level (\d+) – (Afrikaans|English)(?: (\d+))?: (.+)$/;

function parseLesson(block: Block, idsSeen: Set<string>): { lesson: Lesson; c: Collector; stated?: number } | null {
  const h = block.heading.match(LESSON_HEADING);
  if (!h) return null;
  const level = Number(h[1]);
  const language = LANGUAGE_NAMES[h[2]];
  const sequence = h[3] ? Number(h[3]) : 1;
  const title = unescapeMd(h[4].trim());
  let id = `${language}-l${level}-${slugify(title)}`;
  if (idsSeen.has(id)) id = `${id}-${sequence}`;
  idsSeen.add(id);
  const c = new Collector(id, title);

  const { preamble, blocks } = splitBlocks(block.lines, 3);
  const intro = preamble.join(" ").trim();

  let topic: string | undefined;
  const t = intro.match(/Topic:\s*([^.]+)\./);
  if (t) {
    // e.g. "Adventure and make-believe (a true story)": the part in brackets describes the passage.
    const name = t[1].trim();
    const base = name.replace(/\s*\(.*\)\s*$/, "");
    topic = TOPIC_NAMES[base.toLowerCase()];
    if (!topic) c.flag(`Unknown topic "${name}".`);
    else if (base !== name) c.note(`Topic "${name}" was read as "${base}".`);
  } else {
    topic = FIRST_LESSON_TOPICS[`${language}-${level}`];
    if (sequence !== 1) c.flag("Lesson has no Topic line.");
  }
  const stated = intro.match(/About (\d+) words/);

  const find = (re: RegExp) => blocks.find((b) => re.test(b.heading));
  const cardsBlock = find(/^(Woordkaarte|Word cards)/);
  const passageBlock = find(/^(Die leesstuk|The passage)$/);
  const compBlock = find(/^(Begrip|Comprehension)/);
  const spellBlock = find(/^(Woordherkenning|Word recognition)/);
  const gramBlock = find(/^(Grammatika|Grammar):/);
  const vocabBlock = find(/^(Woordeskat|Vocabulary)/);
  for (const [name, b] of [
    ["word cards", cardsBlock],
    ["passage", passageBlock],
    ["comprehension", compBlock],
    ["word recognition", spellBlock],
    ["grammar", gramBlock],
    ["vocabulary", vocabBlock],
  ] as const)
    if (!b) c.flag(`Missing section: ${name}.`);

  const wordCards: WordCard[] = [];
  const extraWords: string[] = [];
  if (cardsBlock) {
    for (const p of paragraphs(cardsBlock.lines)) {
      const text = p.join(" ").trim();
      const extra = text.match(/^\*Extra cards for more support:\*\s*(.*)$/);
      if (extra) extraWords.push(...parseSpelling(extra[1]));
      else {
        const card = parseWordCard(text, language, c);
        if (card) wordCards.push(card);
      }
    }
    const stated = cardsBlock.heading.match(/\((\d+)\)/);
    if (stated && Number(stated[1]) !== wordCards.length)
      c.flag(`The heading says ${stated[1]} word cards, but ${wordCards.length} were found.`);
  }

  const passage = passageBlock ? parsePassage(passageBlock.lines, level, c) : [];
  const comprehension = compBlock
    ? parseNumberedList(compBlock.lines)
        .map((l) => parseMultipleChoiceQuestion(l, c))
        .filter((x): x is MultipleChoice => x !== null)
    : [];
  const spelling = spellBlock ? parseSpelling(spellBlock.lines.join(" ").trim()) : [];
  const grammar = gramBlock ? parseGrammar(gramBlock.heading, gramBlock.lines, language, c) : { focus: "", instruction: "", items: [] };
  const vocabulary = vocabBlock
    ? parseNumberedList(vocabBlock.lines)
        .map((l) => parseVocabularyLine(l, c))
        .filter((x): x is Vocabulary => x !== null)
    : [];

  const lesson: Lesson = {
    id,
    type: "lesson",
    language,
    level,
    topic: topic ?? "",
    status: "published",
    title,
    sequence,
    layout: layoutForLevel(level),
    passage,
    wordCards,
    extraWords,
    comprehension,
    spelling,
    grammar,
    vocabulary,
  };
  return { lesson, c, stated: stated ? Number(stated[1]) : undefined };
}

// ---------------------------------------------------------------- calibration

const CAL_HEADING = /^Calibration – Level (\d+)$/;
const CAL_ITEM_HEADING = /^(Afrikaans|English) (\d+): (.+)$/;

function parseCalibrationLevel(block: Block, idsSeen: Set<string>): { item: Calibration; c: Collector }[] {
  const level = Number(block.heading.match(CAL_HEADING)![1]);
  const { blocks } = splitBlocks(block.lines, 3);
  const out: { item: Calibration; c: Collector }[] = [];
  for (const b of blocks) {
    const h = b.heading.match(CAL_ITEM_HEADING);
    if (!h) continue;
    const language = LANGUAGE_NAMES[h[1]];
    const sequence = Number(h[2]);
    const title = unescapeMd(h[3].trim());
    let id = `cal-${language}-l${level}-${slugify(title)}`;
    if (idsSeen.has(id)) id = `${id}-${sequence}`;
    idsSeen.add(id);
    const c = new Collector(id, title);

    const compStart = b.lines.findIndex((l) => /^\*\*(Begrip|Comprehension)\b/.test(l.trim()));
    const spellIdx = b.lines.findIndex((l) => /^\*\*Spelling\b/.test(l.trim()));
    if (compStart < 0) c.flag("Missing comprehension questions.");
    if (spellIdx < 0) c.flag("Missing spelling words.");
    const passageEnd = compStart >= 0 ? compStart : spellIdx >= 0 ? spellIdx : b.lines.length;
    const passage = parsePassage(b.lines.slice(0, passageEnd), level, c);
    const compLines = compStart >= 0 ? b.lines.slice(compStart + 1, spellIdx > compStart ? spellIdx : undefined) : [];
    const comprehension = parseNumberedList(compLines)
      .map((l) => parseMultipleChoiceQuestion(l, c))
      .filter((x): x is MultipleChoice => x !== null);
    let spelling: string[] = [];
    if (spellIdx >= 0) {
      const sm = b.lines[spellIdx].trim().match(/^\*\*Spelling \(\d+\):\*\*\s*(.*)$/);
      if (sm) spelling = parseSpelling(sm[1]);
      else c.flag(`Could not read spelling line: "${b.lines[spellIdx]}"`);
    }
    out.push({
      item: {
        id,
        type: "calibration",
        language,
        level,
        topic: null,
        status: "published",
        title,
        sequence,
        layout: layoutForLevel(level),
        passage,
        comprehension,
        spelling,
      },
      c,
    });
  }
  return out;
}

// ---------------------------------------------------------------- checks

/** Structural checks from CLAUDE.md ("Validation report"). */
export function checkItem(item: ContentItem): string[] {
  const problems: string[] = [];
  const isLesson = item.type === "lesson";
  const nQ = isLesson ? 5 : 4;
  const nS = isLesson ? 10 : 7;
  if (!item.passage.length) problems.push("The passage is empty.");
  if (item.comprehension.length !== nQ) problems.push(`${item.comprehension.length} comprehension questions (expected ${nQ}).`);
  item.comprehension.forEach((q, i) => {
    if (q.options.length !== 5) problems.push(`Question ${i + 1} has ${q.options.length} options (expected 5).`);
    if (q.answer < 0 || q.answer >= q.options.length) problems.push(`Question ${i + 1} has no valid correct answer.`);
  });
  if (item.spelling.length !== nS) problems.push(`${item.spelling.length} spelling words (expected ${nS}).`);
  if (item.type === "lesson") {
    if (!item.topic) problems.push("No topic.");
    if (!item.wordCards.length) problems.push("No word cards.");
    if (item.grammar.items.length !== 5) problems.push(`${item.grammar.items.length} grammar items (expected 5).`);
    if (item.vocabulary.length !== 5) problems.push(`${item.vocabulary.length} vocabulary items (expected 5).`);
  }
  return problems;
}

// ---------------------------------------------------------------- main

const SKIP = new Set(["Program overview", "Level benchmarks"]);

export function parseSource(markdown: string): ParseResult {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const { blocks } = splitBlocks(lines, 2);
  const idsSeen = new Set<string>();
  const items: ContentItem[] = [];
  const issues: Issue[] = [];
  const expansions: Expansion[] = [];
  const statedWordCounts: Record<string, number> = {};

  for (const block of blocks) {
    if (SKIP.has(block.heading)) continue;
    if (LESSON_HEADING.test(block.heading)) {
      const r = parseLesson(block, idsSeen)!;
      items.push(r.lesson);
      if (r.stated) statedWordCounts[r.lesson.id] = r.stated;
      for (const p of checkItem(r.lesson)) r.c.flag(p);
      issues.push(...r.c.issues);
      expansions.push(...r.c.expansions);
    } else if (CAL_HEADING.test(block.heading)) {
      for (const r of parseCalibrationLevel(block, idsSeen)) {
        items.push(r.item);
        for (const p of checkItem(r.item)) r.c.flag(p);
        issues.push(...r.c.issues);
        expansions.push(...r.c.expansions);
      }
    } else {
      issues.push({ kind: "note", itemId: "-", title: block.heading, message: "Section was not recognised and was skipped." });
    }
  }

  // Flagged items are imported for review instead of going live, with the
  // reasons as a review note.
  for (const item of items) {
    const flags = issues.filter((i) => i.kind === "flag" && i.itemId === item.id).map((i) => i.message);
    if (flags.length) {
      item.status = "in_review";
      item.reviewNote = flags.join("\n");
    }
  }

  return { items, issues, expansions, statedWordCounts };
}

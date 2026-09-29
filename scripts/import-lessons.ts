// Converts content/lessons-source.md into content/lessons.json and writes the
// validation report content/import-report.md for the owner.
//
// Run with: npm run content:convert

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseSource, type Issue } from "../src/lib/content/parse-source";
import { BENCHMARKS, type ContentItem, type Lesson, sentenceCount, wordCount } from "../src/lib/content/types";

const root = join(__dirname, "..");
const source = readFileSync(join(root, "content/lessons-source.md"), "utf8");
const { items, issues, expansions, statedWordCounts } = parseSource(source);

writeFileSync(join(root, "content/lessons.json"), JSON.stringify(items, null, 2) + "\n", "utf8");

// ------------------------------------------------------------------ report

const LANG = { af: "Afrikaans", en: "English" } as const;
const lessons = items.filter((i): i is Lesson => i.type === "lesson");
const calibrations = items.filter((i) => i.type === "calibration");
const flaggedIds = new Set(issues.filter((i) => i.kind === "flag").map((i) => i.itemId));
const label = (i: ContentItem) => `${LANG[i.language]} L${i.level}${i.type === "calibration" ? " calibration" : ""} – ${i.title}`;
const byId = new Map(items.map((i) => [i.id, i]));
const esc = (s: string) => s.replace(/\|/g, "\\|");

const out: string[] = [];
const p = (s = "") => out.push(s);

p("# Import report");
p();
p("This report is written automatically by the import script (`npm run content:convert`) from `content/lessons-source.md`.");
p("Nothing in the lessons was rewritten. Items listed under **Please check** were imported with the status **In review**, so children won't see them until you publish them in the admin area. Everything else was imported as **Published**.");
p();

// Summary
p("## Summary");
p();
const ok = (b: boolean) => (b ? "✅" : "❌");
p("| Check | Expected | Found | |");
p("| --- | --- | --- | --- |");
p(`| Lessons | 100 | ${lessons.length} | ${ok(lessons.length === 100)} |`);
p(`| Calibration passages | 30 | ${calibrations.length} | ${ok(calibrations.length === 30)} |`);
p(`| Imported as Published | | ${items.filter((i) => i.status === "published").length} | |`);
p(`| Imported as In review (please check) | | ${items.filter((i) => i.status === "in_review").length} | |`);
p();
p("Lessons and calibration passages per level:");
p();
p("| Level | Afrikaans lessons | English lessons | Afrikaans calibration | English calibration |");
p("| --- | --- | --- | --- | --- |");
for (let level = 1; level <= 5; level++) {
  const n = (type: string, lang: string) => items.filter((i) => i.type === type && i.language === lang && i.level === level).length;
  const cell = (v: number, want: number) => `${v} ${ok(v === want)}`;
  p(`| ${level} | ${cell(n("lesson", "af"), 10)} | ${cell(n("lesson", "en"), 10)} | ${cell(n("calibration", "af"), 3)} | ${cell(n("calibration", "en"), 3)} |`);
}
p();

// Structural checks
const structural = [
  ["5 comprehension questions (calibration: 4), each with exactly one ✓", (i: ContentItem) => i.comprehension.length === (i.type === "lesson" ? 5 : 4)],
  ["10 spelling words (calibration: 7)", (i: ContentItem) => i.spelling.length === (i.type === "lesson" ? 10 : 7)],
  ["5 grammar items", (i: ContentItem) => i.type !== "lesson" || i.grammar.items.length === 5],
  ["5 vocabulary items, each with exactly one ✓", (i: ContentItem) => i.type !== "lesson" || i.vocabulary.length === 5],
] as const;
p("Every item was checked for:");
p();
for (const [text, test] of structural) {
  const bad = items.filter((i) => !test(i));
  p(`- ${text}: ${bad.length ? `❌ problems in ${bad.map(label).join("; ")}` : "✅ all items"}`);
}
const ticks = issues.filter((i) => /marked ✓/.test(i.message));
p(`- Exactly one correct answer (✓) per question: ${ticks.length ? `❌ ${ticks.length} problem(s), listed below` : "✅ all questions"}`);
p();

// Please check
p("## Please check");
p();
const flagged = items.filter((i) => flaggedIds.has(i.id));
if (!flagged.length) p("Nothing needs checking.");
for (const item of flagged) {
  p(`### ${label(item)}`);
  p();
  for (const issue of issues.filter((i) => i.itemId === item.id && i.kind === "flag" && !/Shortened options/.test(i.message)))
    p(`- ${issue.message}`);
  const ex = expansions.filter((e) => e.itemId === item.id);
  if (ex.length) {
    p(
      `- ${ex.length} question(s) had shortened options, which were expanded into full sentences. Please check that each expanded option reads correctly:`,
    );
    p();
    for (const e of ex) {
      p(`  **${e.question}**`);
      p(`  - In the document: ${e.original.trim()}`);
      p(`  - Expanded to:`);
      for (const o of e.options) p(`    - ${o}`);
      p();
    }
  }
  p();
}

// Extra support words
p("## Extra support words without word cards");
p();
p('These words are listed after "*Extra cards for more support:*" and do not have full word cards yet. They were saved with each lesson so you can add definitions later.');
p();
p("| Lesson | Words |");
p("| --- | --- |");
const withExtra = lessons.filter((l) => l.extraWords.length);
for (const l of withExtra) p(`| ${esc(label(l))} | ${esc(l.extraWords.join(", "))} |`);
p();
p(`${withExtra.reduce((n, l) => n + l.extraWords.length, 0)} words in ${withExtra.length} lessons.`);
p();

// Compared with the writing guide
p("## Compared with the level benchmarks");
p();
p("Word counts are calculated from the passage (every word counts, including 'n). ⚠️ marks a passage more than 20% away from the benchmark. This is for information only; it did not stop anything from being published.");
p();
p("| Item | Level benchmark | Words | Stated in document | Sentences | Avg. sentence |");
p("| --- | --- | --- | --- | --- | --- |");
for (const item of items) {
  const words = wordCount(item.passage);
  const bench = BENCHMARKS[item.level].words;
  const off = Math.abs(words - bench) / bench > 0.2;
  const sentences = sentenceCount(item.passage);
  const avg = sentences ? (words / sentences).toFixed(1) : "–";
  p(`| ${esc(label(item))} | ~${bench} | ${words}${off ? " ⚠️" : ""} | ${statedWordCounts[item.id] ?? "–"} | ${sentences} | ${avg} (${BENCHMARKS[item.level].sentence}) |`);
}
p();

const guide: string[] = [];
const expectedCards: Record<number, number> = { 1: 4, 2: 5, 3: 6, 4: 6, 5: 6 };
for (const l of lessons) {
  const want = expectedCards[l.level];
  if (l.wordCards.length !== want) guide.push(`${label(l)}: ${l.wordCards.length} word cards (guide: ${want}).`);
  if (l.level >= 3 && l.extraWords.length !== 2) guide.push(`${label(l)}: ${l.extraWords.length} extra support words (guide: 2).`);
  const thinking = l.comprehension.filter((q) => q.thinking).length;
  if (thinking !== BENCHMARKS[l.level].thinking)
    guide.push(`${label(l)}: ${thinking} thinking question(s) (guide: ${BENCHMARKS[l.level].thinking}).`);
}
p("Word cards, support words and thinking questions compared with the writing guide:");
p();
if (guide.length) for (const g of guide) p(`- ${g}`);
else p("- ✅ Every lesson matches the guide.");
p();

// Other notes
p("## Other notes");
p();
p("These did not stop anything from being published, but you may want to glance at them.");
p();
const notes = issues.filter((i) => i.kind === "note");
const grouped = new Map<string, Issue[]>();
for (const n of notes) grouped.set(n.itemId, [...(grouped.get(n.itemId) ?? []), n]);
for (const [id, list] of grouped) {
  const item = byId.get(id);
  p(`- **${item ? label(item) : list[0].title}**`);
  for (const n of list) p(`  - ${n.message}`);
}
const withInstrNotes = lessons.filter((l) => l.grammar.instructionNote);
if (withInstrNotes.length) {
  p("- **Notes next to grammar instructions.** These notes are written outside the instruction, so they are stored separately and are **not shown to children**:");
  for (const l of withInstrNotes) p(`  - ${label(l)}: "${l.grammar.instructionNote}"`);
}
const itemNotes = lessons.flatMap((l) => l.grammar.items.filter((g) => g.note).map((g) => [l, g] as const));
if (itemNotes.length) {
  p("- **Notes in brackets after grammar answers.** These are stored as a note on the item (for example to show after the child answers):");
  for (const [l, g] of itemNotes) p(`  - ${label(l)}: ${g.prompt} → "${g.note}"`);
}
p();

writeFileSync(join(root, "content/import-report.md"), out.join("\n"), "utf8");

console.log(
  `Converted ${lessons.length} lessons and ${calibrations.length} calibration passages. ` +
    `${flagged.length} item(s) need checking. See content/import-report.md.`,
);

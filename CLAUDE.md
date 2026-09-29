# CLAUDE.md – Leesavontuur

You are building **Leesavontuur** (working name), a web-based English/Afrikaans reading program for South African children. The owner, Verona, is not a developer. Explain choices in plain language, and ask before anything that costs money or needs a new account.

## Read first

1. `PROJECT-BRIEF.md` – the full specification. It is the single source of truth. If the owner changes a decision, update the brief as well as the code.
2. `prototype/leesavontuur-prototipe.html` – a working prototype of one lesson that the owner approved. Match its lesson flow, feel, fonts (regular weight, never bold reading text) and the special-letter buttons.
3. `content/lessons-source.md` – all 130 passages (see "Converting the content" below).

## Ground rules

- **Build one phase at a time**, following section 11 of the brief. Before each phase, give a short plan and wait for the owner's go-ahead. At the end of each phase, give simple steps for the owner to try it out.
- **Children only ever see content with status "published".** Enforce this in the database queries and access rules, not only in the user interface.
- **Never invent or rewrite lesson content yourself** during import. If something in the source is unclear or broken, list it for the owner instead of guessing.
- Afrikaans text must stay exactly as written, including ê, ë, ô, ï and 'n. Use UTF-8 everywhere.
- Collect as little personal information about children as possible (see POPIA in section 10 of the brief).
- Keep secrets (API keys, database keys) out of the code and out of the browser.
- Use git, with small, clearly described commits.

## Converting the content

`content/lessons-source.md` is a Markdown export of the owner's lessons document. Write an import script that converts it into the JSON format in section 9 of the brief, and produces `content/lessons.json`. Then write a validation report (`content/import-report.md`) for the owner.

**Sections to skip:** "Program overview" and "Level benchmarks".

**Lessons** start with a level-2 heading such as:

- `## Level 3 – Afrikaans: Karel se groentetuin` (the first lesson of a level), or
- `## Level 3 – Afrikaans 4: 'n Nag by die sterrewag` / `## Level 2 – English 7: The Big Match`.

The line below the heading usually starts with `Topic: <topic>.`. The first lesson of each level has no Topic line; use this table:

| Lesson | Topic |
| --- | --- |
| Level 1 Afrikaans: My hond Tokkie | animals |
| Level 1 English: Fun at the Beach | nature |
| Level 2 Afrikaans: Oupa se skilpad | animals |
| Level 2 English: Ben Bakes a Cake | food |
| Level 3 Afrikaans: Karel se groentetuin | nature |
| Level 3 English: Mia's Lemonade Stand | food |
| Level 4 Afrikaans: Die pikkewyne by Boulders | animals |
| Level 4 English: Maya and the Night Sky | space |
| Level 5 Afrikaans: Elke druppel tel | nature |
| Level 5 English: Why Sleep Matters | body |

Map topic names to these keys: Animals → `animals`, Nature and outdoors → `nature`, Sport and games → `sport`, Space and stars → `space`, Food and cooking → `food`, Adventure and make-believe → `adventure`, My body and health → `body`, How things work → `how-things-work`.

Inside each lesson (Afrikaans / English headings):

- **Word cards** – `### Woordkaarte (n)` / `### Word cards (n)`. Each card is one paragraph: `**word** – definition(s). Bv./e.g. example. forms. Engels:/Afrikaans: "translation". *Prent:/Picture: picture idea.*` Store the picture idea as `imageNote` (no images exist yet). The line `*Extra cards for more support:* word1, word2` lists extra support words that do **not** have full cards yet: store them in `extraWords` and list them in the report so the owner can add definitions later.
- **Passage** – `### Die leesstuk` / `### The passage`. Levels 1–3: one sentence per line (lines end with a hard line break), so `layout: "lines"`. Levels 4–5: paragraphs, so `layout: "paragraphs"`.
- **Comprehension** – `### Begrip (5 vrae, ✓ = reg)` / `### Comprehension (5 questions, ✓ = correct)`. A numbered list: the **bold** question, then options separated by ` / `. The correct option is bold and ends with ✓. A question starting with `(Dinkvraag)` or `(Thinking)` sets `thinking: true` (remove the label from the question text). **Watch out:** in a few early lessons the options are shortened, sharing a sentence start with the first option (for example `Karel woon saam met sy ma. / sy oupa. / **sy ouma. ✓**`, or `Want groente het baie **lig ✓** / skaduwee / wind / reën / sand nodig.`). **Do not expand them** (owner's decision): keep the options exactly as written, import the lesson as `"in_review"`, and list every shortened question in the report so the owner can rewrite the options.
- **Spelling** – `### Woordherkenning (10)` / `### Word recognition (10)`: a comma-separated list.
- **Grammar** – `### Grammatika: <focus> (5)` / `### Grammar: <focus> (5)`, then an italic instruction line, then a numbered list `prompt – **answer**`. Alternative answers appear as `*(accept: x, y)*`. Some items have two answers (for example `min – **minder** – **minste**`); store them as an item with two blanks. In the "words that sound the same" and "fact or opinion" exercises, the choices are in brackets or the answer is F/O/M.
- **Vocabulary** – `### Woordeskat (5)` / `### Vocabulary (5)`: a numbered list, `sentence with ______. option / **option ✓** / option / option`.

**Calibration passages** are in the sections `## Calibration – Level n`, each with `### Afrikaans 1: Title` … `### English 3: Title`. Each has the passage, `**Begrip (4 vrae, ✓ = reg)**` / `**Comprehension (4 questions, ✓ = correct)**` and `**Spelling (7):** words`. Store them with `type: "calibration"`.

**Validation report** – after converting, check and report:

- Expected totals: 100 lessons (10 per language per level, Levels 1–5) and 30 calibration passages (3 per language per level).
- Each lesson has 5 comprehension questions (calibration: 4), each with exactly one ✓; 10 spelling words (calibration: 7); 5 grammar items; 5 vocabulary items with exactly one ✓.
- Word counts compared with the level benchmarks in the brief's appendix.
- Anything that could not be parsed, and every question with shortened options.

Import all converted items with status `"published"`, except items flagged in the report, which should be imported as `"in_review"` for the owner to check.

## Adding passages later

New passages follow the writing guide in the brief's appendix. The admin area's "Draft passages" button must send that guide to the Claude API and save the results as drafts only.

## Developer notes

@AGENTS.md

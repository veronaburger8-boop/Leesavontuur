# Leesavontuur – Website Project Brief

## 1. Overview

Leesavontuur (working name) is a web-based reading program for South African children who read in **English and Afrikaans**. It is inspired by the concept of an older desktop program, rebuilt from scratch with **all-new, original content** and design. It must work in any browser on computers, tablets and phones, with nothing to install.

**Goals**

- Build reading speed, comprehension, word recognition (spelling), grammar and vocabulary through short daily lessons.
- Let each child work at **their own level in each language**, independently.
- Keep parents informed and in control, with clear progress reports.
- Let the owner review **every passage** before a child sees it, and grow the library over time.

**Content ready for launch (Phase 1)**

- 100 lessons: Levels 1–5, 10 per language, tagged with 8 interest topics.
- 30 calibration passages: 3 per level per language.
- All content is in `content/lessons-source.md` and must be converted into the data format in section 9 (see CLAUDE.md).
- The program is designed for 15 levels. Levels 6–15 will be added later through the admin area.

**User roles**

| Role | Who | What they do |
| --- | --- | --- |
| Learner | The child | Does calibration, lessons and games; chooses interest topics; sees own progress. |
| Parent | Account holder | Creates learner profiles, sets and changes levels, manages topics, requests new themes, views reports. |
| Admin (reviewer) | The owner | Manages the content library, reviews and publishes passages, handles theme requests. Built for one admin at first; must support adding reviewers later. |

## 2. The lesson

Every lesson belongs to one language, one level and one interest topic, and runs through 7 steps in this order. A working prototype of one full lesson is in `prototype/leesavontuur-prototipe.html` and shows the intended look and behaviour.

1. **Word cards.** The difficult words from the passage, one card at a time with next/previous arrows. Each card shows the word, 1–2 simple definitions, an example sentence, word forms (plural or verb forms), and the translation into the other language. Levels 1–2 also show a picture. Each lesson has a main set of cards plus extra "support" cards; show the extra cards when the learner's recent scores are low.
2. **Eye exercise.** The passage is flashed while the child just watches (no clicking). Three modes: whole lines, word groups of about 3 words, and a moving pacer that sweeps along each line. The display speed comes from the learner's reading speed (words per minute), which is first measured by the calibration test, because every child reads at a different speed. A learner with no measured speed yet skips the eye exercise in their first lesson; that lesson's timed reading sets the speed. Rotate modes between sessions; a parent can fix one mode.
3. **Timed reading.** The whole passage appears and a timer starts. The child reads at their own pace and presses "Finished". Words per minute = word count ÷ minutes. If the result is impossibly fast (above about 350 W/min), show "Did you really read every word?" with "Read again" or "Continue". The next session's eye exercise speed is set to about 5% above this result.
4. **Comprehension.** 5 multiple-choice questions, one per screen, with 5 options (Level 1 may later drop to 3). Two tries per question: only a correct first try scores. After the answer, mark the correct option green and the wrong ones red.
5. **Word recognition (spelling).** 10 words. A "Ready" button, then the word flashes (2 seconds at Levels 1–2, 1.5 seconds from Level 3; can adapt later), then the child types it. Two tries; the word flashes again before the second try. Only a first-try correct answer scores. An attempts box shows the child's tries.
6. **Grammar.** 5 typed answers with one grammar focus per lesson (for example plurals, diminutives, past tense, passive voice). Each question has a list of accepted answers. Ignore capital letters, extra spaces and a missing full stop, and treat straight and curly apostrophes as the same. Two tries.
7. **Vocabulary.** 5 fill-in-the-blank sentences, each with 4 near-miss options. Two tries; first try scores.

**Between steps** show an encouraging message with the child's name and score. The message changes by score band (100%, 80–99, 60–79, 40–59, below 40), with a small celebration at 100%. Messages are written in both languages.

**At the end** save a report row: date, lesson title, W/min, comprehension %, word recognition %, grammar %, vocabulary %.

**The memory exercise from the old program is deliberately left out.**

## 3. Calibration, levels and progress

**Two separate sequences.** English and Afrikaans are separate sequences. A learner has their own level, reading speed, lesson history and reports in each language (for example Afrikaans Level 5, English Level 3). Passages are never repeated across languages.

**Calibration (placement test)**

- The parent chooses which level to test, per language.
- The child picks 1 of 3 calibration stories at that level.
- Steps: timed reading, then 4 comprehension questions, then 7 spelling words. No word cards, eye exercise, grammar or vocabulary.
- The results suggest a starting level. If the scores are very high or very low, suggest testing one level up or down.
- Calibration can be repeated at any time. Calibration stories never appear as regular lessons.

**Levels**

- 15 levels are planned; Levels 1–5 have content at launch. Each level starts with 10 lessons per language, and more can be added.
- **The parent always decides.** When a learner's averages over recent lessons are consistently high or low, the site shows a suggestion (for example "Rone is averaging above 90% at Level 3. Move up to Level 4?"). The parent accepts or ignores it. Nothing moves automatically.
- The parent can change a level up or down at any time without losing past reports.

**"Ready for the next level?" prompt for the child**

- **When it appears:** after a lesson, if the learner's average over their **last 5 lessons** in that language is **90% or more in each of comprehension, word recognition, grammar and vocabulary**, and their reading speed is steady or rising. (Make these thresholds admin settings, so they can be adjusted later.)
- **What the child sees:** a celebration screen, for example "Wow, Rone! You're flying through Level 3. Do you want to try Level 4?", with the buttons **[Yes, let's go!]** and **[Not yet]**.
- **"Not yet"** is always fine. The prompt waits at least 3 more lessons before appearing again, so it never nags.
- **"Yes, let's go!"** sends a request to the parent (on-site notification and email): "Rone would like to try Level 4 in Afrikaans. Approve?" The child sees "Great! We've asked Mom or Dad. You'll hear back soon."
- **When the parent approves,** the child first does a **challenge lesson**, one lesson from the next level:
  - If they score well (for example 80% or more on average), they move up, and the parent is told "Rone moved up to Level 4 in Afrikaans". The parent can move them back at any time.
  - If it's too hard, they stay at their level with an encouraging message ("Almost! Let's practise a bit more first"), and the prompt can return after a few more strong lessons.
- **When the parent declines,** the child sees a kind message ("Let's keep practising at Level 3 for now"), and the prompt waits a few lessons before appearing again.
- **Parent setting per learner:** "Ask me first" (the **default**) or "Let my child move up after a challenge lesson" (no approval needed; the parent is still notified).
- This works alongside the parent's own level-change suggestions described above. Either way, no level ever changes without the parent's approval or chosen setting.

**Choosing the next lesson**

Within the learner's level and language, pick lessons in this order: unread lessons from the learner's favourite topics first, with an occasional lesson from another topic for variety (roughly 1 in 4). When all lessons at a level are done, suggest moving up, or let the child reread favourites.

## 4. Interest topics and topic requests

**Starter topics (8):** Animals · Nature and outdoors · Sport and games · Space and stars · Food and cooking · Adventure and make-believe · My body and health · How things work.

- When a learner is set up, they pick **2 to 4 favourite topics**. The learner or parent can change them later.
- Topics are data, not code: the admin can add new topics at any time.

**Topic requests from parents**

1. In the parent area, a parent types a request (for example "horses" or "rugby").
2. They see: "Thank you! New topics are usually ready within 1–2 days."
3. The request shows a status in the parent area: **Received → Being prepared → Ready**.
4. The request appears in the admin area, grouped with similar requests, with a count of how many parents asked.
5. The admin can decline unsuitable requests, with an optional short reply.
6. When passages for the topic are published, the parent gets a notification (on-site and by email) and the topic appears in their child's choices.

**Tip for speed:** when a request comes in, the admin can publish just 2–3 passages at the requesting child's level first, and add other levels later.

## 5. Parent area and reports

The parent area is protected by the parent's password (or a PIN), so a child using the same device can't change settings.

**Parent can:**

- Create and manage learner profiles (name, and optionally grade). One parent account can have **at most 2 children** (enforced by the database).
- Start or repeat calibration, and set or change each learner's level per language.
- Accept or ignore level-change suggestions.
- Set each learner's interest topics.
- Choose settings per learner: sound on/off, passage display style (for example a coloured border or background tint for easier reading), and a fixed eye-exercise mode.
- Request new topics and see their status.
- View reports.

**Reports** (per learner, per language, per level)

- A table like the original program: one row per lesson with date, lesson title, W/min, comprehension, word recognition, grammar and vocabulary, plus an **average row**. Calibration results are marked.
- A simple chart of reading speed over time.
- A summary line, for example "12 lessons this month, average comprehension 86%".
- Printable or downloadable as PDF.

**Learner home screen:** two progress paths side by side (for example "Afrikaans: Level 5" and "English: Level 3"), a big "Start today's lesson" button per language, and a Games area.

## 6. Admin review area

Only the admin can open this area. **The rule that everything depends on: children only ever see passages with the status "Published".**

**Content library**

- A searchable list of all lessons and calibration passages, filterable by language, level, topic and status.
- Every item has a status: **Draft → In review → Published** (and **Retired** for items taken out of use). A published item can be retired at any time and is then hidden from learners, while existing reports keep their history.
- A preview button shows the item exactly as a child would see it, step by step.

**Three ways to add content**

1. **Draft with AI.** The admin chooses the language, level(s), topic and number of passages, and presses "Draft passages". The site calls the Claude API with the writing guide (appendix) and returns complete lessons in the data format of section 9, saved as **Drafts**. Drafts never go live automatically.
2. **Manual form.** A form with fields for every part of a lesson (word cards, passage, questions with options and the correct answer, spelling words, grammar with accepted answers, vocabulary). Live checks warn about common problems, for example a passage that is much longer or shorter than its level's benchmark, a question without a correct answer, or fewer than 10 spelling words.
3. **Import.** Upload a file in the section 9 format, used for the initial 130 passages and for batches written elsewhere.

**Review and edit**

- An easy editor for every field, with the level benchmark shown next to the passage (word count, average sentence length).
- Buttons: "Publish", "Send back to draft" with a note, and "Retire".

**Requests inbox**

- Topic requests grouped by topic, with request counts, the requesting children's levels and languages, and each request's status.
- One click creates a draft batch for that topic at the relevant levels.

**Future-proofing:** support more than one reviewer later through roles (Admin, Reviewer), and record who published what and when.

## 7. Games

A "Games" area on the learner's home screen. Games are optional extras and don't count towards lesson scores, but time played can appear in the parent report.

**Hangman (Galgie)**

- Words come from the spelling and word-card lists of the learner's current level and language, so the game revises lesson words.
- On-screen letter buttons, including the Afrikaans special letters.
- Use a friendly picture that builds up instead of a gallows (for example a snowman melting or a flower losing petals).

**Eye-tracking games** (planned; can come in a later phase)

Short, playful exercises that train the eyes to move smoothly and quickly, for example:

- follow a moving object across the screen and tap it when it changes colour;
- find a target letter or word in a grid as fast as possible;
- read words that appear at different places on the screen.

Speed adapts to the learner. These could later become a separate product, but start as a section of the same site with the same login and reports.

## 8. Design, accessibility and language

**Fonts**

- Levels 1–2: **Andika** (Grade 1 style, with single-storey a and g), regular weight.
- Level 3 and up: **Atkinson Hyperlegible**, regular weight.
- Reading text is large (about 24–26 px on desktop) and never bold. The owner prefers the regular weight.

**Layout rules**

- Levels 1–3: one sentence per line. Levels 4 and up: paragraphs.
- Long passages split into pages with next/previous arrows, as in the original.
- Passage display options per learner (the original's "Colour (Border)" setting): plain, coloured border, or tinted background.

**Special letters:** every typing box has a row of large buttons for ê ë é è ô ö û ï î and 'n, inserted where the cursor is. Keyboard typing still works.

**Devices:** works on phones, tablets and computers. On tablets, every action that uses the Enter key also has a big button.

**Languages of the interface:** each sequence is fully in its own language. The Afrikaans sequence uses Afrikaans instructions and messages, and the English sequence uses English. The parent area can be switched between the two.

**Look and feel:** friendly and calm, not cluttered. The prototype's garden theme (sky, grass, stepping-stone progress path) is a starting point. The site needs its **own name, mascot and artwork**, and must not use the old program's branding, characters or content.

**Accessibility:** good colour contrast, visible focus outlines, screen-reader labels, support for reduced motion, and a light and dark mode.

## 9. Content data format

Every lesson and calibration passage is stored as data, not built into the code, so new content can be added without changing the site. Suggested shape for a **lesson** (shortened example):

```json
{
  "id": "af-l3-karel-se-groentetuin",
  "type": "lesson",
  "language": "af",
  "level": 3,
  "topic": "nature",
  "status": "published",
  "title": "Karel se groentetuin",
  "layout": "lines",
  "passage": ["Karel woon saam met sy ouma op 'n klein plasie buite die dorp.", "..."],
  "wordCards": [
    {"word": "spit", "definitions": ["Om die grond met 'n graaf om te draai en los te maak."],
     "example": "Pa spit die grond voor hy die blomme plant.",
     "forms": "Ek spit, ek het gespit", "translation": "to dig", "image": null, "extra": false}
  ],
  "comprehension": [
    {"question": "Saam met wie woon Karel?",
     "options": ["...sy ma.", "...sy oupa.", "...sy ouma.", "...sy tannie.", "...sy broer."],
     "answer": 2, "thinking": false}
  ],
  "spelling": ["onkruid", "kompos", "..."],
  "grammar": {
    "focus": "verkleinwoorde",
    "instruction": "Gee die verkleinwoord – Bv. hond – hondjie",
    "items": [{"prompt": "blaar", "accepted": ["blaartjie"]}]
  },
  "vocabulary": [
    {"sentence": "Oupa gebruik 'n ______ om die blomme water te gee.",
     "options": ["gieter", "gieters", "gitaar", "giet"], "answer": 0}
  ]
}
```

Notes:

- `layout` is `lines` (one sentence per line, Levels 1–3) or `paragraphs` (Levels 4 and up). For paragraphs, `passage` is a list of paragraphs.
- `answer` is the position of the correct option, counting from 0. The site should shuffle the order of options when showing them.
- `extra: true` marks a support word card, shown only when the learner needs more help.
- A **calibration passage** uses the same shape with `"type": "calibration"`, 4 comprehension questions, 7 spelling words, and no word cards, grammar or vocabulary.
- The word count is calculated automatically from the passage.

## 10. Technical recommendations, privacy and hosting

These are suggestions for the developer (Claude Code) to confirm or improve.

**Suggested set-up**

- A modern web app (for example Next.js) that works well on phones and tablets.
- A hosted database with built-in logins (for example Supabase), storing accounts, learners, progress, reports, content and requests.
- File storage for word-card pictures and artwork.
- Hosting on a service with good speeds in South Africa, plus a custom domain.
- The Claude API for the "Draft passages" button, called only from the server, so the API key is never visible in the browser.
- A transactional email service for parent notifications (topic ready, password reset).
- Automatic daily backups of the database.

**Privacy and children's data (POPIA)**

The site handles information about children, so South Africa's Protection of Personal Information Act (POPIA) applies. It generally requires a parent's or guardian's consent to process a child's information, and asks that you collect no more than you need. Suggested approach, to be checked by someone qualified in POPIA:

- Only parents create accounts. They accept the privacy policy and give consent when adding a child.
- Store as little about each child as possible: a first name or nickname, levels, scores and topic choices. No photos, surnames, school names or ID numbers.
- Parents can download or delete their child's data at any time.
- No advertising and no sharing of data with third parties.
- Topic requests are free text, so remind parents not to include personal information.

**Performance:** passages and lessons should load quickly on slow mobile connections. Reading timing must be accurate even on older devices.

## 11. Build phases and open questions

**Reference material**

- Prototype of one full lesson: `prototype/leesavontuur-prototipe.html`
- All content: `content/lessons-source.md`

**Suggested build order**

1. **Foundation.** Parent accounts and logins, learner profiles, the content data model, importing the 130 passages, and a basic admin content library with status and preview.
2. **The lesson.** The full 7-step lesson player, scoring, reading-speed adaptation, encouraging messages and saved report rows.
3. **Calibration and levels.** Calibration flow, level suggestions, and parent control of levels and settings.
4. **Reports and parent area.** Report tables, reading-speed chart, PDF download and the learner home screen.
5. **Topics and requests.** Interest topics, lesson selection by topic, the topic request flow, the admin requests inbox, notifications, and AI drafting plus the manual entry form.
6. **Games and polish.** Hangman, final artwork and branding, the "About reading" articles (see section 12), accessibility checks, and testing with real children on phones and tablets.
7. **Later.** Levels 6–15 content. (The eye-tracking games were built early, after Phase 6.)

Each phase should end with something the owner can try out.

**Decisions made**

- **Admin account and contact address:** leesavontuur194@gmail.com (also the contact address in the privacy policy; sign up on the site with this address, then make it admin as described in the README).
- **Audience:** mainly families. Schools and teachers are not planned for now. A teacher account could be added later without rebuilding.

- **Children per family:** at most 2 per parent account.
- **Unfinished lessons** start again from the beginning; only finished lessons are saved.
- **Word cards:** the word is shown in regular weight, like all reading text (not bold as in the prototype).
- **Starting reading speed** comes from the calibration test, not from a fixed number per level.
- **Recommended starting age:** Grade 1, Term 3, when children know all the sounds used at Level 1. Parents see this recommendation when they add a child and whenever a child is in Grade R or Grade 1. It is advice only; nothing is blocked.
- **Calibration rule:** the level fits with at least 3 of 4 questions and 5 of 7 spelling words right; test one level up with 4 of 4 and at least 6 of 7; test one level down with at most 1 of 4 or at most 3 of 7. Reading speed sets the starting speed, not the level.
- **Parent level suggestions:** move up when the average of the last 5 lessons is 90% or more; move down when it is below 50%.
- **Notifications:** on the site for now; emails once the site has its own domain and an email service.
- **Sound on/off** is left out until the site has audio.
- **Lesson order with topics:** the next lesson is the first unread lesson (in the lessons document's order) in one of the child's favourite topics; when none is left at the level, the first unread lesson of any topic. Children who have no favourites yet get the document's order.
- **Topic requests:** a parent can have at most 5 requests being prepared at a time. A request becomes Ready by itself (and the parent is told on the site) as soon as a lesson for its topic is published at the requesting child's language and level. Staff see the child's language and level, never the child's name.
- **Mascot:** Mika the meerkat (erdmannetjie), original artwork drawn for the site (header, home page, child screens, browser icon). The name "Leesavontuur" stays for now.
- **Galgie** uses a bunch of 7 balloons (one pops with each wrong letter), held by Mika. In the English sequence the game is called Hangman. Each finished word is saved as time played; the parent report shows minutes played this month. Games never count towards lesson scores.
- **"About reading" articles** are in Phase 6. Six starter articles (3 Afrikaans, 3 English) were drafted with Claude's help as Drafts; the owner rewrites and publishes them.
- **Eye-movement games** (built early, at the owner's request): ✨ Vang die vuurvliegie / Catch the firefly (smooth following), 🔍 Soek-en-vind / Find it (scanning; letters, then words from the child's lessons) and 🦘 Spring-woorde / Jumping words (quick jumps). No camera is used. Difficulty adapts per child and game (steps 1–20); time played appears in the parent report; games never count towards lesson scores. All games are reached from one games page.
- **AI drafting** uses the Claude API (Claude Opus 5.5) with the owner's own Anthropic account; the key is stored only in Vercel as `ANTHROPIC_API_KEY`. Each run writes up to 5 lessons, saves each one as a Draft as soon as it is written, and shows the estimated cost. Until the key is added, the button says "Not set up yet".

**Open questions for the owner**

- Final **name, mascot and look** of the site.
- **Pricing:** free, subscription per family, or a free trial? This decides whether online payments are needed at launch.
- **Pictures** for the Level 1–2 word cards: illustrated, photos, or generated? Who supplies them?
- Would **audio** help (for example hearing a word card read aloud), now or later?
- Who will check the privacy policy and POPIA compliance?
- **Domain name** and email address for the site.

## 12. "About reading" articles

A public section of the site (also for visitors who have not signed up) with short articles about reading, for example how children learn to read, why reading speed and comprehension matter, and tips for parents.

- Articles are data, managed in the admin area like lessons: Draft → Published, in Afrikaans and English.
- The owner writes or approves every article. Claude may help draft, but nothing is published without the owner's review.
- Planned for Phase 6, or earlier if the owner wants it at launch.

## 13. Future product: Klanke Avontuur

A separate website for younger children (Grade R and Grade 1, before Term 3) that teaches the sounds needed for Leesavontuur Level 1. To be built after Leesavontuur.

## Appendix: writing guide for new passages

The "Draft passages" button sends this guide to Claude, and it is also the checklist for writing passages by hand.

**Level benchmarks**

| Level | Words | Avg. sentence | Layout | Text type | Word cards | Thinking questions |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | ~70 | ~6 words | 1 sentence per line | Simple present-tense descriptions | 4 + pictures | 0 |
| 2 | ~110 | ~8–9 words | 1 sentence per line | Simple story, some dialogue | 5 + pictures | 0 |
| 3 | ~165 | 12–13 words | 1 sentence per line | Story with some facts | 6 + 2 extra | 1 |
| 4 | ~250 | 13–15 words | 5 short paragraphs | Story with facts woven in | 6 + 2 extra | 1 |
| 5 | ~340 | 15–18 words | 5 paragraphs | Informative, persuasive or balanced argument | 6 + 2 extra | 2 |

**Every lesson contains**

- **Word cards:** word, 1–2 simple definitions, an example sentence, word forms, and the translation into the other language.
- **Passage** at the level benchmark.
- **5 comprehension questions**, each with 5 options. Answers must come from the text, not from general knowledge. Wrong options should be believable, and the correct answer's position should vary.
- **10 spelling words:** the word-card words plus other words from the passage.
- **5 grammar items** with one focus, and a list of accepted answers for each.
- **5 vocabulary sentences:** a new sentence (not from the passage) with a blank, and 4 near-miss options (for example gieter / gieters / gitaar / giet). Exactly one option must fit.

**Calibration passages:** the same length as the level, with 4 questions answerable only from the text and 7 spelling words. They must not repeat any lesson topic.

**Grammar progression (examples)**

- Afrikaans: meervoude, teenoorgesteldes, verkleinwoorde (Levels 1–3); trappe van vergelyking, verlede tyd, samestellings (Levels 3–4); indirekte rede, lydende vorm, voegwoorde (omdat, want), feit of mening (Levels 4–5).
- English: plurals, opposites, a/an, adding -ing (Levels 1–2); past tense, -er/-est, -ly, contractions, compound words (Levels 2–3); prefixes and suffixes, possessive apostrophes, homophones (Level 4); passive voice, reported speech, conjunctions, fact or opinion (Level 5).

**Style rules**

- 100% original writing. Never copy passages, characters, song lyrics or branded characters from books, films or other programs.
- Use a South African setting and names from all communities (Karel, Sipho, Lerato, Anri, Thabo, Aisha, and so on), with places, animals, food and weather children recognise.
- Check every fact. When unsure, leave it out or phrase it carefully ("scientists believe…").
- Handle sensitive topics (illness, death, danger) gently and briefly, and always model safe behaviour (for example asking a parent's permission, or telling an adult).
- No passage repeats a topic already used at the same level and language.
- English and Afrikaans passages are written separately, never as translations of each other.

# Leesavontuur – handover package

This folder contains everything Claude Code needs to build the website.

| File | What it is |
| --- | --- |
| `CLAUDE.md` | Instructions that Claude Code reads automatically. |
| `PROJECT-BRIEF.md` | The full website brief, including the writing guide for new passages. |
| `prototype/leesavontuur-prototipe.html` | The lesson prototype. Double-click it to open it in your browser. |
| `content/` | Where the lessons file goes (see step 1). |

## Steps for Verona

1. **Add the lessons file.** Open the doc "Leesavontuur – Lessons, Levels 1–5" in Claude. Click the document's name at the top, choose **Export**, and pick **Markdown**. Rename the downloaded file to `lessons-source.md` and put it in the `content` folder.
2. **Open this folder in Claude Code.** In the Claude desktop app, open the Code tab and choose this folder.
3. **Send your first message:**

   > Read CLAUDE.md and PROJECT-BRIEF.md. Then propose a plan for Phase 1 (Foundation) and list the accounts I'll need to set up, before you write any code.

4. **Build one phase at a time.** Try out each phase before saying "go" to the next one.
5. **Check the import report.** After the lessons are imported, Claude Code will write `content/import-report.md`, listing anything it wasn't sure about. Check those items first.

If you change your mind about how something should work, ask Claude Code to update `PROJECT-BRIEF.md` as well as the site.

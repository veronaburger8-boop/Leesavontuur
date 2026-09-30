// The simple text format of articles: paragraphs separated by an empty line,
// "## " starts a heading, "- " starts a list item, **bold** and *italic*.
// Parsed into plain data (never raw HTML), so article text can't inject code.

export type Inline = { text: string; bold?: boolean; italic?: boolean };
export type Block = { kind: "heading"; text: Inline[] } | { kind: "list"; items: Inline[][] } | { kind: "paragraph"; text: Inline[] };

export function parseInline(s: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let last = 0;
  for (let m = re.exec(s); m; m = re.exec(s)) {
    if (m.index > last) out.push({ text: s.slice(last, m.index) });
    out.push(m[1] !== undefined ? { text: m[1], bold: true } : { text: m[2], italic: true });
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push({ text: s.slice(last) });
  return out;
}

export function parseArticle(body: string): Block[] {
  return body
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((b): Block => {
      if (b.startsWith("## ")) return { kind: "heading", text: parseInline(b.slice(3).trim()) };
      const lines = b.split("\n").map((l) => l.trim());
      if (lines.every((l) => l.startsWith("- "))) return { kind: "list", items: lines.map((l) => parseInline(l.slice(2))) };
      return { kind: "paragraph", text: parseInline(lines.join(" ")) };
    });
}

/** A web address part from a title, e.g. "Tien wenke vir ouers" → "tien-wenke-vir-ouers". */
export function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/'n\b/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Rough reading time for grown-ups (about 200 words a minute). */
export const readingMinutes = (body: string) => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 200));

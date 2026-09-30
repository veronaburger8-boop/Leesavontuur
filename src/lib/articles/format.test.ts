import { expect, it } from "vitest";
import { parseArticle, parseInline, slugify } from "./format";

it("reads headings, lists, paragraphs and bold or italic text", () => {
  const blocks = parseArticle("Eerste *reël*\ntweede reël.\n\n## Opskrif\n\n- **Lees** elke dag\n- Gesels");
  expect(blocks).toEqual([
    { kind: "paragraph", text: [{ text: "Eerste " }, { text: "reël", italic: true }, { text: " tweede reël." }] },
    { kind: "heading", text: [{ text: "Opskrif" }] },
    { kind: "list", items: [[{ text: "Lees", bold: true }, { text: " elke dag" }], [{ text: "Gesels" }]] },
  ]);
});

it("keeps anything that looks like HTML as plain text", () => {
  expect(parseInline("<script>alert(1)</script>")).toEqual([{ text: "<script>alert(1)</script>" }]);
});

it("makes web-address names from titles", () => {
  expect(slugify("Tien wenke vir ouers")).toBe("tien-wenke-vir-ouers");
  expect(slugify("Leesspoed en begrip: waarom albei saak maak")).toBe("leesspoed-en-begrip-waarom-albei-saak-maak");
  expect(slugify("Wat is 'n goeie boek?")).toBe("wat-is-n-goeie-boek");
});

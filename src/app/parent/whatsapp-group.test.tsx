import { writeFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({ saveWhatsapp: vi.fn() }));
const { WhatsappCard, WhatsappSettings } = await import("./whatsapp-group");
const { translator } = await import("@/lib/i18n");

const t = translator("af");
const link = "https://chat.whatsapp.com/AbCdEf123456GhIjK";
const joined = { phone: "+27821234567", wants_group: true, card_closed: false };
const card = (contact: Parameters<typeof WhatsappCard>[0]["state"]["contact"], l = link) => renderToStaticMarkup(<WhatsappCard state={{ link: l, contact }} t={t} />);

describe("WhatsApp support group", () => {
  it("shows nothing until the owner has saved the group's link", () => {
    expect(card(null, "")).toBe("");
    expect(renderToStaticMarkup(<WhatsappSettings state={{ link: "", contact: joined }} t={t} />)).toBe("");
  });

  it("asks a new parent, then shows the join button until it is closed", () => {
    expect(card(null)).toContain("Ja, ek wil graag by die groep aansluit");
    expect(card(null)).not.toContain(link);
    expect(card(joined)).toContain(`href="${link}"`);
    expect(card({ ...joined, card_closed: true })).toBe("");
    expect(card({ phone: null, wants_group: false, card_closed: true })).toBe("");
  });

  it("shows the saved number the South African way on My account", () => {
    const html = renderToStaticMarkup(<WhatsappSettings state={{ link, contact: joined }} t={t} />);
    expect(html).toContain('value="082 123 4567"');
    expect(html).toContain("Sluit aan op WhatsApp");
    // For looking at it in a browser: WA_HTML=/path/file.html npx vitest run whatsapp
    if (process.env.WA_HTML)
      writeFileSync(
        process.env.WA_HTML,
        `<main style="max-width:760px;margin:0 auto"><section class="panel"><h1>Hallo, Verona!</h1>${card(null)}</section><section class="panel">${card(joined)}</section>${html}</main>`,
      );
  });
});

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Landing } from "./landing";

const html = (locale: "af" | "en", launched: boolean) => renderToString(<Landing locale={locale} sample={null} launched={launched} />);

describe("welcome page wording", () => {
  it("talks about the pilot while charging is off", () => {
    const af = html("af", false);
    expect(af).toContain("Gratis tydens die loodsprojek");
    expect(af).toContain("Sluit aan by die loodsprojek");
    expect(af).not.toContain("Eerste les gratis");
  });

  it("invites everyone with the first lesson free once charging is on", () => {
    const af = html("af", true);
    expect(af).toContain("Eerste les gratis");
    expect(af).toContain("Begin gratis");
    expect(af).toContain("Elke kind se eerste les is gratis");
    expect(af).toContain("Hoe werk betaling?");
    expect(af).not.toContain("loodsprojek");
    const en = html("en", true);
    expect(en).toContain("First lesson free");
    expect(en).toContain("Start free");
    expect(en).toContain("How does payment work?");
    expect(en).not.toContain("pilot");
  });

  it("tells search engines about the site and its questions", () => {
    const af = html("af", true);
    expect(af).toContain('type="application/ld+json"');
    expect(af).toContain('"@type":"FAQPage"');
    expect(af).toContain("Hoe werk betaling?");
  });
});

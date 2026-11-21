// Writes Mika's three poses as SVG files for the marketing pictures.
import { writeFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { Meerkat } from "../../src/components/art/meerkat";

for (const pose of [undefined, "wave", "cheer"] as const) {
  const svg = renderToStaticMarkup(Meerkat({ size: 300, pose })).replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  writeFileSync(`marketing/build/mika-${pose ?? "book"}.svg`, svg);
}

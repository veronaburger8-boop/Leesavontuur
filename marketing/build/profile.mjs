// WhatsApp profile pictures in Leesavontuur's colours (no meerkat). Square,
// with everything important inside the middle circle, since WhatsApp crops round.
// Run from the project folder: node marketing/build/profile.mjs
import { createRequire } from "node:module";
import { writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
const { chromium } = createRequire(import.meta.url)("playwright");

const root = resolve(".");
const font = `@font-face { font-family: Baloo; font-weight: 800; src: url(file://${root}/node_modules/@fontsource/baloo-2/files/baloo-2-latin-800-normal.woff2); }`;

// An open book seen from the front; its pages are the two green hills.
const book = (y, fill = "#ffffff", edge = "#2e6b3f") => `
  <path d="M152 ${y} Q330 ${y - 70} 512 ${y + 10} L512 ${y + 250} Q330 ${y + 170} 152 ${y + 240} Z" fill="${fill}" stroke="${edge}" stroke-width="18" stroke-linejoin="round"/>
  <path d="M872 ${y} Q694 ${y - 70} 512 ${y + 10} L512 ${y + 250} Q694 ${y + 170} 872 ${y + 240} Z" fill="${fill}" stroke="${edge}" stroke-width="18" stroke-linejoin="round"/>`;

const designs = {
  // 1. A hot-air balloon (like the Galgie balloons) rising out of an open book.
  "1-ballon": `
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fcdf0"/><stop offset="1" stop-color="#e3f3fb"/></linearGradient>
  <clipPath id="bal"><path d="M512 170 C640 170 712 262 712 362 C712 462 600 540 560 600 L464 600 C424 540 312 462 312 362 C312 262 384 170 512 170 Z"/></clipPath></defs>
  <rect width="1024" height="1024" fill="url(#sky)"/>
  <circle cx="790" cy="250" r="92" fill="#f4be3a"/>
  <rect x="150" y="300" width="150" height="46" rx="23" fill="#ffffff" opacity=".9"/>
  <rect x="720" y="470" width="120" height="38" rx="19" fill="#ffffff" opacity=".9"/>
  <g transform="translate(0 -40)">
  <g clip-path="url(#bal)">
    <rect x="300" y="160" width="430" height="450" fill="#c8412f"/>
    <rect x="410" y="160" width="68" height="450" fill="#f4be3a"/><rect x="546" y="160" width="68" height="450" fill="#f4be3a"/>
    <rect x="300" y="160" width="40" height="450" fill="#f4be3a"/><rect x="684" y="160" width="40" height="450" fill="#f4be3a"/>
  </g>
  <path d="M512 170 C640 170 712 262 712 362 C712 462 600 540 560 600 L464 600 C424 540 312 462 312 362 C312 262 384 170 512 170 Z" fill="none" stroke="#7b4f2c" stroke-width="12"/>
  <path d="M468 600 L478 650 M556 600 L546 650" stroke="#7b4f2c" stroke-width="10" stroke-linecap="round"/>
  <rect x="466" y="645" width="92" height="62" rx="12" fill="#9c6b3c" stroke="#7b4f2c" stroke-width="10"/>
  </g>
  ${book(680)}
  <path d="M200 730 Q330 700 470 740 M200 780 Q330 750 470 790 M554 740 Q694 700 824 730 M554 790 Q694 750 824 780" stroke="#8fb49a" stroke-width="12" stroke-linecap="round" fill="none"/>`,

  // 2. A winding path that starts in an open book and leads over green hills to the sun.
  "2-pad": `
  <defs><linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f9d77a"/><stop offset=".55" stop-color="#fdeecb"/><stop offset="1" stop-color="#d6ecf8"/></linearGradient></defs>
  <rect width="1024" height="1024" fill="url(#sky2)"/>
  <circle cx="512" cy="330" r="130" fill="#f4be3a"/>
  <g stroke="#f4be3a" stroke-width="16" stroke-linecap="round">
    <path d="M512 150 V110 M640 200 L668 172 M384 200 L356 172 M690 330 H730 M334 330 H294"/>
  </g>
  <path d="M0 520 Q260 400 520 500 T1024 470 V1024 H0 Z" fill="#76c68b"/>
  <path d="M0 600 Q300 500 600 590 T1024 560 V1024 H0 Z" fill="#4c9a5b"/>
  <path d="M512 690 C470 640 610 660 560 610 C520 570 470 560 500 515" fill="none" stroke="#fff3cf" stroke-width="44" stroke-linecap="round"/>
  ${book(640, "#ffffff", "#2e6b3f")}
  <path d="M220 700 Q340 675 460 705 M220 750 Q340 725 460 755 M564 705 Q684 675 804 700 M564 755 Q684 725 804 750" stroke="#8fb49a" stroke-width="12" stroke-linecap="round" fill="none"/>`,

  // 3. A bold "L" on leaf green, with the sun as a dot and a little open book.
  "3-letter": `
  <rect width="1024" height="1024" fill="#2e6b3f"/>
  <circle cx="512" cy="512" r="420" fill="#357a49"/>
  <text x="470" y="620" text-anchor="middle" font-family="Baloo" font-weight="800" font-size="600" fill="#ffffff">L</text>
  <circle cx="660" cy="270" r="78" fill="#f4be3a"/>
  <g transform="translate(195 690) scale(.62)">${book(0, "#fff3cf", "#f4be3a")}</g>`,
};

const browser = await browser_();
async function browser_() { return chromium.launch(); }
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 } });
const html = resolve("marketing/build/tmp.html");
for (const [name, svg] of Object.entries(designs)) {
  writeFileSync(html, `<!doctype html><meta charset="utf-8"><style>${font} body{margin:0}</style><svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${svg}</svg>`);
  await page.goto(`file://${html}`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `marketing/profile/whatsapp-${name}.png` });
}
await browser.close();
rmSync(html, { force: true });
console.log("done");

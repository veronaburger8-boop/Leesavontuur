// Renders the post pictures and the Facebook cover into marketing/posts/.
// Run from the project folder: node marketing/build/render.mjs
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { posts } from "./posts.mjs";

const root = resolve(".");
const out = resolve("marketing/posts");
mkdirSync(out, { recursive: true });
const f = (p) => `file://${root}/node_modules/@fontsource/${p}`;
const mika = (pose) => readFileSync(`marketing/build/mika-${pose}.svg`, "utf8");
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const css = `
@font-face { font-family: Baloo; font-weight: 800; src: url(${f("baloo-2/files/baloo-2-latin-800-normal.woff2")}); }
@font-face { font-family: Baloo; font-weight: 600; src: url(${f("baloo-2/files/baloo-2-latin-600-normal.woff2")}); }
@font-face { font-family: Atkinson; font-weight: 400; src: url(${f("atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2")}); }
@font-face { font-family: Atkinson; font-weight: 700; src: url(${f("atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2")}); }
* { box-sizing: border-box; margin: 0; }
body { width: 1080px; height: 1350px; overflow: hidden; font-family: Atkinson; color: #1d2b36;
  background: linear-gradient(#bfe2f5, #e8f5fc 70%); position: relative; }
.sun { position: absolute; top: -90px; right: -90px; width: 300px; height: 300px; border-radius: 50%; background: #f4be3a; opacity: .9; }
.cloud { position: absolute; background: #fff; border-radius: 60px; height: 70px; opacity: .9; }
.grass { position: absolute; left: 0; right: 0; bottom: 0; height: 180px; background: #4c9a5b;
  border-radius: 50% 50% 0 0 / 40px 40px 0 0; }
.wrap { position: absolute; inset: 70px 70px 0 70px; display: flex; flex-direction: column; z-index: 1; }
.brand { font-family: Baloo; font-weight: 800; font-size: 44px; color: #2e6b3f; display: flex; align-items: center; gap: 14px; }
.brand img { width: 64px; height: 64px; border-radius: 16px; }
.badge { align-self: flex-start; margin-top: 36px; background: #fff3cf; border: 4px solid #f4be3a; border-radius: 40px;
  padding: 6px 26px; font-family: Baloo; font-weight: 600; font-size: 36px; }
h1 { font-family: Baloo; font-weight: 800; font-size: 92px; line-height: 1.02; margin-top: 22px; color: #1d2b36; letter-spacing: -1px; }
.text { font-size: 48px; line-height: 1.35; margin-top: 24px; max-width: 900px; }
.shot { margin-top: 36px; background: #fff; border-radius: 26px; padding: 50px 14px 14px; position: relative;
  box-shadow: 0 18px 40px rgba(29,43,54,.18); }
.shot::before { content: ""; position: absolute; top: 18px; left: 22px; width: 14px; height: 14px; border-radius: 50%;
  background: #c8412f; box-shadow: 24px 0 #f4be3a, 48px 0 #4c9a5b; }
.shot img { display: block; width: 100%; border-radius: 14px; max-height: 480px; object-fit: cover; object-position: top; }
.note { position: absolute; right: 24px; top: 12px; font-size: 24px; color: #56687a; }
.mika { position: absolute; right: 40px; bottom: 60px; z-index: 2; }
.bubble { position: absolute; right: 290px; bottom: 420px; background: #fff; border-radius: 30px; padding: 14px 28px;
  font-family: Baloo; font-weight: 600; font-size: 38px; z-index: 2; box-shadow: 0 8px 20px rgba(0,0,0,.08); }
.offer { margin-top: 36px; align-self: flex-start; background: #2e6b3f; color: #fff; border-radius: 26px; padding: 22px 34px;
  font-size: 40px; line-height: 1.3; }
.offer b { font-family: Baloo; font-weight: 800; font-size: 52px; display: block; }
.steps { list-style: none; padding: 0; margin-top: 40px; display: grid; gap: 26px; max-width: 700px; }
.steps li { display: grid; grid-template-columns: 90px 1fr; gap: 24px; align-items: center; background: #fff; border-radius: 26px; padding: 22px; }
.steps .n { width: 90px; height: 90px; border-radius: 50%; background: #2e6b3f; color: #fff; display: grid; place-items: center;
  font-family: Baloo; font-weight: 800; font-size: 56px; }
.steps b { font-family: Baloo; font-weight: 800; font-size: 46px; display: block; line-height: 1.1; }
.steps span { font-size: 36px; }
.read-more { margin-top: 44px; align-self: flex-start; background: #2e6b3f; color: #fff; border-radius: 26px; padding: 20px 34px;
  font-family: Baloo; font-weight: 800; font-size: 48px; }
.list { list-style: none; padding: 0; margin-top: 48px; display: grid; gap: 26px; max-width: 800px; }
.list li { background: #fff; border-radius: 22px; padding: 20px 26px 20px 90px; font-size: 46px; position: relative; }
.list li::before { content: "✓"; position: absolute; left: 26px; top: 16px; font-family: Baloo; font-weight: 800; font-size: 50px; color: #2e6b3f; }
.stats { display: grid; grid-template-columns: repeat(2, 300px); gap: 22px; margin-top: 44px; }
.stats div { background: #fff; border-radius: 26px; padding: 18px 26px; font-size: 38px; }
.stats b { font-family: Baloo; font-weight: 800; font-size: 88px; color: #2e6b3f; display: block; line-height: 1; }
.url { position: absolute; left: 70px; bottom: 44px; color: #fff; font-family: Baloo; font-weight: 800; font-size: 46px; z-index: 3; }
.cta { position: absolute; left: 70px; bottom: 100px; color: #fff; font-size: 32px; z-index: 3; }
`;

function page(p) {
  const pose = p.mika;
  const mikaSize = p.shot ? 0 : p.mika === "wave" ? 330 : 280;
  return `<!doctype html><html lang="af"><head><meta charset="utf-8"><style>${css}</style></head><body>
<div class="sun"></div><div class="cloud" style="top:60px;left:560px;width:200px"></div>
<div class="wrap">
  <div class="brand"><img src="file://${root}/public/icons/icon-192.png">Leesavontuur</div>
  <div class="badge">${esc(p.badge)}</div>
  <h1 style="${p.steps || p.list || p.stats ? "font-size:84px" : ""}${p.shot ? ";font-size:76px" : ""}">${esc(p.title)}</h1>
  ${p.text ? `<p class="text" style="${pose && !p.shot ? "max-width:640px" : ""}">${esc(p.text)}</p>` : ""}
  ${p.steps ? `<ol class="steps">${p.steps.map(([b, s], i) => `<li><div class="n">${i + 1}</div><div><b>${esc(b)}</b><span>${esc(s)}</span></div></li>`).join("")}</ol>` : ""}
  ${p.list ? `<ul class="list">${p.list.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
  ${p.stats ? `<div class="stats">${p.stats.map(([n, l]) => `<div><b>${n}</b>${l}</div>`).join("")}</div>` : ""}
  ${p.shot ? `<div class="shot">${p.note ? `<span class="note">${esc(p.note)}</span>` : ""}<img src="file://${root}/public/landing/${p.shot}"></div>` : ""}
  ${p.tip ? `<div class="read-more">📖 Lees die artikel</div>` : ""}
  ${p.offer ? `<div class="offer"><b>Eerste les gratis</b>Daarna R99 per gesin per maand</div>` : ""}
</div>
${pose && mikaSize ? `<div class="mika" style="width:${mikaSize}px">${mika(pose).replace(/width="300" height="400"/, `width="${mikaSize}" height="${(mikaSize * 4) / 3}"`)}</div>` : ""}
<div class="grass"></div>
<div class="cta">${p.tip ? "Lees meer by" : "Probeer die eerste les gratis by"}</div>
<div class="url">www.leesavontuur.co.za</div>
</body></html>`;
}

const cover = `<!doctype html><html lang="af"><head><meta charset="utf-8"><style>${css}
body { width: 1640px; height: 624px; }
.grass { height: 110px; }
.wrap { inset: 70px 0 0 120px; }
h1 { font-size: 86px; margin-top: 10px; }
.text { font-size: 40px; max-width: 860px; }
.mika { right: 330px; bottom: 40px; }
.url { left: auto; right: 80px; bottom: 30px; }
</style></head><body>
<div class="sun"></div><div class="cloud" style="top:110px;left:1200px;width:220px"></div>
<div class="wrap"><div class="brand"><img src="file://${root}/public/icons/icon-192.png">Leesavontuur</div>
<h1>Lees elke dag 'n bietjie</h1><p class="text">Leesprogram in Afrikaans en Engels vir Suid-Afrikaanse kinders</p></div>
<div class="mika">${mika("wave").replace(/width="300" height="400"/, 'width="270" height="360"')}</div>
<div class="grass"></div><div class="url">www.leesavontuur.co.za</div></body></html>`;

// Pages are opened as files so the fonts and pictures (also files) load.
const tmp = resolve("marketing/build/tmp.html");
async function show(pg, html) {
  writeFileSync(tmp, html);
  await pg.goto(`file://${tmp}`, { waitUntil: "load" });
}

const browser = await chromium.launch();
for (const p of posts) {
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await show(pg, page(p));
  await pg.evaluate(() => document.fonts.ready);
  await pg.screenshot({ path: `${out}/${p.id}.png` });
  await pg.close();
}
const pg = await browser.newPage({ viewport: { width: 1640, height: 624 } });
await show(pg, cover);
await pg.evaluate(() => document.fonts.ready);
await pg.screenshot({ path: `${out}/facebook-cover.png` });
await browser.close();
console.log("done");


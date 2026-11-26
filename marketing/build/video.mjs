// Makes short vertical videos (1080 × 1920, no sound: add music in the app
// when posting) from real screenshots of the program and the post style.
// Run from the project folder: node marketing/build/video.mjs
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";
const { chromium } = createRequire(import.meta.url)("playwright");

const root = resolve(".");
const out = resolve("marketing/videos");
const tmp = resolve("marketing/build/frames");
mkdirSync(out, { recursive: true });
mkdirSync(tmp, { recursive: true });
const f = (p) => `file://${root}/node_modules/@fontsource/${p}`;
const mika = (pose, w) => readFileSync(`marketing/build/mika-${pose}.svg`, "utf8").replace(/width="300" height="400"/, `width="${w}" height="${(w * 4) / 3}"`);
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

const css = `
@font-face { font-family: Baloo; font-weight: 800; src: url(${f("baloo-2/files/baloo-2-latin-800-normal.woff2")}); }
@font-face { font-family: Atkinson; font-weight: 400; src: url(${f("atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2")}); }
* { box-sizing: border-box; margin: 0; }
body { width: 1080px; height: 1920px; overflow: hidden; font-family: Atkinson; color: #1d2b36;
  background: linear-gradient(#bfe2f5, #e8f5fc 70%); position: relative; }
.sun { position: absolute; top: -110px; right: -110px; width: 360px; height: 360px; border-radius: 50%; background: #f4be3a; }
.grass { position: absolute; left: 0; right: 0; bottom: 0; height: 220px; background: #4c9a5b; border-radius: 50% 50% 0 0 / 50px 50px 0 0; }
.brand { position: absolute; top: 90px; left: 80px; font-family: Baloo; font-weight: 800; font-size: 52px; color: #2e6b3f; display: flex; align-items: center; gap: 16px; }
.brand img { width: 76px; height: 76px; border-radius: 18px; }
.mid { position: absolute; left: 80px; right: 80px; top: 300px; bottom: 260px; display: flex; flex-direction: column; justify-content: center; gap: 56px; }
h1 { font-family: Baloo; font-weight: 800; font-size: 118px; line-height: 1.02; letter-spacing: -1px; }
.sub { font-size: 56px; line-height: 1.3; }
.shot { background: #fff; border-radius: 34px; padding: 62px 18px 18px; position: relative; box-shadow: 0 24px 60px rgba(29,43,54,.2); }
.shot::before { content: ""; position: absolute; top: 24px; left: 30px; width: 18px; height: 18px; border-radius: 50%; background: #c8412f; box-shadow: 30px 0 #f4be3a, 60px 0 #4c9a5b; }
.shot img { display: block; width: 100%; border-radius: 18px; }
.list { display: grid; gap: 30px; }
.list div { background: #fff; border-radius: 28px; padding: 26px 34px; font-size: 60px; }
.list b { font-family: Baloo; color: #2e6b3f; margin-right: 16px; }
.big { font-family: Baloo; font-weight: 800; font-size: 200px; color: #2e6b3f; line-height: 1; }
.mika { position: absolute; right: 70px; bottom: 120px; z-index: 2; }
.url { position: absolute; left: 0; right: 0; bottom: 80px; text-align: center; color: #fff; font-family: Baloo; font-weight: 800; font-size: 58px; z-index: 3; }
.note { font-size: 34px; color: #56687a; text-align: right; }
`;
const shot = (name, note) => `<div class="shot"><img src="file://${root}/public/landing/${name}.webp">${note ? `<p class="note" style="margin-top:14px">${esc(note)}</p>` : ""}</div>`;
const slide = (inner, { mikaPose, mikaW = 300, url = true } = {}) => `<!doctype html><html lang="af"><head><meta charset="utf-8"><style>${css}</style></head><body>
<div class="sun"></div><div class="brand"><img src="file://${root}/public/icons/icon-192.png">Leesavontuur</div>
<div class="mid">${inner}</div>${mikaPose ? `<div class="mika">${mika(mikaPose, mikaW)}</div>` : ""}<div class="grass"></div>
${url ? `<div class="url">www.leesavontuur.co.za</div>` : ""}</body></html>`;

const videos = {
  "wat-is-leesavontuur": [
    [slide(`<h1>Sukkel jou kind met lees?</h1>`, { mikaPose: "book", mikaW: 380 }), 2.6],
    [slide(`<h1 style="font-size:96px">Leesavontuur: lees in Afrikaans en Engels</h1>${shot("child-home-af")}`), 3.2],
    [slide(`<h1 style="font-size:96px">Elke les 'n nuwe leesstuk</h1>${shot("reading-af")}<p class="sub">Met begripsvrae en spelling</p>`), 3.4],
    [slide(`<h1 style="font-size:96px">Speletjies wat die oë oefen</h1>${shot("galgie-af")}`), 3.0],
    [slide(`<h1 style="font-size:96px">Sien hoe jou kind groei</h1>${shot("chart-af", "Voorbeeld van 'n verslag")}`), 3.0],
    ["end", 3.4],
  ],
  "spaar-op-leesboeke": [
    [slide(`<h1>Leesboeke is duur 💸</h1><p class="sub">En kinders lees hulle gou klaar.</p>`, { mikaPose: "book", mikaW: 340 }), 3.0],
    [slide(`<div class="big">100</div><h1 style="font-size:96px">leesstukke ingesluit</h1>${shot("reading-af")}`), 3.4],
    [slide(`<h1 style="font-size:96px">Elke leesstuk met:</h1><div class="list"><div><b>✓</b>Begripsvrae</div><div><b>✓</b>Spelling</div><div><b>✓</b>Grammatika</div><div><b>✓</b>Woordeskat</div></div>`), 3.4],
    [slide(`<h1 style="font-size:104px">In Afrikaans én Engels, op jou kind se eie vlak</h1>`, { mikaPose: "book", mikaW: 340 }), 3.0],
    [slide(`<div class="big" style="font-size:180px">R99</div><h1 style="font-size:90px">per gesin per maand</h1><p class="sub">Vir tot twee kinders. Kanselleer enige tyd.</p>`, { mikaPose: "cheer", mikaW: 340 }), 3.0],
    ["end", 3.4],
  ],
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
const html = resolve("marketing/build/tmp.html");
for (const [name, slides] of Object.entries(videos)) {
  const inputs = [];
  for (const [i, [content, secs]] of slides.entries()) {
    const png = content === "end" ? resolve("marketing/posts/video-eindkaart.png") : `${tmp}/${name}-${i}.png`;
    if (content !== "end") {
      writeFileSync(html, content);
      await page.goto(`file://${html}`, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: png });
    }
    inputs.push([png, secs]);
  }
  // Each picture slowly zooms in a little; pictures cross-fade into each other.
  const fps = 30, fade = 0.4;
  const args = ["-y"];
  inputs.forEach(([png, secs]) => args.push("-loop", "1", "-framerate", String(fps), "-t", String(secs), "-i", png));
  const parts = inputs.map(([, secs], i) => {
    const n = Math.round(secs * fps);
    return `[${i}:v]scale=2160:-1,zoompan=z='1+0.04*on/${n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920:fps=${fps},settb=AVTB,setpts=N/${fps}/TB,setsar=1,format=yuv420p[v${i}]`;
  });
  let last = "v0", offset = inputs[0][1] - fade;
  for (let i = 1; i < inputs.length; i++) {
    const label = i === inputs.length - 1 ? "out" : `x${i}`;
    parts.push(`[${last}][v${i}]xfade=transition=fade:duration=${fade}:offset=${offset.toFixed(2)}[${label}]`);
    last = label;
    offset += inputs[i][1] - fade;
  }
  args.push("-filter_complex", parts.join(";"), "-map", "[out]", "-r", String(fps), "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart", `${out}/${name}.mp4`);
  execFileSync("ffmpeg", args, { stdio: "ignore" });
  console.log("made", name);
}
await browser.close();
rmSync(html, { force: true });

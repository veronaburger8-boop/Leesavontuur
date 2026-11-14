import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { isValidElement, type ReactElement, type ReactNode } from "react";
import { Meerkat } from "@/components/art/meerkat";

// The picture shown when the site's link is shared (WhatsApp, Facebook, …).
export const alt = "Leesavontuur: Mika die meerkat met 'n oop boek. Leesprogram in Afrikaans en Engels vir kinders.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Mika's drawing as plain SVG text (the image renderer can't take grouped React elements inside an <svg>). */
function svgText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (Array.isArray(node)) return node.map(svgText).join("");
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (!isValidElement(node)) return "";
  const el = node as ReactElement<Record<string, unknown>>;
  const { children, ...props } = el.props;
  if (typeof el.type !== "string") return svgText(children as ReactNode);
  const attrs = Object.entries(props)
    .filter(([k, v]) => v !== undefined && k !== "className" && !k.startsWith("aria") && k !== "role")
    .map(([k, v]) => `${k === "viewBox" ? k : k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}="${String(v)}"`)
    .join(" ");
  const tag = el.type;
  return `<${tag}${tag === "svg" ? ' xmlns="http://www.w3.org/2000/svg"' : ""}${attrs ? " " + attrs : ""}>${svgText(children as ReactNode)}</${tag}>`;
}

const mika = `data:image/svg+xml;base64,${Buffer.from(svgText(Meerkat({ size: 250 }))).toString("base64")}`;

const font = (file: string) => readFile(join(process.cwd(), "node_modules/@fontsource", file));

export default async function Image() {
  const [baloo, atkinson] = await Promise.all([font("baloo-2/files/baloo-2-latin-800-normal.woff"), font("atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff")]);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "linear-gradient(180deg, #a9daf5 0%, #d6ecf8 75%, #4c9a5b 75%, #4c9a5b 100%)",
          padding: "0 80px",
          gap: 50,
        }}
      >
        <div style={{ display: "flex", background: "#ffffff", borderRadius: 40, padding: 30 }}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <img src={mika} width={250} height={333} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 680 }}>
          <div style={{ fontFamily: "Baloo", fontSize: 96, color: "#2e6b3f", lineHeight: 1 }}>Leesavontuur</div>
          <div style={{ fontFamily: "Atkinson", fontSize: 40, color: "#1d2b36", marginTop: 20, lineHeight: 1.25 }}>
            Lees elke dag &apos;n bietjie, en kyk hoe jou kind groei.
          </div>
          <div style={{ fontFamily: "Atkinson", fontSize: 30, color: "#2e6b3f", marginTop: 22 }}>Afrikaans &amp; English · leesavontuur.co.za</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Baloo", data: baloo, style: "normal", weight: 800 },
        { name: "Atkinson", data: atkinson, style: "normal", weight: 700 },
      ],
    },
  );
}

import type { MetadataRoute } from "next";

/** Makes the site installable as an app (phone home screen, tablet, computer), with Mika as the icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Leesavontuur",
    short_name: "Leesavontuur",
    description: "Leesprogram in Afrikaans en Engels vir kinders. A reading program in Afrikaans and English for children.",
    lang: "af",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#d6ecf8",
    theme_color: "#2e6b3f",
    categories: ["education", "kids", "books"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The installable-app helper (public/sw.js) must always be fresh, and may only run this site's own code.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
  experimental: {
    // The admin import uploads the full lessons file (about 0.8 MB) and pictures (up to 4 MB).
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;

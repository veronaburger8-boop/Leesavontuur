import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // The admin import uploads the full lessons file (about 0.8 MB).
    serverActions: { bodySizeLimit: "5mb" },
  },
};

export default nextConfig;

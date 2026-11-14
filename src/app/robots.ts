import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.leesavontuur.co.za").replace(/\/$/, "");

/** Search engines may read the public pages; the parent, child and admin areas are private. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/parent", "/learn", "/admin", "/unlock", "/api/", "/auth/"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

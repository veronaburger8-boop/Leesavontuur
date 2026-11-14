import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.leesavontuur.co.za").replace(/\/$/, "");

// Rebuilt at most once an hour, so newly published articles appear.
export const revalidate = 3600;

/** The public pages for search engines, with every published article (never drafts). */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/articles`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/signup`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
  try {
    const { data } = await createAdminClient().from("articles").select("slug, updated_at").eq("status", "published");
    for (const a of data ?? []) pages.push({ url: `${SITE_URL}/articles/${a.slug}`, lastModified: new Date(a.updated_at), changeFrequency: "monthly", priority: 0.7 });
  } catch {
    // Without the database the fixed pages are still listed.
  }
  return pages;
}

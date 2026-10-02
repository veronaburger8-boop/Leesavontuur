import { headers } from "next/headers";

/** Version of the privacy policy that parents accept when they sign up. Change it when the policy changes. */
export const PRIVACY_VERSION = "2026-10-draft";

/** The site's address, for links in emails. */
export async function siteUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

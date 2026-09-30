import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CHILD_COOKIE } from "@/lib/child-mode";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n";

export type Role = "parent" | "reviewer" | "admin";

export interface Profile {
  id: string;
  display_name: string | null;
  role: Role;
  locale: Locale;
  privacy_accepted_at: string | null;
  privacy_version: string | null;
}

/** The signed-in user and their profile, or null. Checked with the auth server on every request. */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  if (!profile) return null;
  return { supabase, user, profile };
});

export const isStaff = (profile: Profile) => profile.role === "admin" || profile.role === "reviewer";

/** For pages that need a signed-in account. */
export async function requireAccount(next: string) {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  return session;
}

/** True while this device is in child mode (parent area locked). */
export async function inChildMode() {
  return (await cookies()).get(CHILD_COOKIE)?.value === "1";
}

/**
 * For parent actions (settings, levels, deleting): a signed-in account and
 * child mode unlocked. The pages are already locked by the proxy; this also
 * covers actions sent from elsewhere.
 */
export async function requireParent(next = "/parent") {
  const session = await requireAccount(next);
  if (await inChildMode()) redirect(`/unlock?next=${encodeURIComponent(next)}`);
  return session;
}

/** For the admin area: only admins and reviewers get in; parents are sent to the parent area. */
export async function requireStaff() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (!isStaff(session.profile)) redirect("/parent");
  if (await inChildMode()) redirect("/unlock?next=/admin");
  return session;
}

/** Only allow redirects to pages on this site. */
export function safeNext(next: FormDataEntryValue | string | null | undefined, fallback = "/parent"): string {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession, safeNext } from "@/lib/auth";
import { CHILD_COOKIE } from "@/lib/child-mode";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n";

/** Switches the interface language and remembers it for the account. */
export async function setLocale(formData: FormData) {
  const locale: Locale = formData.get("locale") === "en" ? "en" : "af";
  (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const session = await getSession();
  if (session) await session.supabase.from("profiles").update({ locale }).eq("id", session.user.id);
  redirect(safeNext(formData.get("back"), "/"));
}

export async function logOut() {
  const session = await getSession();
  if (session) await session.supabase.auth.signOut();
  (await cookies()).delete(CHILD_COOKIE);
  redirect("/");
}

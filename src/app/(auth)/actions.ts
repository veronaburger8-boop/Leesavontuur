"use server";

import { redirect } from "next/navigation";
import { getLocale } from "@/lib/i18n";
import { PRIVACY_VERSION, siteUrl } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth";

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

export async function logIn(formData: FormData) {
  const next = safeNext(formData.get("next"));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: str(formData.get("email")),
    password: String(formData.get("password") ?? ""),
  });
  if (error) redirect(`/login?error=login&next=${encodeURIComponent(next)}`);
  redirect(next);
}

export async function signUp(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (formData.get("privacy") !== "yes") redirect("/signup?error=privacy");
  if (password.length < 8) redirect("/signup?error=password");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: str(formData.get("email")),
    password,
    options: {
      emailRedirectTo: `${await siteUrl()}/auth/confirm?next=/parent`,
      data: {
        display_name: str(formData.get("name")).slice(0, 80),
        locale: await getLocale(),
        privacy_version: PRIVACY_VERSION,
      },
    },
  });
  if (error) {
    // Supabase limits how often emails can be sent; show a friendly "wait a moment" instead of its English text.
    if (error.status === 429 || /rate limit|security purposes/i.test(error.message)) redirect("/signup?error=wait");
    redirect(`/signup?error=signup&detail=${encodeURIComponent(error.message)}`);
  }
  // When email confirmation is switched off the parent is signed in straight away.
  if (data.session) redirect("/parent");
  redirect("/signup?sent=1");
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(str(formData.get("email")), {
    redirectTo: `${await siteUrl()}/auth/confirm?next=/reset-password`,
  });
  // Always show the same message, so the form doesn't reveal who has an account.
  redirect("/forgot-password?sent=1");
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) redirect("/reset-password?error=password");
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/reset-password?error=failed");
  redirect("/reset-password?saved=1");
}

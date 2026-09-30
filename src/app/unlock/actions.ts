"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAccount, safeNext } from "@/lib/auth";
import { CHILD_COOKIE } from "@/lib/child-mode";

async function leaveChildMode(next: string) {
  (await cookies()).delete(CHILD_COOKIE);
  redirect(safeNext(next));
}

export async function unlockWithPin(formData: FormData) {
  const next = String(formData.get("next") ?? "/parent");
  const { supabase } = await requireAccount("/unlock");
  const { data } = await supabase.rpc("check_parent_pin", { p_pin: String(formData.get("pin") ?? "") });
  if (data === "ok") await leaveChildMode(next);
  redirect(`/unlock?next=${encodeURIComponent(next)}&error=${data === "locked" ? "locked" : "pin"}`);
}

/** Without a PIN, the parent's password opens the parent area. */
export async function unlockWithPassword(formData: FormData) {
  const next = String(formData.get("next") ?? "/parent");
  const { supabase, user } = await requireAccount("/unlock");
  const { error } = await supabase.auth.signInWithPassword({ email: user.email ?? "", password: String(formData.get("password") ?? "") });
  if (!error) await leaveChildMode(next);
  redirect(`/unlock?next=${encodeURIComponent(next)}&error=password`);
}

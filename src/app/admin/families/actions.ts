"use server";

import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/** Families and charging are for the admin only (not reviewers). */
async function requireAdmin() {
  const session = await requireStaff();
  if (session.profile.role !== "admin") redirect("/admin/families?error=admin");
  return session;
}

/** Switches charging on or off for everyone (off = the pilot: everything free). */
export async function setBilling(formData: FormData) {
  const { supabase } = await requireAdmin();
  const on = formData.get("on") === "1";
  if (on && formData.get("confirm") !== "yes") redirect("/admin/families?error=confirm");
  const { error } = await supabase.from("app_settings").update({ value: on ? 1 : 0, updated_at: new Date().toISOString() }).eq("key", "billing_on");
  redirect(error ? "/admin/families?error=1" : "/admin/families?saved=1");
}

/** Marks a family as a pilot family (free access while charging is on), or takes it off. */
export async function setPilot(formData: FormData) {
  await requireAdmin();
  const parentId = String(formData.get("parent") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(parentId)) redirect("/admin/families?error=1");
  const pilot = formData.get("pilot") === "1";
  const { error } = await createAdminClient()
    .from("subscriptions")
    .upsert({ parent_id: parentId, pilot, updated_at: new Date().toISOString() }, { onConflict: "parent_id" });
  redirect(error ? "/admin/families?error=1" : "/admin/families?saved=1");
}

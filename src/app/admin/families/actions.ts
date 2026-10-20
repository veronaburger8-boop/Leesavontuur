"use server";

import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { eftReference, extendPaidUntil } from "@/lib/paid-until";
import { PRICE_RAND } from "@/lib/payfast";
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

const parentFrom = (formData: FormData) => {
  const id = String(formData.get("parent") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(id)) redirect("/admin/families?error=1");
  return id;
};

/** Shows or hides the card payment option (PayFast) for parents. */
export async function setCardPayments(formData: FormData) {
  const { supabase } = await requireAdmin();
  const on = formData.get("on") === "1";
  const { error } = await supabase.from("app_settings").update({ value: on ? 1 : 0, updated_at: new Date().toISOString() }).eq("key", "card_payments");
  redirect(error ? "/admin/families?error=1" : "/admin/families?saved=1");
}

/** Saves the banking details parents see for paying by EFT. */
export async function saveEftDetails(formData: FormData) {
  const { supabase } = await requireAdmin();
  const field = (name: string, max: number) => String(formData.get(name) ?? "").trim().slice(0, max);
  const { error } = await supabase
    .from("eft_details")
    .update({
      bank: field("bank", 80),
      account_name: field("account_name", 80),
      account_number: field("account_number", 30),
      branch_code: field("branch_code", 20),
      account_type: field("account_type", 30),
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);
  redirect(error ? "/admin/families?error=1" : "/admin/families?saved=1#eft");
}

/** An EFT payment of R99 arrived: the family is paid for one more month. */
export async function markEftPaid(formData: FormData) {
  await requireAdmin();
  const parentId = parentFrom(formData);
  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("paid_until, started_at, status").eq("parent_id", parentId).maybeSingle();
  const now = new Date();
  const until = extendPaidUntil(sub?.paid_until ?? null, now);
  const { error } = await admin.from("subscriptions").upsert(
    {
      parent_id: parentId,
      status: "active",
      paid_until: until.toISOString(),
      started_at: sub?.started_at ?? now.toISOString(),
      cancelled_at: null,
      updated_at: now.toISOString(),
    },
    { onConflict: "parent_id" },
  );
  if (!error) await admin.from("payment_events").insert({ parent_id: parentId, reference: eftReference(parentId), payment_status: "EFT", amount_cents: PRICE_RAND * 100 });
  redirect(error ? "/admin/families?error=1" : "/admin/families?saved=1");
}

/** Corrects a family's "paid until" date by hand (for mistakes); an empty date ends the paid time. */
export async function setPaidUntil(formData: FormData) {
  await requireAdmin();
  const parentId = parentFrom(formData);
  const raw = String(formData.get("until") ?? "");
  if (raw && !/^\d{4}-\d{2}-\d{2}$/.test(raw)) redirect("/admin/families?error=1");
  // The end of that day in South Africa.
  const until = raw ? new Date(`${raw}T23:59:59+02:00`) : null;
  const { error } = await createAdminClient()
    .from("subscriptions")
    .upsert(
      { parent_id: parentId, paid_until: until?.toISOString() ?? null, status: until && until > new Date() ? "active" : "none", updated_at: new Date().toISOString() },
      { onConflict: "parent_id" },
    );
  redirect(error ? "/admin/families?error=1" : "/admin/families?saved=1");
}

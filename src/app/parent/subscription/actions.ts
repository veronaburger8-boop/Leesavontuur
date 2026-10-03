"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { requireParent } from "@/lib/auth";
import { cancelAtPayFast, payfastConfig } from "@/lib/payfast";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Starts a subscription: notes a new reference for this family, then shows
 * the page that sends the parent to PayFast. Only the server writes
 * subscriptions (parents can't give themselves access).
 */
export async function beginCheckout() {
  const { user } = await requireParent("/parent/subscription");
  const admin = createAdminClient();
  const { data: current } = await admin.from("subscriptions").select("status, paid_until, reference").eq("parent_id", user.id).maybeSingle();
  if (current?.status === "active" && current.paid_until && new Date(current.paid_until) > new Date()) redirect("/parent/subscription");
  // The same family keeps its reference, so a payment for an earlier attempt still finds them.
  const reference = current?.reference ?? `LA-${randomUUID()}`;
  const { error } = await admin
    .from("subscriptions")
    .upsert({ parent_id: user.id, status: current?.status === "active" ? "active" : "pending", reference, updated_at: new Date().toISOString() }, { onConflict: "parent_id" });
  if (error) redirect("/parent/subscription?error=1");
  redirect(`/parent/subscription/checkout?ref=${encodeURIComponent(reference)}`);
}

/** Cancels at PayFast (no more debits); access lasts until the end of the paid month. */
export async function cancelSubscription(formData: FormData) {
  const { user } = await requireParent("/parent/subscription");
  if (formData.get("confirm") !== "yes") redirect("/parent/subscription");
  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("payfast_token, status").eq("parent_id", user.id).maybeSingle();
  if (!sub) redirect("/parent/subscription");
  if (sub.payfast_token && !(await cancelAtPayFast(sub.payfast_token, payfastConfig()))) redirect("/parent/subscription?error=cancel");
  await admin.from("subscriptions").update({ status: "cancelled", cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("parent_id", user.id);
  redirect("/parent/subscription?cancelled=1");
}

"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { requireParent } from "@/lib/auth";
import { stopCardPayments } from "@/lib/card-provider";
import { ensureCustomer, ensurePlan, paystackConfig, startCheckout } from "@/lib/paystack";
import { siteUrl } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Starts a card subscription: through Paystack when it is set up, otherwise
 * PayFast. Only the server writes subscriptions (parents can't give
 * themselves access).
 */
export async function beginCheckout() {
  const { user } = await requireParent("/parent/subscription");
  const admin = createAdminClient();
  const { data: current } = await admin.from("subscriptions").select("status, paid_until, reference, provider").eq("parent_id", user.id).maybeSingle();
  const paidUp = current?.paid_until && new Date(current.paid_until) > new Date();
  if (current?.status === "active" && current.provider && paidUp) redirect("/parent/subscription");

  const paystack = paystackConfig();
  if (paystack) {
    let url: string;
    try {
      const [plan, customer] = await Promise.all([ensurePlan(paystack), ensureCustomer(paystack, user.email ?? "")]);
      const { error } = await admin
        .from("subscriptions")
        .upsert(
          { parent_id: user.id, status: current?.status === "active" ? "active" : "pending", paystack_customer: customer, updated_at: new Date().toISOString() },
          { onConflict: "parent_id" },
        );
      if (error) throw error;
      url = await startCheckout(paystack, {
        email: user.email ?? "",
        plan,
        // Paystack needs a new reference for every payment attempt.
        reference: `LA-${randomUUID()}`,
        callbackUrl: `${await siteUrl()}/parent/subscription?paid=1`,
        parentId: user.id,
      });
    } catch {
      redirect("/parent/subscription?error=1");
    }
    redirect(url);
  }

  // The same family keeps its reference, so a payment for an earlier attempt still finds them.
  const reference = current?.reference ?? `LA-${randomUUID()}`;
  const { error } = await admin
    .from("subscriptions")
    .upsert({ parent_id: user.id, status: current?.status === "active" ? "active" : "pending", reference, updated_at: new Date().toISOString() }, { onConflict: "parent_id" });
  if (error) redirect("/parent/subscription?error=1");
  redirect(`/parent/subscription/checkout?ref=${encodeURIComponent(reference)}`);
}

/** Cancels the card subscription (no more charges); access lasts until the end of the paid month. */
export async function cancelSubscription(formData: FormData) {
  const { user } = await requireParent("/parent/subscription");
  if (formData.get("confirm") !== "yes") redirect("/parent/subscription");
  if (!(await stopCardPayments(user.id))) redirect("/parent/subscription?error=cancel");
  await createAdminClient()
    .from("subscriptions")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("parent_id", user.id);
  redirect("/parent/subscription?cancelled=1");
}

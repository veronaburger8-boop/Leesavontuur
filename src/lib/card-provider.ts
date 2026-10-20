import "server-only";
import { cancelAtPayFast, payfastConfig } from "@/lib/payfast";
import { disableSubscription, paystackConfig } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/admin";

/** Which company takes card payments: Paystack when its key is set in Vercel, otherwise PayFast. */
export function cardProvider(): { name: "Paystack" | "PayFast"; live: boolean } {
  const paystack = paystackConfig();
  if (paystack) return { name: "Paystack", live: paystack.live };
  return { name: "PayFast", live: payfastConfig().live };
}

/** Stops the card at the payment company first; true when that worked (or there was nothing to stop). */
export async function stopCardPayments(parentId: string): Promise<boolean> {
  const { data: sub } = await createAdminClient()
    .from("subscriptions")
    .select("provider, status, payfast_token, paystack_subscription, paystack_email_token")
    .eq("parent_id", parentId)
    .maybeSingle();
  if (!sub || sub.status === "cancelled") return true;
  if (sub.provider === "paystack") {
    const paystack = paystackConfig();
    if (!sub.paystack_subscription || !sub.paystack_email_token || !paystack) return !sub.paystack_subscription;
    return disableSubscription(paystack, sub.paystack_subscription, sub.paystack_email_token);
  }
  if (sub.payfast_token) return cancelAtPayFast(sub.payfast_token, payfastConfig());
  return true;
}


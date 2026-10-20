import { extendPaidUntil } from "@/lib/paid-until";
import { type PaystackEvent, paystackConfig, PRICE_CENTS, webhookSignatureValid } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * Paystack's notifications: a successful charge (the first payment and every
 * month after), the subscription being set up, a failed charge, or the
 * subscription stopping. Only trusted when the signature matches the secret key.
 */
export async function POST(request: Request) {
  const cfg = paystackConfig();
  if (!cfg) return new Response("Not set up", { status: 404 });
  const raw = await request.text();
  if (!webhookSignatureValid(raw, request.headers.get("x-paystack-signature"), cfg.secretKey)) return new Response("Bad signature", { status: 400 });

  let event: PaystackEvent;
  try {
    event = JSON.parse(raw) as PaystackEvent;
  } catch {
    return new Response("Bad body", { status: 400 });
  }
  const d = event.data ?? {};
  const admin = createAdminClient();

  // Which family: our own id on the first payment, otherwise Paystack's customer code.
  const meta = typeof d.metadata === "object" && d.metadata ? d.metadata : null;
  const customer = d.customer?.customer_code?.slice(0, 100) ?? null;
  let parentId: string | null = null;
  if (meta?.parent_id && UUID.test(meta.parent_id)) {
    const { data: p } = await admin.from("profiles").select("id").eq("id", meta.parent_id).maybeSingle();
    parentId = p?.id ?? null;
  }
  if (!parentId && customer) {
    const { data: s } = await admin.from("subscriptions").select("parent_id").eq("paystack_customer", customer).maybeSingle();
    parentId = s?.parent_id ?? null;
  }
  if (!parentId) return new Response("Unknown family", { status: 200 });

  const { data: sub } = await admin.from("subscriptions").select("paid_until, started_at, paystack_subscription").eq("parent_id", parentId).maybeSingle();
  // A message about an older subscription (after cancelling and subscribing again) must not touch the current one.
  const code = d.subscription_code ?? d.subscription?.subscription_code ?? null;
  const aboutOldSubscription = Boolean(code && sub?.paystack_subscription && code !== sub.paystack_subscription);
  const now = new Date();
  const update: Record<string, unknown> = { parent_id: parentId, provider: "paystack", updated_at: now.toISOString() };
  if (customer) update.paystack_customer = customer;
  const log = (status: string, amount: number | null) =>
    admin.from("payment_events").insert({ parent_id: parentId, reference: (d.reference ?? "").slice(0, 100) || null, payment_status: status, amount_cents: amount });

  switch (event.event) {
    case "charge.success": {
      await log("PAYSTACK SUCCESS", d.amount ?? null);
      // Only the full R99 in rand counts.
      if (d.status !== "success" || d.amount !== PRICE_CENTS || d.currency !== "ZAR") return new Response("OK", { status: 200 });
      Object.assign(update, {
        status: "active",
        paid_until: extendPaidUntil(sub?.paid_until ?? null, now).toISOString(),
        started_at: sub?.started_at ?? now.toISOString(),
        cancelled_at: null,
      });
      break;
    }
    case "subscription.create": {
      if (d.subscription_code) update.paystack_subscription = d.subscription_code.slice(0, 100);
      if (d.email_token) update.paystack_email_token = d.email_token.slice(0, 100);
      break;
    }
    case "invoice.payment_failed":
    case "invoice.failed": {
      await log("PAYSTACK FAILED", d.amount ?? null);
      if (aboutOldSubscription) return new Response("OK", { status: 200 });
      update.status = "failed";
      break;
    }
    case "subscription.not_renew":
    case "subscription.disable": {
      if (aboutOldSubscription) return new Response("OK", { status: 200 });
      // No more charges; the family keeps access until the end of the paid month.
      Object.assign(update, { status: "cancelled", cancelled_at: now.toISOString() });
      break;
    }
    default:
      return new Response("OK", { status: 200 });
  }
  await admin.from("subscriptions").upsert(update, { onConflict: "parent_id" });
  return new Response("OK", { status: 200 });
}

import { cents, confirmWithPayFast, notificationSignatureValid, parseNotification, payfastConfig, PRICE_RAND } from "@/lib/payfast";
import { createAdminClient } from "@/lib/supabase/admin";

/** A paid month lasts this long: a month plus a few days' grace for the next debit to arrive. */
const GRACE_DAYS = 3;

/**
 * PayFast's notifications (ITN) about a subscription: the first payment, each
 * monthly payment, a failed payment, or a cancellation. A notification is
 * only trusted when its signature matches AND PayFast confirms it sent it.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const fields = parseNotification(body);
  const data = Object.fromEntries(fields);
  const cfg = payfastConfig();

  if (!notificationSignatureValid(fields, cfg.passphrase) || data.merchant_id !== cfg.merchantId) return new Response("Bad signature", { status: 400 });
  if (!(await confirmWithPayFast(fields, cfg))) return new Response("Not confirmed", { status: 400 });

  const admin = createAdminClient();
  const reference = (data.m_payment_id ?? "").slice(0, 100);
  const token = (data.token ?? "").slice(0, 100);
  const find = (column: "reference" | "payfast_token", value: string) =>
    admin.from("subscriptions").select("parent_id, started_at, paid_until").eq(column, value).maybeSingle();
  let sub = reference ? (await find("reference", reference)).data : null;
  if (!sub && token) sub = (await find("payfast_token", token)).data;
  if (!sub) return new Response("Unknown subscription", { status: 200 });

  const status = (data.payment_status ?? "").toUpperCase().slice(0, 30);
  const amount = cents(data.amount_gross);
  await admin.from("payment_events").insert({
    parent_id: sub.parent_id,
    reference,
    pf_payment_id: (data.pf_payment_id ?? "").slice(0, 50) || null,
    payment_status: status || "UNKNOWN",
    amount_cents: amount,
  });

  const now = new Date();
  const update: Record<string, unknown> = { updated_at: now.toISOString() };
  if (token) update.payfast_token = token;
  if (status === "COMPLETE") {
    // Only the full R99 counts.
    if (amount !== PRICE_RAND * 100) return new Response("Wrong amount", { status: 200 });
    // A new month starts from today, or from the end of time already paid for
    // (so subscribing again after cancelling loses no days); grace is added once.
    const paidEnd = sub.paid_until ? new Date(new Date(sub.paid_until).getTime() - GRACE_DAYS * 86_400_000) : now;
    const until = new Date(Math.max(now.getTime(), paidEnd.getTime()));
    until.setMonth(until.getMonth() + 1);
    until.setDate(until.getDate() + GRACE_DAYS);
    Object.assign(update, { status: "active", paid_until: until.toISOString(), started_at: sub.started_at ?? now.toISOString(), cancelled_at: null });
  } else if (status === "CANCELLED") {
    Object.assign(update, { status: "cancelled", cancelled_at: now.toISOString() });
  } else if (status === "FAILED") {
    update.status = "failed";
  }
  await admin.from("subscriptions").update(update).eq("parent_id", sub.parent_id);
  return new Response("OK", { status: 200 });
}

// Paystack (paystack.com): the monthly R99 card subscription. Paystack shows
// the payment page and keeps the card details; it then charges the card every
// month by itself and tells the site through signed notifications (webhooks).
//
// Setting (Vercel → Environment Variables, Sensitive): PAYSTACK_SECRET_KEY,
// "sk_test_…" for practice payments or "sk_live_…" for real ones. When it is
// set, card payments go through Paystack instead of PayFast.

import { createHmac, timingSafeEqual } from "node:crypto";

export const PLAN_NAME = "Leesavontuur maandeliks / monthly";
export const PRICE_CENTS = 9900;

export interface PaystackConfig {
  secretKey: string;
  live: boolean;
  apiUrl: string;
}

export function paystackConfig(env: Record<string, string | undefined> = process.env): PaystackConfig | null {
  const secretKey = env.PAYSTACK_SECRET_KEY?.trim();
  if (!secretKey) return null;
  return { secretKey, live: secretKey.startsWith("sk_live_"), apiUrl: (env.PAYSTACK_API_URL || "https://api.paystack.co").replace(/\/$/, "") };
}

/** True when Paystack's notification really comes from Paystack: an HMAC-SHA512 of the raw body with the secret key. */
export function webhookSignatureValid(rawBody: string, signature: string | null, secretKey: string): boolean {
  if (!signature) return false;
  const expected = createHmac("sha512", secretKey).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature.trim().toLowerCase(), "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

class PaystackError extends Error {}

async function call<T>(cfg: PaystackConfig, method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${cfg.apiUrl}${path}`, {
    method,
    headers: { authorization: `Bearer ${cfg.secretKey}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const json = (await res.json().catch(() => null)) as { status?: boolean; message?: string; data?: T } | null;
  if (!res.ok || !json?.status) throw new PaystackError(json?.message || `Paystack answered ${res.status}`);
  return json.data as T;
}

/** The monthly R99 plan: found by its name, or made the first time. */
export async function ensurePlan(cfg: PaystackConfig): Promise<string> {
  const plans = await call<{ plan_code: string; name: string; amount: number; interval: string; currency: string }[]>(cfg, "GET", "/plan?perPage=100");
  const found = plans.find((p) => p.name === PLAN_NAME && p.amount === PRICE_CENTS && p.interval === "monthly" && p.currency === "ZAR");
  if (found) return found.plan_code;
  const made = await call<{ plan_code: string }>(cfg, "POST", "/plan", { name: PLAN_NAME, interval: "monthly", amount: PRICE_CENTS, currency: "ZAR" });
  return made.plan_code;
}

/** Paystack's customer for this email address (made the first time). */
export async function ensureCustomer(cfg: PaystackConfig, email: string): Promise<string> {
  const customer = await call<{ customer_code: string }>(cfg, "POST", "/customer", { email });
  return customer.customer_code;
}

/** Starts the subscription: Paystack's payment page, where the parent enters their card once. */
export async function startCheckout(
  cfg: PaystackConfig,
  input: { email: string; plan: string; reference: string; callbackUrl: string; parentId: string },
): Promise<string> {
  const data = await call<{ authorization_url: string }>(cfg, "POST", "/transaction/initialize", {
    email: input.email,
    amount: PRICE_CENTS,
    currency: "ZAR",
    plan: input.plan,
    reference: input.reference,
    callback_url: input.callbackUrl,
    metadata: { parent_id: input.parentId },
  });
  return data.authorization_url;
}

/** Stops the monthly charges. Returns true when Paystack accepted it. */
export async function disableSubscription(cfg: PaystackConfig, code: string, token: string): Promise<boolean> {
  try {
    await call(cfg, "POST", "/subscription/disable", { code, token });
    return true;
  } catch {
    return false;
  }
}

/** The parts of a Paystack notification the site uses. */
export interface PaystackEvent {
  event: string;
  data: {
    reference?: string;
    amount?: number;
    currency?: string;
    status?: string;
    metadata?: { parent_id?: string } | string | null;
    customer?: { customer_code?: string };
    subscription_code?: string;
    email_token?: string;
    subscription?: { subscription_code?: string };
  };
}

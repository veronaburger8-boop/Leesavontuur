// PayFast (payfast.io): the monthly R99 subscription. PayFast shows the
// payment page and keeps the card details; our site only learns the outcome
// through PayFast's notifications (ITN). See the README, "Payments".
//
// Settings (Vercel → Environment Variables, all Secret):
//   PAYFAST_MODE         "sandbox" (default, practice payments) or "live"
//   PAYFAST_MERCHANT_ID, PAYFAST_MERCHANT_KEY, PAYFAST_PASSPHRASE
// In sandbox mode PayFast's public practice account is used when these are empty.

import { createHash } from "node:crypto";

export const PRICE_RAND = 99;
export const PRICE = "99.00";

/** PayFast's public practice (sandbox) account. */
const SANDBOX = { merchantId: "10000100", merchantKey: "46f0cd694581a", passphrase: "jt7NOE43FZPn" };

export interface PayFastConfig {
  live: boolean;
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  processUrl: string;
  validateUrl: string;
  apiUrl: string;
}

export function payfastConfig(env: Record<string, string | undefined> = process.env): PayFastConfig {
  const live = env.PAYFAST_MODE === "live";
  const merchantId = env.PAYFAST_MERCHANT_ID || (live ? "" : SANDBOX.merchantId);
  const merchantKey = env.PAYFAST_MERCHANT_KEY || (live ? "" : SANDBOX.merchantKey);
  const passphrase = env.PAYFAST_PASSPHRASE || (live ? "" : SANDBOX.passphrase);
  if (live && (!merchantId || !merchantKey || !passphrase))
    throw new Error("PAYFAST_MODE is live, but PAYFAST_MERCHANT_ID, PAYFAST_MERCHANT_KEY or PAYFAST_PASSPHRASE is missing.");
  const host = live ? "https://www.payfast.co.za" : "https://sandbox.payfast.co.za";
  return {
    live,
    merchantId,
    merchantKey,
    passphrase,
    processUrl: `${host}/eng/process`,
    // Tests point this at a stand-in for PayFast.
    validateUrl: env.PAYFAST_VALIDATE_URL || `${host}/eng/query/validate`,
    apiUrl: env.PAYFAST_API_URL || "https://api.payfast.co.za",
  };
}

/** URL-encodes like PHP's urlencode(), which PayFast's signatures use: spaces become +, hex in capitals. */
export function pfEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/[!'()*~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase())
    .replace(/%20/g, "+");
}

const md5 = (s: string) => createHash("md5").update(s, "utf8").digest("hex");

/** Signature for the payment form: the non-empty fields in order, then the passphrase. */
export function checkoutSignature(fields: [string, string][], passphrase: string): string {
  const parts = fields.filter(([, v]) => v.trim() !== "").map(([k, v]) => `${k}=${pfEncode(v.trim())}`);
  if (passphrase) parts.push(`passphrase=${pfEncode(passphrase)}`);
  return md5(parts.join("&"));
}

export interface CheckoutInput {
  reference: string;
  siteUrl: string;
  itemName: string;
  /** Today, as YYYY-MM-DD in South Africa: the first debit. */
  billingDate: string;
}

/**
 * The fields of the form that sends the parent to PayFast for a monthly
 * subscription (frequency 3 = monthly, cycles 0 = until cancelled). The order
 * matters for the signature.
 */
export function checkoutFields(c: CheckoutInput, cfg: PayFastConfig): [string, string][] {
  const fields: [string, string][] = [
    ["merchant_id", cfg.merchantId],
    ["merchant_key", cfg.merchantKey],
    ["return_url", `${c.siteUrl}/parent/subscription?paid=1`],
    ["cancel_url", `${c.siteUrl}/parent/subscription?stopped=1`],
    ["notify_url", `${c.siteUrl}/api/payfast/notify`],
    ["m_payment_id", c.reference],
    ["amount", PRICE],
    ["item_name", c.itemName],
    ["subscription_type", "1"],
    ["billing_date", c.billingDate],
    ["recurring_amount", PRICE],
    ["frequency", "3"],
    ["cycles", "0"],
  ];
  return [...fields, ["signature", checkoutSignature(fields, cfg.passphrase)]];
}

/** The fields of a PayFast notification, in the order they arrived. */
export function parseNotification(body: string): [string, string][] {
  return [...new URLSearchParams(body).entries()];
}

/** The notification's own fields (all of them, also empty ones) up to the signature, as PayFast signed them. */
export function notificationParamString(fields: [string, string][]): string {
  const parts: string[] = [];
  for (const [k, v] of fields) {
    if (k === "signature") break;
    parts.push(`${k}=${pfEncode(v)}`);
  }
  return parts.join("&");
}

export function notificationSignatureValid(fields: [string, string][], passphrase: string): boolean {
  const given = fields.find(([k]) => k === "signature")?.[1];
  if (!given) return false;
  const base = notificationParamString(fields);
  const expected = md5(passphrase ? `${base}&passphrase=${pfEncode(passphrase)}` : base);
  return expected === given.toLowerCase();
}

/** Asks PayFast whether it really sent this notification. */
export async function confirmWithPayFast(fields: [string, string][], cfg: PayFastConfig): Promise<boolean> {
  try {
    const res = await fetch(cfg.validateUrl, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: notificationParamString(fields),
      signal: AbortSignal.timeout(10_000),
    });
    return (await res.text()).trim() === "VALID";
  } catch {
    return false;
  }
}

/** Rand amount as cents, or null. */
export function cents(amount: string | undefined): number | null {
  if (!amount || !/^\d+(\.\d{1,2})?$/.test(amount)) return null;
  return Math.round(Number(amount) * 100);
}

/** Signature for PayFast's API: all headers and the passphrase, sorted by name. */
export function apiSignature(values: Record<string, string>, passphrase: string): string {
  const all: Record<string, string> = { ...values, ...(passphrase ? { passphrase } : {}) };
  return md5(
    Object.keys(all)
      .sort()
      .filter((k) => all[k] !== "")
      .map((k) => `${k}=${pfEncode(all[k])}`)
      .join("&"),
  );
}

/** Cancels a subscription at PayFast. Returns true when PayFast accepted it. */
export async function cancelAtPayFast(token: string, cfg: PayFastConfig, now = new Date()): Promise<boolean> {
  const headers = {
    "merchant-id": cfg.merchantId,
    version: "v1",
    timestamp: now.toISOString().slice(0, 19),
  };
  try {
    const res = await fetch(`${cfg.apiUrl}/subscriptions/${encodeURIComponent(token)}/cancel${cfg.live ? "" : "?testing=true"}`, {
      method: "PUT",
      headers: { ...headers, signature: apiSignature(headers, cfg.passphrase) },
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Today's date in South Africa, as YYYY-MM-DD. */
export function todayInSouthAfrica(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg" }).format(now);
}

import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { paystackConfig, webhookSignatureValid } from "./paystack";

describe("paystackConfig", () => {
  it("is off without a key, and knows test from live", () => {
    expect(paystackConfig({})).toBeNull();
    expect(paystackConfig({ PAYSTACK_SECRET_KEY: "sk_test_abc" })?.live).toBe(false);
    expect(paystackConfig({ PAYSTACK_SECRET_KEY: "sk_live_abc" })?.live).toBe(true);
    expect(paystackConfig({ PAYSTACK_SECRET_KEY: "sk_test_abc" })?.apiUrl).toBe("https://api.paystack.co");
  });
});

describe("webhookSignatureValid", () => {
  const body = JSON.stringify({ event: "charge.success", data: { amount: 9900, currency: "ZAR" } });
  const sign = (b: string, key: string) => createHmac("sha512", key).update(b).digest("hex");

  it("accepts Paystack's HMAC-SHA512 of the raw body", () => {
    expect(webhookSignatureValid(body, sign(body, "sk_test_abc"), "sk_test_abc")).toBe(true);
  });

  it("rejects a changed body, another key or no signature", () => {
    expect(webhookSignatureValid(body.replace("9900", "100"), sign(body, "sk_test_abc"), "sk_test_abc")).toBe(false);
    expect(webhookSignatureValid(body, sign(body, "sk_test_other"), "sk_test_abc")).toBe(false);
    expect(webhookSignatureValid(body, null, "sk_test_abc")).toBe(false);
    expect(webhookSignatureValid(body, "short", "sk_test_abc")).toBe(false);
  });
});

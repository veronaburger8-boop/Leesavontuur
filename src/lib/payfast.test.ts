import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  apiSignature,
  cents,
  checkoutFields,
  checkoutSignature,
  notificationSignatureValid,
  parseNotification,
  payfastConfig,
  pfEncode,
  todayInSouthAfrica,
} from "./payfast";

const md5 = (s: string) => createHash("md5").update(s).digest("hex");

describe("pfEncode", () => {
  // Expected values come from PHP's urlencode(), which PayFast uses.
  it("encodes like PHP", () => {
    expect(pfEncode("Leesavontuur – maandelikse intekening")).toBe("Leesavontuur+%E2%80%93+maandelikse+intekening");
    expect(pfEncode("a b!*()~'.-_")).toBe("a+b%21%2A%28%29%7E%27.-_");
    expect(pfEncode("https://www.leesavontuur.co.za/parent/subscription?paid=1")).toBe("https%3A%2F%2Fwww.leesavontuur.co.za%2Fparent%2Fsubscription%3Fpaid%3D1");
    expect(pfEncode("Ê ë ô")).toBe("%C3%8A+%C3%AB+%C3%B4");
  });
});

describe("checkout", () => {
  it("signs the form fields in order with the passphrase, like PHP", () => {
    const sig = checkoutSignature(
      [
        ["merchant_id", "10000100"],
        ["merchant_key", "46f0cd694581a"],
        ["amount", "99.00"],
        ["item_name", "Leesavontuur – maandelikse intekening"],
      ],
      "jt7NOE43FZPn",
    );
    // md5 of the same string made with PHP's urlencode().
    expect(sig).toBe("5807b45308e95f7a8e74de0f16913a8d");
  });

  it("leaves out empty fields", () => {
    expect(checkoutSignature([["a", "1"], ["b", ""], ["c", "2"]], "")).toBe(md5("a=1&c=2"));
  });

  it("builds a monthly R99 subscription form for the sandbox", () => {
    const cfg = payfastConfig({});
    const fields = checkoutFields({ reference: "LA-1", siteUrl: "https://www.leesavontuur.co.za", itemName: "Leesavontuur", billingDate: "2026-10-03" }, cfg);
    const f = Object.fromEntries(fields);
    expect(f).toMatchObject({
      merchant_id: "10000100",
      amount: "99.00",
      recurring_amount: "99.00",
      subscription_type: "1",
      frequency: "3",
      cycles: "0",
      notify_url: "https://www.leesavontuur.co.za/api/payfast/notify",
    });
    expect(fields.at(-1)?.[0]).toBe("signature");
    expect(cfg.processUrl).toBe("https://sandbox.payfast.co.za/eng/process");
  });

  it("refuses live mode without the owner's PayFast details", () => {
    expect(() => payfastConfig({ PAYFAST_MODE: "live" })).toThrow(/missing/);
    const live = payfastConfig({ PAYFAST_MODE: "live", PAYFAST_MERCHANT_ID: "1", PAYFAST_MERCHANT_KEY: "k", PAYFAST_PASSPHRASE: "p" });
    expect(live.processUrl).toBe("https://www.payfast.co.za/eng/process");
  });
});

describe("notifications", () => {
  // Signs a notification the way PayFast does: every field (also empty ones), then the passphrase.
  const sign = (pairs: [string, string][], pass: string) => {
    const base = pairs.map(([k, v]) => `${k}=${pfEncode(v)}`).join("&");
    return [...pairs, ["signature", md5(`${base}&passphrase=${pfEncode(pass)}`)]] as [string, string][];
  };
  const pairs: [string, string][] = [
    ["m_payment_id", "LA-1"],
    ["pf_payment_id", "1089250"],
    ["payment_status", "COMPLETE"],
    ["item_name", "Leesavontuur – maandelikse intekening"],
    ["amount_gross", "99.00"],
    ["name_last", ""],
    ["token", "dc0521d3-55fe-269b-fa00-b647310d760f"],
  ];

  it("accepts a correctly signed notification, also with empty fields", () => {
    const body = new URLSearchParams(sign(pairs, "secret")).toString();
    expect(notificationSignatureValid(parseNotification(body), "secret")).toBe(true);
  });

  it("rejects a changed amount, a wrong passphrase or a missing signature", () => {
    const signed = sign(pairs, "secret");
    const tampered = signed.map(([k, v]) => [k, k === "amount_gross" ? "1.00" : v] as [string, string]);
    expect(notificationSignatureValid(tampered, "secret")).toBe(false);
    expect(notificationSignatureValid(signed, "other")).toBe(false);
    expect(notificationSignatureValid(pairs, "secret")).toBe(false);
  });

  it("reads amounts as cents", () => {
    expect(cents("99.00")).toBe(9900);
    expect(cents("99")).toBe(9900);
    expect(cents("abc")).toBeNull();
    expect(cents(undefined)).toBeNull();
  });
});

describe("API signature", () => {
  it("sorts the values by name and adds the passphrase", () => {
    const sig = apiSignature({ version: "v1", "merchant-id": "10000100", timestamp: "2026-10-03T10:00:00" }, "pass");
    expect(sig).toBe(md5("merchant-id=10000100&passphrase=pass&timestamp=2026-10-03T10%3A00%3A00&version=v1"));
  });
});

it("gives today's date in South Africa", () => {
  expect(todayInSouthAfrica(new Date("2026-10-03T23:30:00Z"))).toBe("2026-10-04");
});

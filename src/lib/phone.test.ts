import { describe, expect, it } from "vitest";
import { isInviteLink, normalizePhone } from "./phone";

describe("normalizePhone", () => {
  it("turns South African numbers into the international form", () => {
    expect(normalizePhone("082 123 4567")).toBe("+27821234567");
    expect(normalizePhone("(082) 123-4567")).toBe("+27821234567");
    expect(normalizePhone("+27 82 123 4567")).toBe("+27821234567");
    expect(normalizePhone("27821234567")).toBe("+27821234567");
    expect(normalizePhone("0027821234567")).toBe("+27821234567");
  });

  it("keeps numbers from other countries", () => {
    expect(normalizePhone("+44 7700 900123")).toBe("+447700900123");
  });

  it("allows an empty field", () => {
    expect(normalizePhone("  ")).toBe("");
  });

  it("refuses things that are not phone numbers", () => {
    expect(normalizePhone("082 123")).toBeNull();
    expect(normalizePhone("my number")).toBeNull();
    expect(normalizePhone("082+1234567")).toBeNull();
    expect(normalizePhone("+27 082 123 4567")).toBeNull();
  });
});

describe("isInviteLink", () => {
  it("accepts WhatsApp group invite links only", () => {
    expect(isInviteLink("https://chat.whatsapp.com/AbCdEf123456GhIjK")).toBe(true);
    expect(isInviteLink("https://chat.whatsapp.com/AbCdEf123456GhIjK?mode=ac_t")).toBe(false);
    expect(isInviteLink("https://example.com/AbCdEf123456GhIjK")).toBe(false);
    expect(isInviteLink("http://chat.whatsapp.com/AbCdEf123456GhIjK")).toBe(false);
  });
});

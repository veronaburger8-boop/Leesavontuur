import { expect, it } from "vitest";
import { dueDate, eftReference, extendPaidUntil } from "./paid-until";

const now = new Date("2026-10-20T10:00:00Z");

it("gives a first payment a month plus grace from today", () => {
  expect(extendPaidUntil(null, now).toISOString()).toBe("2026-11-23T10:00:00.000Z");
});

it("adds the next month to time already paid for, without adding grace twice", () => {
  const first = extendPaidUntil(null, now).toISOString();
  expect(extendPaidUntil(first, now).toISOString()).toBe("2026-12-23T10:00:00.000Z");
});

it("starts again from today when the paid time ran out", () => {
  expect(extendPaidUntil("2026-09-01T00:00:00Z", now).toISOString()).toBe("2026-11-23T10:00:00.000Z");
});

it("gives the due date without the grace days", () => {
  expect(dueDate("2026-11-23T10:00:00Z").toISOString()).toBe("2026-11-20T10:00:00.000Z");
});

it("makes a short reference from the family's id", () => {
  expect(eftReference("3f9a2c1d-0000-4000-8000-000000000000")).toBe("LA3F9A2C");
});

// How a payment moves a family's "paid until" date on. Shared by card
// payments (PayFast) and bank transfers (EFT) marked by the admin.

/** Days of grace added to each paid month, so a payment a little late doesn't lock the children out. */
export const GRACE_DAYS = 3;
const GRACE_MS = GRACE_DAYS * 86_400_000;

/**
 * The new "paid until" after one month's payment: a month from today, or from
 * the end of time already paid for if that is later (so paying early or
 * again after cancelling loses no days). The grace is added only once.
 */
export function extendPaidUntil(current: string | null, now = new Date()): Date {
  const paidEnd = current ? new Date(new Date(current).getTime() - GRACE_MS) : now;
  const until = new Date(Math.max(now.getTime(), paidEnd.getTime()));
  until.setMonth(until.getMonth() + 1);
  until.setDate(until.getDate() + GRACE_DAYS);
  return until;
}

/** The end of the paid month without the grace days (roughly when the next payment is due). */
export function dueDate(paidUntil: string): Date {
  return new Date(new Date(paidUntil).getTime() - GRACE_MS);
}

/** A family's short payment reference for bank transfers, e.g. "LA3F9A2C". */
export function eftReference(parentId: string): string {
  return "LA" + parentId.replace(/-/g, "").slice(0, 6).toUpperCase();
}

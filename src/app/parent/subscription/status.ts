import type { Locale, translator } from "@/lib/i18n";
import { dueDate } from "@/lib/paid-until";
import type { MyAccess } from "@/lib/subscription";

/** One sentence about the family's subscription, for the parent area. */
export function subscriptionStatus(access: MyAccess, t: ReturnType<typeof translator>, locale: Locale): string {
  const date = (d: Date) => d.toLocaleDateString(locale === "af" ? "af-ZA" : "en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" });
  const until = access.paid_until ? new Date(access.paid_until) : null;
  const paidUp = until !== null && until > new Date();
  if (access.pilot) return t("subPilotFamily");
  if (access.status === "active" && until && paidUp && !access.card) return t("subPaidUntil", { date: date(dueDate(access.paid_until!)) });
  if (access.status === "active" && until && paidUp) return t("subActive", { date: date(dueDate(access.paid_until!)) });
  if (access.status === "cancelled" && until && paidUp) return t("subCancelledUntil", { date: date(until) });
  if (access.status === "failed") return t("subFailed");
  if (access.status === "pending") return t("subPending");
  if (!access.billing_on) return t("subPilotOpen");
  if (access.status === "cancelled") return t("subEnded");
  return t("subNone");
}

export function paidUp(access: MyAccess) {
  return access.paid_until !== null && new Date(access.paid_until) > new Date();
}

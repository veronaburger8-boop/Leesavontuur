import type { Locale, translator } from "@/lib/i18n";
import type { MyAccess } from "@/lib/subscription";

/** Days of grace added to each paid month (see the PayFast notification route). */
const GRACE_MS = 3 * 86_400_000;

/** One sentence about the family's subscription, for the parent area. */
export function subscriptionStatus(access: MyAccess, t: ReturnType<typeof translator>, locale: Locale): string {
  const date = (d: Date) => d.toLocaleDateString(locale === "af" ? "af-ZA" : "en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" });
  const until = access.paid_until ? new Date(access.paid_until) : null;
  const paidUp = until !== null && until > new Date();
  if (access.pilot) return t("subPilotFamily");
  if (access.status === "active" && until && paidUp) return t("subActive", { date: date(new Date(until.getTime() - GRACE_MS)) });
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

import { Message } from "@/components/message";
import { requireAccount } from "@/lib/auth";
import { getLocale, translator } from "@/lib/i18n";
import { dueDate, eftReference } from "@/lib/paid-until";
import { cardProvider } from "@/lib/card-provider";
import { PRICE_RAND } from "@/lib/payfast";
import { getMyAccess, getPaymentOptions } from "@/lib/subscription";
import { beginCheckout, cancelSubscription } from "./actions";
import { paidUp, subscriptionStatus } from "./status";

export const metadata = { title: "Subscription" };

/** The family's subscription: status, how to pay (bank transfer and/or card through Paystack or PayFast) and cancel. */
export default async function SubscriptionPage({ searchParams }: PageProps<"/parent/subscription">) {
  const { supabase, user } = await requireAccount("/parent/subscription");
  const [sp, locale, access, options] = await Promise.all([searchParams, getLocale(), getMyAccess(supabase), getPaymentOptions(supabase)]);
  const t = translator(locale);
  const date = (d: Date) => d.toLocaleDateString(locale === "af" ? "af-ZA" : "en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" });
  const status = subscriptionStatus(access, t, locale);
  const isPaidUp = paidUp(access);
  const canSubscribeByCard = options.card && !(access.card && access.status === "active" && isPaidUp);
  const canCancel = access.card && (access.status === "active" || access.status === "failed");
  // Bank details are only needed once charging is on (during the pilot everything is free).
  const showEft = access.billing_on && !access.pilot && !(access.card && access.status === "active");
  const reference = eftReference(user.id);
  const provider = cardProvider();

  return (
    <main>
      <section className="panel">
        <h1>{t("subscription")}</h1>
        <Message kind="ok">{sp.paid ? t("subThanks") : sp.cancelled ? t("subCancelled") : null}</Message>
        <Message kind="info">{sp.stopped ? t("subStopped") : null}</Message>
        <Message kind="error">{sp.error === "cancel" ? t("subCancelFailed") : sp.error ? t("somethingWrong") : null}</Message>
        <p className="lead">{status}</p>
      </section>

      {showEft && (
        <section className="panel">
          <h2>{t("eftTitle")}</h2>
          {options.eft ? (
            <>
              <p>{t("eftIntro")}</p>
              <dl className="eft-details">
                <dt>{t("eftBank")}</dt>
                <dd>{options.eft.bank}</dd>
                <dt>{t("eftAccountName")}</dt>
                <dd>{options.eft.account_name}</dd>
                <dt>{t("eftAccountNumber")}</dt>
                <dd>{options.eft.account_number}</dd>
                <dt>{t("eftBranch")}</dt>
                <dd>{options.eft.branch_code}</dd>
                {options.eft.account_type && (
                  <>
                    <dt>{t("eftAccountType")}</dt>
                    <dd>{options.eft.account_type}</dd>
                  </>
                )}
                <dt>{t("eftAmount")}</dt>
                <dd>R{PRICE_RAND}</dd>
                <dt>{t("eftReference")}</dt>
                <dd className="eft-reference">{reference}</dd>
              </dl>
              {isPaidUp && access.paid_until && !access.card && <p>{t("eftNextBy", { date: date(dueDate(access.paid_until)) })}</p>}
              <p className="sub">{t("eftStop")}</p>
            </>
          ) : (
            !options.card && <p>{t("eftNotReady")}</p>
          )}
        </section>
      )}

      {!access.pilot && canSubscribeByCard && (
        <section className="panel">
          {showEft && options.eft && <h2>{t("orPayByCard")}</h2>}
          {!provider.live && <p className="message info">{t("subPractice", { provider: provider.name })}</p>}
          <form action={beginCheckout}>
            <p className="sub">{t("subSecure", { provider: provider.name })}</p>
            <button className="primary big" type="submit">
              {t("subscribeButton")}
            </button>
          </form>
        </section>
      )}

      {!access.pilot && canCancel && (
        <section className="panel">
          <h2>{t("subCancelButton")}</h2>
          <p>{t("subCancelHint")}</p>
          <form action={cancelSubscription} className="form">
            <label className="check">
              <input type="checkbox" name="confirm" value="yes" required />
              <span>{t("subCancelConfirm")}</span>
            </label>
            <div>
              <button className="danger" type="submit">
                {t("subCancelButton")}
              </button>
            </div>
          </form>
        </section>
      )}
    </main>
  );
}

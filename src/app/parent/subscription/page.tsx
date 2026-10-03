import { Message } from "@/components/message";
import { requireAccount } from "@/lib/auth";
import { getLocale, translator } from "@/lib/i18n";
import { payfastConfig } from "@/lib/payfast";
import { getMyAccess } from "@/lib/subscription";
import { beginCheckout, cancelSubscription } from "./actions";
import { paidUp, subscriptionStatus } from "./status";

export const metadata = { title: "Subscription" };

/** The family's subscription: status, subscribe (through PayFast) and cancel. */
export default async function SubscriptionPage({ searchParams }: PageProps<"/parent/subscription">) {
  const { supabase } = await requireAccount("/parent/subscription");
  const [sp, locale, access] = await Promise.all([searchParams, getLocale(), getMyAccess(supabase)]);
  const t = translator(locale);
  const status = subscriptionStatus(access, t, locale);
  const canSubscribe = access.status !== "active" || !paidUp(access);
  const canCancel = access.status === "active" || access.status === "failed";

  return (
    <main>
      <section className="panel">
        <h1>{t("subscription")}</h1>
        <Message kind="ok">{sp.paid ? t("subThanks") : sp.cancelled ? t("subCancelled") : null}</Message>
        <Message kind="info">{sp.stopped ? t("subStopped") : null}</Message>
        <Message kind="error">{sp.error === "cancel" ? t("subCancelFailed") : sp.error ? t("somethingWrong") : null}</Message>
        <p className="lead">{status}</p>
        {!payfastConfig().live && <p className="message info">{t("subPractice")}</p>}
        {!access.pilot && canSubscribe && (
          <form action={beginCheckout}>
            <p className="sub">{t("subSecure")}</p>
            <button className="primary big" type="submit">
              {t("subscribeButton")}
            </button>
          </form>
        )}
      </section>
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

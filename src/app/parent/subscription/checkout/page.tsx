import { redirect } from "next/navigation";
import { requireParent } from "@/lib/auth";
import { getLocale, translator } from "@/lib/i18n";
import { checkoutFields, payfastConfig, todayInSouthAfrica } from "@/lib/payfast";
import { siteUrl } from "@/lib/site";
import { AutoSubmit } from "./auto-submit";

export const metadata = { title: "PayFast" };

/** Sends the parent to PayFast's payment page with a signed form (it submits by itself). */
export default async function CheckoutPage({ searchParams }: PageProps<"/parent/subscription/checkout">) {
  const { supabase, user } = await requireParent("/parent/subscription");
  const [{ ref }, locale] = await Promise.all([searchParams, getLocale()]);
  if (typeof ref !== "string") redirect("/parent/subscription");
  // Parents can read their own subscription row only.
  const { data: sub } = await supabase.from("subscriptions").select("reference").eq("parent_id", user.id).eq("reference", ref).maybeSingle();
  if (!sub) redirect("/parent/subscription");
  const t = translator(locale);
  const cfg = payfastConfig();
  const fields = checkoutFields({ reference: ref, siteUrl: await siteUrl(), itemName: t("subItem"), billingDate: todayInSouthAfrica() }, cfg);
  return (
    <main>
      <section className="panel" style={{ textAlign: "center" }}>
        <p className="lead">{t("subRedirecting")}</p>
        <form id="payfast" action={cfg.processUrl} method="post">
          {fields.map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <button className="primary big" type="submit">
            {t("subGoToPayFast")}
          </button>
        </form>
        <AutoSubmit formId="payfast" />
      </section>
    </main>
  );
}

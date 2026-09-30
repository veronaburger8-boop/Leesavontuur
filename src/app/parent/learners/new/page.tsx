import Link from "next/link";
import { Message } from "@/components/message";
import { requireAccount } from "@/lib/auth";
import { getLocale, translator } from "@/lib/i18n";
import { addLearner } from "../../actions";
import { availableTopics } from "../../data";
import { LearnerFields } from "../../learner-form";

export const metadata = { title: "Add a child" };

export default async function NewLearnerPage({ searchParams }: PageProps<"/parent/learners/new">) {
  const { supabase } = await requireAccount("/parent/learners/new");
  const [{ error }, locale, topics] = await Promise.all([searchParams, getLocale(), availableTopics(supabase)]);
  const t = translator(locale);
  return (
    <main>
      <section className="panel">
        <h1>{t("addChild")}</h1>
        <Message kind="error">
          {error === "consent"
            ? t("mustConsent")
            : error === "name"
              ? t("nameRequired")
              : error === "topics"
                ? t("topicsCount")
                : error === "limit"
                  ? t("childLimit")
                  : error
                    ? t("somethingWrong")
                    : null}
        </Message>
        <form action={addLearner} className="form">
          <LearnerFields t={t} topics={topics} locale={locale} />
          <label className="check">
            <input type="checkbox" name="consent" value="yes" required />
            <span>
              {t("consentChild")} <Link href="/privacy">{t("privacyPolicy")}</Link>
            </span>
          </label>
          <div className="row">
            <button className="primary" type="submit">
              {t("save")}
            </button>
            <Link className="button" href="/parent">
              {t("cancel")}
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}

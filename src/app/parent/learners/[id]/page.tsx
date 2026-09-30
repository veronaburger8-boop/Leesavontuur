import Link from "next/link";
import { notFound } from "next/navigation";
import { Message } from "@/components/message";
import { requireAccount } from "@/lib/auth";
import { getLocale, translator } from "@/lib/i18n";
import { deleteLearner, updateLearner } from "../../actions";
import { availableTopics, listLearners } from "../../data";
import { LearnerFields } from "../../learner-form";

export const metadata = { title: "Edit child" };

export default async function EditLearnerPage({ params, searchParams }: PageProps<"/parent/learners/[id]">) {
  const { id } = await params;
  const { supabase } = await requireAccount(`/parent/learners/${id}`);
  const [{ error, saved }, locale, learners, topics] = await Promise.all([searchParams, getLocale(), listLearners(supabase), availableTopics(supabase)]);
  const learner = learners.find((l) => l.id === id);
  if (!learner) notFound();
  const t = translator(locale);
  return (
    <main>
      <section className="panel">
        <h1>{learner.name}</h1>
        <Message kind="ok">{saved ? t("saved") : null}</Message>
        <Message kind="error">{error === "name" ? t("nameRequired") : error === "topics" ? t("topicsCount") : error ? t("somethingWrong") : null}</Message>
        <form action={updateLearner} className="form">
          <input type="hidden" name="id" value={learner.id} />
          <LearnerFields t={t} learner={learner} topics={topics} locale={locale} />
          <div className="row">
            <button className="primary" type="submit">
              {t("save")}
            </button>
            <Link className="button" href="/parent">
              {t("back")}
            </Link>
          </div>
        </form>
      </section>
      <section className="panel">
        <h2>{t("deleteChild")}</h2>
        <p>{t("deleteChildWarning")}</p>
        <form action={deleteLearner} className="form">
          <input type="hidden" name="id" value={learner.id} />
          <label className="check">
            <input type="checkbox" name="confirm" value="yes" required />
            <span>{t("confirmDelete")}</span>
          </label>
          <div>
            <button className="danger" type="submit">
              {t("deleteChild")}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

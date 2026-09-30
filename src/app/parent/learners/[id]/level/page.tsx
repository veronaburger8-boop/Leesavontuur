import Link from "next/link";
import { notFound } from "next/navigation";
import { requireParent } from "@/lib/auth";
import { getLocale, translator } from "@/lib/i18n";
import { setLevel } from "../../../actions";
import { AVAILABLE_LEVELS, listLearners } from "../../../data";

export const metadata = { title: "Level" };

/** Confirms a level change, e.g. from the placement test result (behind the parent PIN). */
export default async function ConfirmLevel({ params, searchParams }: PageProps<"/parent/learners/[id]/level">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { supabase } = await requireParent(`/parent/learners/${id}/level`);
  const learner = (await listLearners(supabase)).find((l) => l.id === id);
  const level = Number(sp.level);
  const language = sp.language === "en" ? "en" : "af";
  if (!learner || !AVAILABLE_LEVELS.includes(level)) notFound();
  const t = translator(await getLocale());
  return (
    <main>
      <section className="panel">
        <h1>{t("confirmLevel", { name: learner.name, language: language === "af" ? t("languageAf") : t("languageEn"), level })}</h1>
        <form action={setLevel.bind(null, learner.id, language)} className="row">
          <input type="hidden" name="level" value={level} />
          <button className="primary" type="submit">
            {t("confirm")}
          </button>
          <Link className="button" href="/parent">
            {t("cancel")}
          </Link>
        </form>
      </section>
    </main>
  );
}

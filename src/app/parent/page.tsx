import Link from "next/link";
import { Message } from "@/components/message";
import { requireAccount } from "@/lib/auth";
import { getLocale, translator } from "@/lib/i18n";
import { listLearners, levelIn } from "./data";

export const metadata = { title: "Parent area" };

export default async function ParentHome({ searchParams }: PageProps<"/parent">) {
  const { supabase, profile } = await requireAccount("/parent");
  const [{ added, removed }, locale, learners] = await Promise.all([searchParams, getLocale(), listLearners(supabase)]);
  const t = translator(locale);
  return (
    <main>
      <section className="panel">
        <h1>
          {t("hello")}
          {profile.display_name ? `, ${profile.display_name}` : ""}!
        </h1>
        <Message kind="ok">{added ? t("saved") : removed ? t("saved") : null}</Message>
        <h2>{t("yourChildren")}</h2>
        {learners.length === 0 ? (
          <p>{t("noChildren")}</p>
        ) : (
          <ul className="cards" style={{ listStyle: "none", padding: 0 }}>
            {learners.map((l) => (
              <li key={l.id} className="card">
                <h3>{l.name}</h3>
                <p className="sub" style={{ marginBottom: 8 }}>
                  {l.grade === null ? "" : l.grade === 0 ? t("gradeR") : `${t("gradeN")} ${l.grade}`}
                </p>
                <p style={{ marginBottom: 12 }}>
                  {t("languageAf")}: {t("level")} {levelIn(l, "af")}
                  <br />
                  {t("languageEn")}: {t("level")} {levelIn(l, "en")}
                </p>
                <Link className="button small" href={`/parent/learners/${l.id}`}>
                  {t("editChild")}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="row" style={{ marginTop: 18 }}>
          <Link className="button primary" href="/parent/learners/new">
            {t("addChild")}
          </Link>
          <Link className="button" href="/parent/account">
            {t("account")}
          </Link>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import { Message } from "@/components/message";
import { requireAccount } from "@/lib/auth";
import { getLocale, translator } from "@/lib/i18n";
import { listLearners, levelIn, MAX_CHILDREN, recentResults } from "./data";

export const metadata = { title: "Parent area" };

export default async function ParentHome({ searchParams }: PageProps<"/parent">) {
  const { supabase, profile } = await requireAccount("/parent");
  const [{ added, removed }, locale, learners, results] = await Promise.all([searchParams, getLocale(), listLearners(supabase), recentResults(supabase)]);
  const date = (s: string) => new Date(s).toLocaleDateString(locale === "af" ? "af-ZA" : "en-ZA", { day: "numeric", month: "short", timeZone: "Africa/Johannesburg" });
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
                <div className="row">
                  <Link className="button small primary" href={`/learn/${l.id}`}>
                    {t("startReading")}
                  </Link>
                  <Link className="button small" href={`/parent/learners/${l.id}`}>
                    {t("editChild")}
                  </Link>
                </div>
                <h3 style={{ fontSize: 17, marginTop: 14 }}>{t("recentLessons")}</h3>
                {results.filter((r) => r.learner_id === l.id).length === 0 ? (
                  <p className="sub" style={{ fontSize: 15 }}>
                    {t("noLessonsYet")}
                  </p>
                ) : (
                  <ul style={{ fontSize: 15, paddingLeft: 18, margin: 0 }}>
                    {results
                      .filter((r) => r.learner_id === l.id)
                      .slice(0, 3)
                      .map((r) => (
                        <li key={r.completed_at}>
                          {date(r.completed_at)} · <span lang={r.language}>{r.content_title}</span> · {r.words_per_minute ?? "–"} W/min ·{" "}
                          {[r.comprehension_pct, r.spelling_pct, r.grammar_pct, r.vocabulary_pct].map((v) => (v === null ? "–" : `${v}%`)).join(" / ")}
                        </li>
                      ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="row" style={{ marginTop: 18 }}>
          {learners.length < MAX_CHILDREN ? (
            <Link className="button primary" href="/parent/learners/new">
              {t("addChild")}
            </Link>
          ) : (
            <span className="sub" style={{ margin: 0 }}>
              {t("childLimit")}
            </span>
          )}
          <Link className="button" href="/parent/account">
            {t("account")}
          </Link>
        </div>
      </section>
    </main>
  );
}

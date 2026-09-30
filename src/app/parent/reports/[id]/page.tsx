import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { SpeedChart } from "@/components/speed-chart";
import { requireParent } from "@/lib/auth";
import { getLocale, translator } from "@/lib/i18n";
import { averages, monthSummary, type ReportResult, reportRows, SCORE_KEYS } from "@/lib/reports";
import { levelIn, listLearners } from "../../data";

export const metadata = { title: "Report" };

/** A child's report per language and level (brief, section 5). */
export default async function ReportPage({ params, searchParams }: PageProps<"/parent/reports/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { supabase } = await requireParent(`/parent/reports/${id}`);
  const learner = (await listLearners(supabase)).find((l) => l.id === id);
  if (!learner) notFound();
  const language = sp.language === "en" ? "en" : "af";
  const [locale, { data }] = await Promise.all([
    getLocale(),
    supabase
      .from("lesson_results")
      .select("completed_at, content_title, content_type, level, is_challenge, words_per_minute, unusually_fast, comprehension_pct, spelling_pct, grammar_pct, vocabulary_pct")
      .eq("learner_id", id)
      .eq("language", language)
      .order("completed_at"),
  ]);
  const t = translator(locale);
  const results = (data ?? []) as ReportResult[];
  const levels = [...new Set([...results.map((r) => r.level), levelIn(learner, language)])].sort((a, b) => a - b);
  const level = levels.includes(Number(sp.level)) ? Number(sp.level) : levelIn(learner, language);
  const rows = reportRows(results, level);
  const avg = averages(rows);
  const month = monthSummary(results, new Date());
  const langName = language === "af" ? t("languageAf") : t("languageEn");
  const date = (s: string) => new Date(s).toLocaleDateString(locale === "af" ? "af-ZA" : "en-ZA", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Johannesburg" });
  const cell = (v: number | null, pct = true) => (v === null ? "–" : pct ? `${v}%` : String(v));

  return (
    <main className="wide">
      <section className="panel report">
        <p className="no-print">
          <Link href="/parent">← {t("parentArea")}</Link>
        </p>
        <h1>{t("reportFor", { name: learner.name })}</h1>
        <p className="sub">
          {langName} · {t("level")} {level}
        </p>

        <div className="row no-print" style={{ marginBottom: 16 }}>
          {(["af", "en"] as const).map((l) => (
            <Link key={l} className={`button small${l === language ? " primary" : ""}`} href={`/parent/reports/${id}?language=${l}`} aria-current={l === language ? "page" : undefined}>
              {l === "af" ? t("languageAf") : t("languageEn")}
            </Link>
          ))}
          <form className="row" method="get">
            <input type="hidden" name="language" value={language} />
            <select name="level" defaultValue={level} aria-label={t("level")} style={{ width: "auto" }}>
              {levels.map((n) => (
                <option key={n} value={n}>
                  {t("level")} {n}
                </option>
              ))}
            </select>
            <button className="small" type="submit">
              OK
            </button>
          </form>
        </div>

        <p style={{ fontWeight: 700 }}>
          {month.lessons ? t("monthSummary", { n: month.lessons, c: month.comprehension ?? "–" }) : t("monthSummaryNone")}
        </p>

        {rows.length === 0 ? (
          <p className="message info">{t("noResultsLevel")}</p>
        ) : (
          <div className="table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>{t("date")}</th>
                  <th style={{ textAlign: "left" }}>{t("lesson")}</th>
                  <th>W/min</th>
                  <th>{t("comprehensionCol")}</th>
                  <th>{t("spellingCol")}</th>
                  <th>{t("grammarCol")}</th>
                  <th>{t("vocabularyCol")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.completed_at}>
                    <td style={{ fontSize: 15, fontWeight: 400 }}>{date(r.completed_at)}</td>
                    <td style={{ textAlign: "left", fontSize: 16 }} lang={language}>
                      {r.content_title}
                      {r.content_type === "calibration" && <span className="badge in_review" style={{ marginLeft: 6 }}>{t("calibrationMark")}</span>}
                      {r.is_challenge && <span className="badge published" style={{ marginLeft: 6 }}>{t("challengeMark")}</span>}
                    </td>
                    <td>
                      {cell(r.words_per_minute, false)}
                      {r.unusually_fast && <span className="sub" style={{ fontSize: 12, display: "block" }}>({t("fastMark")})</span>}
                    </td>
                    <td>{cell(r.comprehension_pct)}</td>
                    <td>{cell(r.spelling_pct)}</td>
                    <td>{cell(r.grammar_pct)}</td>
                    <td>{cell(r.vocabulary_pct)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="average-row">
                  <th colSpan={2} style={{ textAlign: "left" }}>
                    {t("average")}
                  </th>
                  {SCORE_KEYS.map((k) => (
                    <td key={k}>{cell(avg[k], k !== "words_per_minute")}</td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <p className="sub" style={{ fontSize: 14 }}>
          {t("averageNote")}
        </p>

        <div style={{ marginTop: 20 }}>
          <SpeedChart
            results={results}
            locale={locale}
            labels={{ title: t("speedTitle"), tooFew: t("speedTooFew"), wpm: t("wpmShort"), level: t("level"), calibration: t("calibrationMark") }}
          />
        </div>

        <div className="row no-print" style={{ marginTop: 20 }}>
          <PrintButton label={t("printPdf")} />
          <span className="sub" style={{ margin: 0, fontSize: 14 }}>
            {t("printHint")}
          </span>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import { Message } from "@/components/message";
import { requireAccount } from "@/lib/auth";
import { getLocale, translator } from "@/lib/i18n";
import { belowRecommendedGrade, levelSuggestion, type ResultScores } from "@/lib/levels";
import { getSettings } from "@/lib/lesson/next";
import { decideRequest, dismissNotification, ignoreSuggestion, setLevel } from "./actions";
import { AVAILABLE_LEVELS, listLearners, levelIn, MAX_CHILDREN } from "./data";

export const metadata = { title: "Parent area" };

interface FamilyResult extends ResultScores {
  learner_id: string;
  content_title: string;
  language: "af" | "en";
}

export default async function ParentHome({ searchParams }: PageProps<"/parent">) {
  const { supabase, profile } = await requireAccount("/parent");
  const [sp, locale, learners, settings, { data: results }, { data: requests }, { data: notes }] = await Promise.all([
    searchParams,
    getLocale(),
    listLearners(supabase),
    getSettings(supabase),
    supabase
      .from("lesson_results")
      .select("learner_id, content_title, language, level, completed_at, words_per_minute, comprehension_pct, spelling_pct, grammar_pct, vocabulary_pct, content_type, is_challenge")
      .order("completed_at", { ascending: false })
      .limit(500),
    supabase.from("level_requests").select("id, learner_id, language, to_level, status").in("status", ["pending", "approved"]),
    supabase.from("notifications").select("id, learner_id, kind, language, level").is("read_at", null).order("created_at", { ascending: false }),
  ]);
  const t = translator(locale);
  const all = (results ?? []) as FamilyResult[];
  const langName = (l: string) => (l === "af" ? t("languageAf") : t("languageEn"));
  const nameOf = (id: string | null) => learners.find((l) => l.id === id)?.name ?? "";
  const date = (s: string) => new Date(s).toLocaleDateString(locale === "af" ? "af-ZA" : "en-ZA", { day: "numeric", month: "short", timeZone: "Africa/Johannesburg" });
  const pct = (v: number | null) => (v === null ? "–" : `${v}%`);
  const pending = (requests ?? []).filter((r) => r.status === "pending");
  const hasNotices = pending.length > 0 || (notes ?? []).length > 0;

  return (
    <main>
      <section className="panel">
        <h1>
          {t("hello")}
          {profile.display_name ? `, ${profile.display_name}` : ""}!
        </h1>
        <Message kind="ok">{sp.added || sp.removed ? t("saved") : sp.levelSet ? t("levelSet") : null}</Message>
        <Message kind="error">{sp.error ? t("somethingWrong") : null}</Message>

        {hasNotices && (
          <div style={{ marginBottom: 18 }}>
            <h2>{t("notifications")}</h2>
            {pending.map((r) => (
              <div key={`r${r.id}`} className="message info">
                <strong>{nameOf(r.learner_id)}</strong> {t("requestText", { level: r.to_level, language: langName(r.language) })}
                <form action={decideRequest} className="row" style={{ marginTop: 8 }}>
                  <input type="hidden" name="id" value={r.id} />
                  <button className="small primary" type="submit" name="approve" value="yes">
                    {t("approve")}
                  </button>
                  <button className="small" type="submit" name="approve" value="no">
                    {t("decline")}
                  </button>
                </form>
              </div>
            ))}
            {(notes ?? []).map((n) => (
              <div key={`n${n.id}`} className={`message ${n.kind === "moved_up" ? "ok" : "info"}`}>
                <strong>{nameOf(n.learner_id)}</strong>{" "}
                {t(n.kind === "moved_up" ? "movedUp" : "notPassed", { level: n.level ?? "", language: langName(n.language ?? "af") })}
                <form action={dismissNotification} style={{ display: "inline", marginLeft: 8 }}>
                  <input type="hidden" name="id" value={n.id} />
                  <button className="small" type="submit">
                    {t("ok")}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}

        <h2>{t("yourChildren")}</h2>
        {learners.length === 0 ? (
          <>
            <p>{t("noChildren")}</p>
            <p className="message info">{t("gradeAdvice")}</p>
          </>
        ) : (
          <ul className="cards" style={{ listStyle: "none", padding: 0, gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))" }}>
            {learners.map((l) => {
              const mine = all.filter((r) => r.learner_id === l.id);
              const suggestions = (["af", "en"] as const)
                .map((language) => {
                  const lang = l.learner_languages.find((x) => x.language === language);
                  const level = levelIn(l, language);
                  const inLang = mine.filter((r) => r.language === language);
                  const total = inLang.filter((r) => r.content_type === "lesson").length;
                  // While the child's own request is open, the parent answers that instead.
                  const open = (requests ?? []).some((r) => r.learner_id === l.id && r.language === language);
                  const s = open ? null : levelSuggestion(inLang, level, total, lang?.suggestion_snoozed_at ?? 0, settings);
                  return s ? { language, level, ...s } : null;
                })
                .filter((x) => x !== null);
              return (
                <li key={l.id} className="card">
                  <h3>{l.name}</h3>
                  <p className="sub" style={{ marginBottom: 8 }}>
                    {l.grade === null ? "" : l.grade === 0 ? t("gradeR") : `${t("gradeN")} ${l.grade}`}
                  </p>
                  {belowRecommendedGrade(l.grade) && (
                    <p className="message info" style={{ fontSize: 15, fontWeight: 400 }}>
                      {t("gradeAdvice")}
                    </p>
                  )}
                  <p style={{ marginBottom: 12 }}>
                    {t("languageAf")}: {t("level")} {levelIn(l, "af")}
                    <br />
                    {t("languageEn")}: {t("level")} {levelIn(l, "en")}
                  </p>

                  {suggestions.map((s) => (
                    <div key={s.language} className="message info" style={{ fontSize: 15 }}>
                      <strong>{l.name}</strong>{" "}
                      {t(s.direction === "up" ? "suggestUp" : "suggestDown", {
                        avg: s.average,
                        level: s.level,
                        language: langName(s.language),
                        to: s.direction === "up" ? s.level + 1 : s.level - 1,
                      })}
                      <div className="row" style={{ marginTop: 8 }}>
                        <form action={setLevel.bind(null, l.id, s.language)}>
                          <input type="hidden" name="level" value={s.direction === "up" ? s.level + 1 : s.level - 1} />
                          <button className="small primary" type="submit">
                            {t("moveTo", { to: s.direction === "up" ? s.level + 1 : s.level - 1 })}
                          </button>
                        </form>
                        <form action={ignoreSuggestion}>
                          <input type="hidden" name="learner_id" value={l.id} />
                          <input type="hidden" name="language" value={s.language} />
                          <button className="small" type="submit">
                            {t("ignore")}
                          </button>
                        </form>
                      </div>
                    </div>
                  ))}

                  <div className="row">
                    <Link className="button small primary" href={`/learn/${l.id}`}>
                      {t("startReading")}
                    </Link>
                    <Link className="button small" href={`/parent/learners/${l.id}`}>
                      {t("editChild")}
                    </Link>
                  </div>

                  <details style={{ marginTop: 12 }}>
                    <summary>{t("placementTest")}</summary>
                    <form action={`/learn/${l.id}/calibrate`} method="get" className="form" style={{ marginTop: 8, gap: 10 }}>
                      <span className="hint sub" style={{ margin: 0, fontSize: 15 }}>
                        {t("placementHint")}
                      </span>
                      <div className="row">
                        <select name="language" aria-label={t("language")} style={{ width: "auto" }} defaultValue="af">
                          <option value="af">{t("languageAf")}</option>
                          <option value="en">{t("languageEn")}</option>
                        </select>
                        <select name="level" aria-label={t("level")} style={{ width: "auto" }} defaultValue={levelIn(l, "af")}>
                          {AVAILABLE_LEVELS.map((n) => (
                            <option key={n} value={n}>
                              {t("level")} {n}
                            </option>
                          ))}
                        </select>
                        <button className="small" type="submit">
                          {t("startTest")}
                        </button>
                      </div>
                    </form>
                  </details>

                  <h3 style={{ fontSize: 17, marginTop: 14 }}>{t("recentLessons")}</h3>
                  {mine.length === 0 ? (
                    <p className="sub" style={{ fontSize: 15 }}>
                      {t("noLessonsYet")}
                    </p>
                  ) : (
                    <ul style={{ fontSize: 15, paddingLeft: 18, margin: 0 }}>
                      {mine.slice(0, 3).map((r) => (
                        <li key={r.completed_at}>
                          {date(r.completed_at)} · <span lang={r.language}>{r.content_title}</span>
                          {r.content_type === "calibration" ? ` (${t("calibrationMark")})` : r.is_challenge ? ` (${t("challengeMark")})` : ""} ·{" "}
                          {r.words_per_minute ?? "–"} W/min · {[r.comprehension_pct, r.spelling_pct, r.grammar_pct, r.vocabulary_pct].map(pct).join(" / ")}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
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

import type { SupabaseClient } from "@supabase/supabase-js";
import type { translator } from "@/lib/i18n";
import { requestTopic } from "./actions";
import type { LearnerRow } from "./data";

type T = ReturnType<typeof translator>;

export interface TopicRequestRow {
  id: number;
  learner_id: string | null;
  request: string;
  language: "af" | "en";
  level: number;
  status: "received" | "preparing" | "ready" | "declined";
  reply: string | null;
  created_at: string;
}

/** This family's own requests (staff may read everyone's, so filter by parent too). */
export async function listTopicRequests(supabase: SupabaseClient, parentId: string) {
  const { data } = await supabase
    .from("topic_requests")
    .select("id, learner_id, request, language, level, status, reply, created_at")
    .eq("parent_id", parentId)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []) as TopicRequestRow[];
}

const STEPS = ["received", "preparing", "ready"] as const;

/** "Ask for a topic" and the family's requests with their status (brief, section 4). */
export function TopicRequests({
  t,
  learners,
  requests,
  sent,
  error,
}: {
  t: T;
  learners: LearnerRow[];
  requests: TopicRequestRow[];
  sent: boolean;
  error: string | undefined;
}) {
  if (!learners.length) return null;
  const statusText = (s: TopicRequestRow["status"]) =>
    t(s === "received" ? "topicReceived" : s === "preparing" ? "topicPreparing" : s === "ready" ? "topicReady" : "topicDeclined");
  const nameOf = (id: string | null) => learners.find((l) => l.id === id)?.name ?? "";
  return (
    <section className="panel" id="topics">
      <h2>{t("askTopic")}</h2>
      <p>{t("askTopicHint")}</p>
      {sent && <p className="message ok">{t("topicThanks")}</p>}
      {error && <p className="message error">{t(error === "length" ? "topicLength" : error === "limit" ? "topicLimit" : "somethingWrong")}</p>}
      <form action={requestTopic} className="form">
        <div className="field">
          <label htmlFor="topic-request">{t("topicWish")}</label>
          <input id="topic-request" name="request" type="text" required minLength={2} maxLength={60} placeholder={t("topicExample")} autoComplete="off" />
        </div>
        <div className="row">
          <div>
            <label htmlFor="topic-learner" style={{ display: "block" }}>{t("forChild")}</label>
            <select id="topic-learner" name="learner_id" style={{ width: "auto" }}>
              {learners.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="topic-language" style={{ display: "block" }}>{t("language")}</label>
            <select id="topic-language" name="language" style={{ width: "auto" }}>
              <option value="af">{t("languageAf")}</option>
              <option value="en">{t("languageEn")}</option>
            </select>
          </div>
        </div>
        <div>
          <button className="primary" type="submit">
            {t("sendRequest")}
          </button>
        </div>
      </form>

      {requests.length > 0 && (
        <>
          <h3 style={{ marginTop: 18 }}>{t("yourRequests")}</h3>
          <ul className="request-list">
            {requests.map((r) => (
              <li key={r.id}>
                <strong>{r.request}</strong>
                <span className="sub">
                  {" "}
                  · {nameOf(r.learner_id)} · {r.language === "af" ? t("languageAf") : t("languageEn")} · {t("level")} {r.level}
                </span>
                {r.status === "declined" ? (
                  <p className="message info" style={{ margin: "6px 0 0" }}>
                    {statusText(r.status)}
                    {r.reply ? ` “${r.reply}”` : ""}
                  </p>
                ) : (
                  <ol className="request-steps" aria-label={statusText(r.status)}>
                    {STEPS.map((s, i) => (
                      <li key={s} className={i <= STEPS.indexOf(r.status as (typeof STEPS)[number]) ? "done" : ""}>
                        {statusText(s)}
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

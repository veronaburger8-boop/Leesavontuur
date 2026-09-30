import Link from "next/link";
import { Message } from "@/components/message";
import { requireStaff } from "@/lib/auth";
import { declineRequests, linkRequests } from "../actions";

export const metadata = { title: "Requests" };

interface RequestRow {
  id: number;
  request: string;
  language: "af" | "en";
  level: number;
  status: "received" | "preparing" | "ready" | "declined";
  topic: string | null;
  reply: string | null;
  created_at: string;
}

interface Group {
  key: string;
  label: string;
  topic: string | null;
  rows: RequestRow[];
}

const STATUS: Record<RequestRow["status"], string> = { received: "Received", preparing: "Being prepared", ready: "Ready", declined: "Declined" };

/** Similar requests group together: by linked topic, or by the words typed (ignoring case and spaces). */
function groupRequests(rows: RequestRow[], topicName: Map<string, string>): Group[] {
  const groups = new Map<string, Group>();
  for (const r of rows) {
    const key = r.topic ? `topic:${r.topic}` : `text:${r.request.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim()}`;
    const g = groups.get(key) ?? { key, label: r.topic ? (topicName.get(r.topic) ?? r.topic) : r.request, topic: r.topic, rows: [] };
    g.rows.push(r);
    groups.set(key, g);
  }
  return [...groups.values()].sort((a, b) => b.rows.length - a.rows.length);
}

const when = (s: string) => new Date(s).toLocaleDateString("en-ZA", { day: "numeric", month: "short", timeZone: "Africa/Johannesburg" });

export default async function RequestsInbox({ searchParams }: PageProps<"/admin/requests">) {
  const { supabase } = await requireStaff();
  const [sp, { data }, { data: topics }] = await Promise.all([
    searchParams,
    supabase.from("topic_requests").select("id, request, language, level, status, topic, reply, created_at").order("created_at", { ascending: false }).limit(500),
    supabase.from("topics").select("key, name_en").order("sort_order"),
  ]);
  const rows = (data ?? []) as RequestRow[];
  const topicName = new Map((topics ?? []).map((t) => [t.key as string, t.name_en as string]));
  const open = groupRequests(
    rows.filter((r) => r.status === "received" || r.status === "preparing"),
    topicName,
  );
  const closed = rows.filter((r) => r.status === "ready" || r.status === "declined").slice(0, 30);

  return (
    <>
      <section className="panel">
        <h1>Topic requests</h1>
        <p className="sub">
          Requests from parents, grouped by topic. You see each child&apos;s language and level, never their name. A request becomes <strong>Ready</strong> by
          itself (and the parent is told) as soon as a lesson for its topic is published at the child&apos;s language and level.
        </p>
        <Message kind="ok">{sp.linked ? "Linked to the topic." : sp.declined ? "Declined. The parents will see this on their page." : null}</Message>
        <Message kind="error">
          {sp.error === "names"
            ? "Please give the new topic an English and an Afrikaans name."
            : sp.error === "exists"
              ? "A topic with that name already exists. Choose it from the list instead."
              : sp.error
                ? "That didn't work. Please try again."
                : null}
        </Message>
        {open.length === 0 && <p>No open requests. 🎉</p>}
        <div className="cards" style={{ gridTemplateColumns: "1fr" }}>
          {open.map((g) => {
            const ids = g.rows.map((r) => r.id).join(",");
            const wants = [...new Set(g.rows.map((r) => `${r.language}-${r.level}`))].sort().map((s) => {
              const [language, level] = s.split("-");
              return { language, level: Number(level), count: g.rows.filter((r) => r.language === language && r.level === Number(level)).length };
            });
            return (
              <div key={g.key} className="card request-group">
                <h2 style={{ marginBottom: 4 }}>
                  {g.label} <span className="badge in_review">{g.rows.length} request{g.rows.length === 1 ? "" : "s"}</span>
                </h2>
                <p className="sub" style={{ margin: 0 }}>
                  {g.topic ? `Linked to topic “${topicName.get(g.topic) ?? g.topic}” · ` : ""}
                  Asked as: {[...new Set(g.rows.map((r) => `“${r.request}”`))].join(", ")}
                </p>
                <p style={{ margin: "8px 0" }}>
                  Needed at:{" "}
                  {wants.map((w) => (
                    <span key={`${w.language}${w.level}`} className="badge draft" style={{ marginRight: 6 }}>
                      {w.language === "af" ? "Afrikaans" : "English"} Level {w.level} ×{w.count}
                    </span>
                  ))}
                </p>
                <ul className="sub" style={{ fontSize: 14, margin: "0 0 10px", paddingLeft: 18 }}>
                  {g.rows.map((r) => (
                    <li key={r.id}>
                      {when(r.created_at)} · “{r.request}” · {r.language === "af" ? "Afrikaans" : "English"} Level {r.level} · {STATUS[r.status]}
                    </li>
                  ))}
                </ul>

                {g.topic ? (
                  <div className="row">
                    {wants.map((w) => (
                      <Link
                        key={`${w.language}${w.level}`}
                        className="button small primary"
                        href={`/admin/draft?topic=${g.topic}&language=${w.language}&level=${w.level}&count=3`}
                      >
                        Draft {w.language === "af" ? "Afrikaans" : "English"} Level {w.level} lessons
                      </Link>
                    ))}
                    <Link className="button small" href={`/admin/content/new?topic=${g.topic}&language=${wants[0].language}&level=${wants[0].level}`}>
                      Write one by hand
                    </Link>
                  </div>
                ) : (
                  <details open={g.rows.length > 1}>
                    <summary>Link to a topic</summary>
                    <form action={linkRequests} className="form" style={{ marginTop: 8 }}>
                      <input type="hidden" name="ids" value={ids} />
                      <div className="field">
                        <label htmlFor={`topic-${g.key}`}>Topic</label>
                        <select id={`topic-${g.key}`} name="topic" defaultValue="new">
                          <option value="new">A new topic (fill in the names below)</option>
                          {(topics ?? []).map((t) => (
                            <option key={t.key} value={t.key}>
                              {t.name_en}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="row">
                        <div style={{ flex: "1 1 200px" }}>
                          <label htmlFor={`en-${g.key}`}>New topic, English name</label>
                          <input id={`en-${g.key}`} name="name_en" type="text" maxLength={60} placeholder="Horses" />
                        </div>
                        <div style={{ flex: "1 1 200px" }}>
                          <label htmlFor={`af-${g.key}`}>New topic, Afrikaans name</label>
                          <input id={`af-${g.key}`} name="name_af" type="text" maxLength={60} placeholder="Perde" />
                        </div>
                      </div>
                      <div>
                        <button className="small primary" type="submit">
                          Link {g.rows.length === 1 ? "request" : `${g.rows.length} requests`}
                        </button>
                      </div>
                    </form>
                  </details>
                )}
                <details>
                  <summary>Decline</summary>
                  <form action={declineRequests} className="form" style={{ marginTop: 8 }}>
                    <input type="hidden" name="ids" value={ids} />
                    <label htmlFor={`reply-${g.key}`}>Short reply to the parents (optional)</label>
                    <input id={`reply-${g.key}`} name="reply" type="text" maxLength={300} placeholder="e.g. This topic isn't suitable for young readers." />
                    <div>
                      <button className="small danger" type="submit">
                        Decline {g.rows.length === 1 ? "request" : `${g.rows.length} requests`}
                      </button>
                    </div>
                  </form>
                </details>
              </div>
            );
          })}
        </div>
      </section>

      {closed.length > 0 && (
        <section className="panel">
          <h2>Recently handled</h2>
          <ul>
            {closed.map((r) => (
              <li key={r.id}>
                {when(r.created_at)} · “{r.request}” · {r.language === "af" ? "Afrikaans" : "English"} Level {r.level} · {STATUS[r.status]}
                {r.topic ? ` · ${topicName.get(r.topic) ?? r.topic}` : ""}
                {r.reply ? ` – “${r.reply}”` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

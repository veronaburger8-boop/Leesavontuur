import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/content/labels";
import { BENCHMARKS, STATUSES, type Status } from "@/lib/content/types";

export const metadata = { title: "Content library" };

interface Row {
  id: string;
  type: "lesson" | "calibration";
  language: "af" | "en";
  level: number;
  topic: string | null;
  status: Status;
  title: string;
  sequence: number | null;
  word_count: number;
  updated_at: string;
}

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

export default async function LibraryPage({ searchParams }: PageProps<"/admin">) {
  const { supabase } = await requireStaff();
  const sp = await searchParams;
  const f = { q: one(sp.q), language: one(sp.language), level: one(sp.level), type: one(sp.type), topic: one(sp.topic), status: one(sp.status) };

  let query = supabase
    .from("content_items")
    .select("id, type, language, level, topic, status, title, sequence, word_count, updated_at")
    .order("language")
    .order("level")
    .order("type", { ascending: false })
    .order("sequence");
  if (f.q) query = query.ilike("title", `%${f.q.replace(/[%_\\]/g, "\\$&")}%`);
  if (f.language) query = query.eq("language", f.language);
  if (f.level) query = query.eq("level", Number(f.level));
  if (f.type) query = query.eq("type", f.type);
  if (f.topic) query = query.eq("topic", f.topic);
  if (f.status) query = query.eq("status", f.status);

  const [{ data, error }, { data: topics }, { data: all }] = await Promise.all([
    query.returns<Row[]>(),
    supabase.from("topics").select("key, name_en").order("sort_order"),
    supabase.from("content_items").select("status").returns<{ status: Status }[]>(),
  ]);
  const rows = data ?? [];
  const counts = Object.fromEntries(STATUSES.map((s) => [s, (all ?? []).filter((r) => r.status === s).length]));
  const topicName = new Map((topics ?? []).map((t) => [t.key as string, t.name_en as string]));

  return (
    <section className="panel">
      <h1>Content library</h1>
      <p className="sub">
        Children only ever see items marked <span className="badge published">Published</span>.
      </p>
      <div className="row" style={{ marginBottom: 16 }}>
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin?status=${s}`} className={`badge ${s}`}>
            {STATUS_LABELS[s]}: {counts[s]}
          </Link>
        ))}
      </div>

      <form className="row" style={{ alignItems: "flex-end", marginBottom: 18 }} role="search">
        <div className="field" style={{ flex: "2 1 220px" }}>
          <label htmlFor="q">Search titles</label>
          <input id="q" name="q" type="search" defaultValue={f.q} />
        </div>
        <Filter name="language" label="Language" value={f.language} options={[["af", "Afrikaans"], ["en", "English"]]} />
        <Filter name="level" label="Level" value={f.level} options={Object.keys(BENCHMARKS).map((l) => [l, `Level ${l}`])} />
        <Filter name="type" label="Type" value={f.type} options={[["lesson", "Lesson"], ["calibration", "Calibration"]]} />
        <Filter name="topic" label="Topic" value={f.topic} options={(topics ?? []).map((t) => [t.key, t.name_en])} />
        <Filter name="status" label="Status" value={f.status} options={STATUSES.map((s) => [s, STATUS_LABELS[s]])} />
        <button type="submit" className="primary">
          Filter
        </button>
        <Link href="/admin" className="button">
          Clear
        </Link>
      </form>

      {error && <p className="message error">Could not load the library: {error.message}</p>}
      <p>
        {rows.length} item{rows.length === 1 ? "" : "s"}
      </p>
      {rows.length === 0 && !error && (
        <p className="message info">
          Nothing here yet. Use <Link href="/admin/import">Import</Link> to upload <code>content/lessons.json</code>.
        </p>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Language</th>
              <th>Level</th>
              <th>Type</th>
              <th>Topic</th>
              <th>Words</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td lang={r.language}>
                  <Link href={`/admin/content/${r.id}`}>{r.title}</Link>
                </td>
                <td>{r.language === "af" ? "Afrikaans" : "English"}</td>
                <td>{r.level}</td>
                <td>{r.type === "lesson" ? `Lesson ${r.sequence ?? ""}` : `Calibration ${r.sequence ?? ""}`}</td>
                <td>{r.topic ? topicName.get(r.topic) ?? r.topic : "–"}</td>
                <td>{r.word_count}</td>
                <td>
                  <span className={`badge ${r.status}`}>{STATUS_LABELS[r.status]}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Filter({ name, label, value, options }: { name: string; label: string; value: string; options: string[][] }) {
  return (
    <div className="field" style={{ flex: "1 1 130px" }}>
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} defaultValue={value}>
        <option value="">All</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}

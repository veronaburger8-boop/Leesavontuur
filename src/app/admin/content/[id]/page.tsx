import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentPreview } from "@/components/content-preview";
import { Message } from "@/components/message";
import { requireStaff } from "@/lib/auth";
import { STATUS_LABELS } from "@/lib/content/labels";
import type { ContentItem, Status } from "@/lib/content/types";
import { changeStatus } from "../../actions";

export const metadata = { title: "Review" };

interface ItemRow {
  id: string;
  status: Status;
  review_note: string | null;
  updated_at: string;
  published_at: string | null;
  data: Omit<ContentItem, "status">;
}

interface LogRow {
  id: number;
  from_status: Status | null;
  to_status: Status;
  note: string | null;
  changed_at: string;
  changed_by: string | null;
}

const when = (s: string) => new Date(s).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Johannesburg" });

export default async function ContentItemPage({ params, searchParams }: PageProps<"/admin/content/[id]">) {
  const { id } = await params;
  const { supabase } = await requireStaff();
  const [{ error, changed }, { data: row }, { data: log }] = await Promise.all([
    searchParams,
    supabase.from("content_items").select("id, status, review_note, updated_at, published_at, data").eq("id", id).maybeSingle<ItemRow>(),
    supabase.from("content_status_log").select("id, from_status, to_status, note, changed_at, changed_by").eq("content_id", id).order("id", { ascending: false }).returns<LogRow[]>(),
  ]);
  if (!row) notFound();
  const item = { ...row.data, status: row.status } as ContentItem;

  // Names of the people in the history (staff can read staff profiles).
  const people = [...new Set((log ?? []).map((e) => e.changed_by).filter(Boolean))] as string[];
  const { data: profiles } = people.length ? await supabase.from("profiles").select("id, display_name").in("id", people) : { data: [] };
  const who = new Map((profiles ?? []).map((p) => [p.id as string, (p.display_name as string | null) ?? "Admin"]));

  return (
    <>
      <section className="panel">
        <p>
          <Link href="/admin">← Content library</Link>
        </p>
        <h1 lang={item.language}>{item.title}</h1>
        <p className="sub">
          {item.language === "af" ? "Afrikaans" : "English"} · Level {item.level} · {item.type === "lesson" ? `Lesson ${item.sequence ?? ""}` : "Calibration passage"}
          {item.topic ? ` · ${item.topic}` : ""} · <code>{item.id}</code>
        </p>
        <p>
          Status: <span className={`badge ${row.status}`}>{STATUS_LABELS[row.status]}</span>
          {row.status === "published" ? " – children can see this item." : " – children cannot see this item."}
        </p>
        <Message kind="ok">{typeof changed === "string" && changed in STATUS_LABELS ? `Status changed to ${STATUS_LABELS[changed as Status]}.` : null}</Message>
        <Message kind="error">
          {error === "note" ? "Please write a note saying what needs to change." : error ? "The status could not be changed. Please try again." : null}
        </Message>
        {row.review_note && row.status !== "published" && (
          <div className="message info" style={{ whiteSpace: "pre-line" }}>
            <strong>Review note:</strong>
            {"\n"}
            {row.review_note}
          </div>
        )}

        <div className="row" style={{ alignItems: "flex-start" }}>
          {row.status !== "published" && (
            <form action={changeStatus} className="form" style={{ flex: "1 1 260px" }}>
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="to" value="published" />
              <label htmlFor="publish-note" className="sr-only">
                Note (optional)
              </label>
              <input id="publish-note" name="note" type="text" placeholder="Note (optional)" />
              <div>
                <button className="primary" type="submit">
                  Publish
                </button>
              </div>
            </form>
          )}
          {row.status !== "draft" && (
            <form action={changeStatus} className="form" style={{ flex: "1 1 260px" }}>
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="to" value="draft" />
              <label htmlFor="draft-note" className="sr-only">
                What needs to change?
              </label>
              <input id="draft-note" name="note" type="text" placeholder="What needs to change?" required />
              <div>
                <button type="submit">Send back to draft</button>
              </div>
            </form>
          )}
          {row.status === "draft" && (
            <form action={changeStatus} style={{ flex: "0 0 auto" }}>
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="to" value="in_review" />
              <button type="submit">Ready for review</button>
            </form>
          )}
          {row.status === "published" && (
            <form action={changeStatus} style={{ flex: "0 0 auto" }}>
              <input type="hidden" name="id" value={row.id} />
              <input type="hidden" name="to" value="retired" />
              <button className="danger" type="submit">
                Retire
              </button>
            </form>
          )}
        </div>
      </section>

      <ContentPreview item={item} />

      <section className="panel">
        <h2>History</h2>
        <ul>
          {(log ?? []).map((e) => (
            <li key={e.id}>
              {when(e.changed_at)}: {e.from_status ? `${STATUS_LABELS[e.from_status]} → ` : "Added as "}
              {STATUS_LABELS[e.to_status]}
              {e.changed_by ? ` by ${who.get(e.changed_by) ?? "a reviewer"}` : " (import)"}
              {e.note ? ` – “${e.note}”` : ""}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

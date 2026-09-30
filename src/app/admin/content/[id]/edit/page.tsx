import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonEditor } from "@/components/admin/lesson-editor";
import { requireStaff } from "@/lib/auth";
import { toForm } from "@/lib/content/editor";
import type { ContentItem, Status } from "@/lib/content/types";
import { saveContentForm } from "../../../actions";

export const metadata = { title: "Edit" };

export default async function EditContentPage({ params }: PageProps<"/admin/content/[id]/edit">) {
  const { id } = await params;
  const { supabase } = await requireStaff();
  const [{ data: row }, { data: topics }] = await Promise.all([
    supabase.from("content_items").select("status, review_note, data").eq("id", id).maybeSingle<{ status: Status; review_note: string | null; data: Omit<ContentItem, "status"> }>(),
    supabase.from("topics").select("key, name_en").order("sort_order"),
  ]);
  if (!row) notFound();
  const item = { ...row.data, status: row.status } as ContentItem;
  return (
    <>
      <section className="panel">
        <p>
          <Link href={`/admin/content/${id}`}>← Back to the item</Link>
        </p>
        <h1 lang={item.language}>Edit: {item.title}</h1>
        {row.review_note && row.status !== "published" && (
          <div className="message info" style={{ whiteSpace: "pre-line" }}>
            <strong>Review note:</strong>
            {"\n"}
            {row.review_note}
          </div>
        )}
      </section>
      <LessonEditor initial={toForm(item)} mode="edit" topics={topics ?? []} published={row.status === "published"} action={saveContentForm} />
    </>
  );
}

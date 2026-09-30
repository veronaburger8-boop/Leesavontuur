import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/lesson/lesson-player";
import { requireStaff } from "@/lib/auth";
import type { ContentItem, Lesson, Status } from "@/lib/content/types";
import { EYE_MODES, type EyeMode } from "@/lib/lesson/logic";

export const metadata = { title: "Preview" };

const MODE_LABELS: Record<EyeMode, string> = { lines: "Whole lines", groups: "Word groups", pacer: "Moving pacer" };

/** Plays an item exactly as a child sees it, step by step. Nothing is saved. */
export default async function PlayPreview({ params, searchParams }: PageProps<"/admin/content/[id]/play">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { supabase } = await requireStaff();
  const { data: row } = await supabase.from("content_items").select("status, data").eq("id", id).maybeSingle<{ status: Status; data: Omit<ContentItem, "status"> }>();
  if (!row) notFound();
  const item = { ...row.data, status: row.status } as ContentItem;
  const mode = (EYE_MODES as string[]).includes(String(sp.mode)) ? (sp.mode as EyeMode) : "lines";
  const wpm = Math.min(400, Math.max(20, Number(sp.wpm) || 100));

  return (
    <>
      <div className="preview-bar">
        <form className="row" style={{ alignItems: "center" }}>
          <strong>Preview – nothing is saved.</strong>
          <label>
            Eye exercise:{" "}
            <select name="mode" defaultValue={mode} style={{ width: "auto", fontSize: 16, padding: "4px 8px" }}>
              {EYE_MODES.map((m) => (
                <option key={m} value={m}>
                  {MODE_LABELS[m]}
                </option>
              ))}
            </select>
          </label>
          <label>
            at{" "}
            <input name="wpm" type="text" inputMode="numeric" defaultValue={wpm} style={{ width: 70, fontSize: 16, padding: "4px 8px" }} /> W/min
          </label>
          <button className="small" type="submit">
            Restart
          </button>
          <Link href={`/admin/content/${id}`}>← Back to review</Link>
        </form>
      </div>
      {item.type === "lesson" ? (
        <LessonPlayer key={`${mode}-${wpm}`} lesson={item as Lesson} learnerName="" readingWpm={wpm / 1.05} eyeMode={mode} backHref={`/admin/content/${id}`} preview />
      ) : (
        <p className="message info">Calibration passages get their own player in Phase 3.</p>
      )}
    </>
  );
}

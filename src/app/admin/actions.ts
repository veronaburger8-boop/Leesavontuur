"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { type ContentItem, type Status, STATUSES, wordCount } from "@/lib/content/types";
import { validateContentFile } from "@/lib/content/validate";

const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v.trim() : "");

/** Publish, send back to draft, mark for review or retire an item. Every change is logged by the database. */
export async function changeStatus(formData: FormData) {
  const { supabase } = await requireStaff();
  const id = str(formData.get("id"));
  const to = str(formData.get("to")) as Status;
  const note = str(formData.get("note")).slice(0, 2000) || null;
  const back = `/admin/content/${encodeURIComponent(id)}`;
  if (!STATUSES.includes(to)) redirect(`${back}?error=status`);
  if (to === "draft" && !note) redirect(`${back}?error=note`);
  const { error, count } = await supabase.from("content_items").update({ status: to, review_note: note }, { count: "exact" }).eq("id", id);
  if (error || count !== 1) redirect(`${back}?error=failed`);
  revalidatePath("/admin");
  redirect(`${back}?changed=${to}`);
}

export interface ImportState {
  done: boolean;
  message?: string;
  added: string[];
  replaced: string[];
  skipped: string[];
  errors: { id?: string; index: number; messages: string[] }[];
  warnings: { id: string; messages: string[] }[];
}

/** A fresh result for each import (never share the arrays between requests). */
const newState = (message?: string): ImportState => ({ done: true, message, added: [], replaced: [], skipped: [], errors: [], warnings: [] });

/** Saves the items in an uploaded file (section 9 format) to the content library. */
export async function importContent(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const { supabase } = await requireStaff();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return newState("Choose a file first.");

  let json: unknown;
  try {
    json = JSON.parse(await file.text());
  } catch {
    return newState("The file is not valid JSON.");
  }

  const { valid, errors } = validateContentFile(json);
  const state: ImportState = { ...newState(), errors };

  const { data: topics } = await supabase.from("topics").select("key");
  const topicKeys = new Set((topics ?? []).map((t) => t.key as string));
  const items: ContentItem[] = [];
  valid.forEach(({ item, warnings }, index) => {
    if (item.topic && !topicKeys.has(item.topic)) {
      state.errors.push({ index, id: item.id, messages: [`unknown topic "${item.topic}"`] });
      return;
    }
    if (warnings.length) state.warnings.push({ id: item.id, messages: warnings });
    items.push(item);
  });

  const replace = formData.get("replace") === "yes";
  const statusChoice = str(formData.get("status"));
  const ids = items.map((i) => i.id);
  const { data: existingRows } = ids.length ? await supabase.from("content_items").select("id").in("id", ids) : { data: [] };
  const existing = new Set((existingRows ?? []).map((r) => r.id as string));

  const rows = [];
  for (const item of items) {
    if (existing.has(item.id) && !replace) {
      state.skipped.push(item.id);
      continue;
    }
    (existing.has(item.id) ? state.replaced : state.added).push(item.id);
    // Items with warnings never go live straight from an import.
    let status: Status = statusChoice === "draft" || statusChoice === "in_review" ? statusChoice : item.status;
    if (status === "published" && state.warnings.some((w) => w.id === item.id)) status = "in_review";
    // The status and review note live in their own columns; `data` holds the content.
    const data: Partial<ContentItem> = { ...item };
    delete data.status;
    delete data.reviewNote;
    const reviewNote = item.reviewNote;
    rows.push({
      id: item.id,
      type: item.type,
      language: item.language,
      level: item.level,
      topic: item.topic,
      status,
      title: item.title,
      sequence: item.sequence ?? null,
      word_count: wordCount(item.passage),
      data,
      review_note: reviewNote ?? (status === "published" ? "Imported" : null),
    });
  }

  if (rows.length) {
    const { error } = await supabase.from("content_items").upsert(rows);
    if (error) return { ...state, added: [], replaced: [], message: `Nothing was saved: ${error.message}` };
  }
  revalidatePath("/admin");
  state.message = `Saved ${rows.length} item(s).`;
  return state;
}

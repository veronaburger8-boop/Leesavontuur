"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugify } from "@/lib/articles/format";
import { requireStaff } from "@/lib/auth";
import { type PictureEntry, parsePictureFile } from "@/lib/pictures/cards";
import { attachPicture, detachPicture, download } from "@/lib/pictures/store";
import { type ContentItem, type Status, STATUSES, wordCount } from "@/lib/content/types";
import { aiConfigured, draftLessons } from "@/lib/content/draft";
import { type Draft, draftToLesson, estimateCost } from "@/lib/content/draft-map";
import { type EditorForm, fromForm, makeId } from "@/lib/content/editor";
import { checkItem } from "@/lib/content/parse-source";
import { contentItemSchema, validateContentFile } from "@/lib/content/validate";

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
  const { data: existingRows } = ids.length ? await supabase.from("content_items").select("id, data").in("id", ids) : { data: [] };
  const existing = new Set((existingRows ?? []).map((r) => r.id as string));
  // Pictures added on the site are kept when an item is replaced by an import.
  const oldPictures = new Map<string, Map<string, string>>();
  for (const r of existingRows ?? []) {
    const cards = ((r.data as { wordCards?: { word: string; image: string | null }[] }).wordCards ?? []).filter((c) => c.image);
    oldPictures.set(r.id as string, new Map(cards.map((c) => [c.word.trim().toLowerCase(), c.image as string])));
  }

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
    const kept = oldPictures.get(item.id);
    if (kept?.size && item.type === "lesson")
      item.wordCards = item.wordCards.map((c) => (c.image ? c : { ...c, image: kept.get(c.word.trim().toLowerCase()) ?? null }));
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

/** Saves the thresholds (admin only; the database refuses anyone else). */
export async function saveSettings(formData: FormData) {
  const { supabase } = await requireStaff();
  const { data } = await supabase.from("app_settings").select("key");
  for (const { key } of data ?? []) {
    const raw = str(formData.get(key));
    const value = Number(raw);
    if (!/^\d+$/.test(raw) || value < 0 || value > 100) redirect("/admin/settings?error=1");
  }
  for (const { key } of data ?? []) {
    const { error } = await supabase.from("app_settings").update({ value: Number(str(formData.get(key))), updated_at: new Date().toISOString() }).eq("key", key);
    if (error) redirect("/admin/settings?error=1");
  }
  redirect("/admin/settings?saved=1");
}

// ---------------------------------------------------------------- topics and topic requests

/** A topic key from its English name, e.g. "Horses and ponies" → "horses-and-ponies". */
function topicKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

const backTo = (formData: FormData, fallback: string) => {
  const b = str(formData.get("back"));
  return b.startsWith("/admin") ? b : fallback;
};

const withParam = (url: string, param: string) => `${url}${url.includes("?") ? "&" : "?"}${param}`;

/** Adds a topic (admin only; the database refuses anyone else). Returns its key. */
async function createTopic(supabase: Awaited<ReturnType<typeof requireStaff>>["supabase"], nameEn: string, nameAf: string) {
  const key = topicKey(nameEn);
  if (!key || !nameAf) return { key: null, error: "names" };
  const { data: last } = await supabase.from("topics").select("sort_order").order("sort_order", { ascending: false }).limit(1);
  const { error } = await supabase.from("topics").insert({ key, name_en: nameEn, name_af: nameAf, sort_order: ((last?.[0]?.sort_order as number) ?? 0) + 1 });
  if (error) return { key: null, error: /duplicate/.test(error.message) ? "exists" : "failed" };
  return { key, error: null };
}

export async function addTopic(formData: FormData) {
  const { supabase } = await requireStaff();
  const back = backTo(formData, "/admin/topics");
  const { error } = await createTopic(supabase, str(formData.get("name_en")).slice(0, 60), str(formData.get("name_af")).slice(0, 60));
  revalidatePath("/admin/topics");
  redirect(withParam(back, error ? `error=${error}` : "added=1"));
}

export async function setTopicActive(formData: FormData) {
  const { supabase } = await requireStaff();
  await supabase.from("topics").update({ active: formData.get("active") === "yes" }).eq("key", str(formData.get("key")));
  revalidatePath("/admin/topics");
  redirect("/admin/topics");
}

const requestIds = (formData: FormData) =>
  str(formData.get("ids"))
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);

/** Links a group of requests to a topic (an existing one, or a new one made here). */
export async function linkRequests(formData: FormData) {
  const { supabase } = await requireStaff();
  const ids = requestIds(formData);
  let topic = str(formData.get("topic"));
  if (topic === "new") {
    const made = await createTopic(supabase, str(formData.get("name_en")).slice(0, 60), str(formData.get("name_af")).slice(0, 60));
    if (!made.key) redirect(`/admin/requests?error=${made.error}`);
    topic = made.key;
  }
  if (!ids.length || !/^[a-z0-9-]+$/.test(topic)) redirect("/admin/requests?error=failed");
  const { error } = await supabase.from("topic_requests").update({ topic }).in("id", ids).in("status", ["received", "preparing"]);
  if (error) redirect("/admin/requests?error=failed");
  revalidatePath("/admin/requests");
  redirect("/admin/requests?linked=1");
}

/** Declines a group of requests with an optional short reply; the parents are told on the site. */
export async function declineRequests(formData: FormData) {
  const { supabase } = await requireStaff();
  const ids = requestIds(formData);
  const reply = str(formData.get("reply")).slice(0, 300) || null;
  if (!ids.length) redirect("/admin/requests?error=failed");
  const { error } = await supabase.from("topic_requests").update({ status: "declined", reply }).in("id", ids).in("status", ["received", "preparing"]);
  if (error) redirect("/admin/requests?error=failed");
  revalidatePath("/admin/requests");
  redirect("/admin/requests?declined=1");
}

// ---------------------------------------------------------------- the lesson form

export interface EditorState {
  errors: string[];
}

/**
 * Saves the lesson form. A new item is saved as a Draft; an existing item
 * keeps its status (a published item changes for children straight away).
 */
export async function saveContentForm(_prev: EditorState, formData: FormData): Promise<EditorState> {
  const { supabase } = await requireStaff();
  let form: EditorForm;
  try {
    form = JSON.parse(str(formData.get("form"))) as EditorForm;
  } catch {
    return { errors: ["The form could not be read. Please try again."] };
  }
  const isNew = formData.get("mode") === "new";
  if (isNew) {
    const base = makeId(form.language, form.level, form.title);
    const { data: taken } = await supabase.from("content_items").select("id").like("id", `${base}%`);
    const ids = new Set((taken ?? []).map((r) => r.id as string));
    let id = base;
    for (let n = 2; ids.has(id); n++) id = `${base}-${n}`;
    const { data: last } = await supabase
      .from("content_items")
      .select("sequence")
      .eq("language", form.language)
      .eq("level", form.level)
      .eq("type", form.type)
      .order("sequence", { ascending: false, nullsFirst: false })
      .limit(1);
    form = { ...form, id, sequence: ((last?.[0]?.sequence as number | null) ?? 0) + 1 };
  }

  const parsed = contentItemSchema.safeParse({ ...fromForm(form), status: "draft" });
  if (!parsed.success) {
    return { errors: parsed.error.issues.map((i) => `${i.path.join(" › ") || "item"}: ${i.message}`) };
  }
  const item = parsed.data as ContentItem;
  const data: Partial<ContentItem> = { ...item };
  delete data.status;
  delete data.reviewNote;
  const row = {
    type: item.type,
    language: item.language,
    level: item.level,
    topic: item.topic,
    title: item.title,
    sequence: item.sequence ?? null,
    word_count: wordCount(item.passage),
    data,
  };
  const { error } = isNew
    ? await supabase.from("content_items").insert({ ...row, id: item.id, status: "draft", review_note: "Written in the admin area" })
    : await supabase.from("content_items").update(row).eq("id", item.id);
  if (error) return { errors: [`Nothing was saved: ${error.message}`] };
  revalidatePath("/admin");
  redirect(`/admin/content/${item.id}?saved=1`);
}

// ---------------------------------------------------------------- Draft with AI

export interface DraftState {
  done: boolean;
  saved: { id: string; title: string; warnings: string[] }[];
  errors: string[];
  cost: number | null;
}

/** "Draft passages": Claude writes lessons from the writing guide; they are saved as Drafts only. */
export async function draftWithAI(_prev: DraftState, formData: FormData): Promise<DraftState> {
  const { supabase } = await requireStaff();
  const fail = (message: string): DraftState => ({ done: true, saved: [], errors: [message], cost: null });
  if (!aiConfigured()) return fail("AI drafting is not set up yet (no ANTHROPIC_API_KEY).");
  const language = str(formData.get("language")) === "en" ? "en" : "af";
  const level = Number(formData.get("level"));
  const count = Number(formData.get("count"));
  if (!Number.isInteger(level) || level < 1 || level > 15 || !Number.isInteger(count) || count < 1 || count > 5) return fail("Choose a level and 1 to 5 lessons.");
  const { data: topic } = await supabase.from("topics").select("key, name_en, name_af").eq("key", str(formData.get("topic"))).maybeSingle();
  if (!topic) return fail("Choose a topic.");

  const { data: existing } = await supabase.from("content_items").select("id, title, sequence").eq("language", language).eq("level", level).eq("type", "lesson");
  const ids = new Set((existing ?? []).map((e) => e.id as string));
  let sequence = Math.max(0, ...(existing ?? []).map((e) => (e.sequence as number | null) ?? 0));
  const state: DraftState = { done: true, saved: [], errors: [], cost: null };
  const today = new Date().toLocaleDateString("en-ZA", { dateStyle: "medium", timeZone: "Africa/Johannesburg" });

  // Saves each lesson as soon as it is written.
  const save = async (draft: Draft) => {
    const lesson = draftToLesson(draft, language, level, topic.key, ++sequence);
    const base = lesson.id;
    const { data: taken } = await supabase.from("content_items").select("id").like("id", `${base}%`);
    for (const t of taken ?? []) ids.add(t.id as string);
    for (let n = 2; ids.has(lesson.id); n++) lesson.id = `${base}-${n}`;
    ids.add(lesson.id);

    const parsed = contentItemSchema.safeParse(lesson);
    if (!parsed.success) {
      state.errors.push(`“${lesson.title}” could not be saved: ${parsed.error.issues.map((i) => `${i.path.join(" › ")}: ${i.message}`).join("; ")}`);
      return;
    }
    const warnings = checkItem(lesson);
    const data: Partial<ContentItem> = { ...lesson };
    delete data.status;
    const { error } = await supabase.from("content_items").insert({
      id: lesson.id,
      type: "lesson",
      language,
      level,
      topic: topic.key,
      status: "draft",
      title: lesson.title,
      sequence: lesson.sequence,
      word_count: wordCount(lesson.passage),
      data,
      review_note: [`Drafted with AI on ${today}. Read every part carefully before publishing.`, ...warnings].join("\n"),
    });
    if (error) state.errors.push(`“${lesson.title}” could not be saved: ${error.message}`);
    else state.saved.push({ id: lesson.id, title: lesson.title, warnings });
  };

  const result = await draftLessons({ language, level, topic, count, existingTitles: (existing ?? []).map((e) => e.title as string) }, save);
  state.errors.unshift(...result.errors);
  state.cost = estimateCost(result.inputTokens, result.outputTokens);

  await supabase.from("draft_runs").insert({
    language,
    level,
    topic: topic.key,
    requested: count,
    saved: state.saved.length,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    error: state.errors.join("\n").slice(0, 2000) || null,
  });
  revalidatePath("/admin");
  return state;
}

// ---------------------------------------------------------------- About reading articles

/** Saves an article (new ones as Drafts). Publishing is a separate button. */
export async function saveArticle(formData: FormData) {
  const { supabase } = await requireStaff();
  const id = Number(formData.get("id")) || null;
  const title = str(formData.get("title")).slice(0, 120);
  const slug = slugify(str(formData.get("slug")) || title);
  const fields = {
    title,
    slug,
    language: str(formData.get("language")) === "en" ? "en" : "af",
    summary: str(formData.get("summary")).slice(0, 300),
    body: String(formData.get("body") ?? "").replace(/\r\n?/g, "\n").trim().slice(0, 20000),
    sort_order: Number(formData.get("sort_order")) || 0,
  };
  const back = id ? `/admin/articles/${id}` : "/admin/articles/new";
  if (!title || !slug) redirect(`${back}?error=title`);
  const { data, error } = id
    ? await supabase.from("articles").update(fields).eq("id", id).select("id").single()
    : await supabase.from("articles").insert({ ...fields, status: "draft" }).select("id").single();
  if (error) redirect(`${back}?error=${/duplicate|unique/.test(error.message) ? "slug" : "failed"}`);
  revalidatePath("/articles");
  redirect(`/admin/articles/${data.id}?saved=1`);
}

export async function setArticleStatus(formData: FormData) {
  const { supabase } = await requireStaff();
  const id = Number(formData.get("id"));
  const status = formData.get("status") === "published" ? "published" : "draft";
  const { error } = await supabase.from("articles").update({ status }).eq("id", id);
  revalidatePath("/articles");
  redirect(`/admin/articles/${id}?${error ? "error=failed" : `status=${status}`}`);
}

// ---------------------------------------------------------------- word-card pictures

export interface PictureResult {
  lessonId: string;
  word: string;
  ok: boolean;
  error?: string;
}

/** Saves pictures from a pictures file the admin has checked (downloaded from the image generator). */
export async function importPictures(entries: PictureEntry[]): Promise<PictureResult[]> {
  const { supabase } = await requireStaff();
  const { entries: valid, problems } = parsePictureFile(entries);
  const results: PictureResult[] = problems.map((p) => ({ lessonId: "-", word: "-", ok: false, error: p }));
  // A few at a time, so the database isn't asked to change one lesson twice at once.
  const byLesson = new Map<string, PictureEntry[]>();
  for (const e of valid.slice(0, 200)) byLesson.set(e.lessonId, [...(byLesson.get(e.lessonId) ?? []), e]);
  const lessons = [...byLesson.values()];
  for (let i = 0; i < lessons.length; i += 4) {
    await Promise.all(
      lessons.slice(i, i + 4).map(async (list) => {
        for (const e of list) {
          try {
            await attachPicture(supabase, e.lessonId, e.word, await download(e.url), e.url);
            results.push({ lessonId: e.lessonId, word: e.word, ok: true });
          } catch (err) {
            results.push({ lessonId: e.lessonId, word: e.word, ok: false, error: err instanceof Error ? err.message : "Failed." });
          }
        }
      }),
    );
  }
  revalidatePath("/admin/pictures");
  return results;
}

/** Uploads one picture from the admin's computer for a word card. */
export async function uploadPicture(formData: FormData) {
  const { supabase } = await requireStaff();
  const lessonId = str(formData.get("lessonId"));
  const word = str(formData.get("word"));
  const file = formData.get("file");
  const back = `/admin/pictures?${new URLSearchParams({ show: str(formData.get("show")) || "missing" })}`;
  if (!(file instanceof File) || file.size === 0 || file.size > 4 * 1024 * 1024 || !file.type.startsWith("image/")) redirect(`${back}&error=file`);
  try {
    await attachPicture(supabase, lessonId, word, Buffer.from(await file.arrayBuffer()), file.name);
  } catch {
    redirect(`${back}&error=failed`);
  }
  revalidatePath("/admin/pictures");
  redirect(`${back}&saved=1#${encodeURIComponent(lessonId)}`);
}

export async function removePicture(formData: FormData) {
  const { supabase } = await requireStaff();
  const lessonId = str(formData.get("lessonId"));
  const back = `/admin/pictures?${new URLSearchParams({ show: str(formData.get("show")) || "all" })}`;
  try {
    await detachPicture(supabase, lessonId, str(formData.get("word")));
  } catch {
    redirect(`${back}&error=failed`);
  }
  revalidatePath("/admin/pictures");
  redirect(`${back}&removed=1#${encodeURIComponent(lessonId)}`);
}

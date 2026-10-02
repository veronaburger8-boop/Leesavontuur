import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import sharp from "sharp";
import type { Lesson, WordCard } from "@/lib/content/types";
import { allowedPictureUrl, pictureId, withPicture } from "./cards";

const MAX_BYTES = 10 * 1024 * 1024;

/** Makes a picture small for phones: at most 480 × 480, white background, WebP. */
export async function shrink(input: Buffer): Promise<Buffer> {
  return sharp(input, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize(480, 480, { fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" })
    .webp({ quality: 80 })
    .toBuffer();
}

/** Downloads a picture from the image generator (allowed addresses only). */
export async function download(url: string): Promise<Buffer> {
  if (!allowedPictureUrl(url)) throw new Error("This picture address is not allowed.");
  const res = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Could not download the picture (${res.status}).`);
  if (!(res.headers.get("content-type") ?? "").startsWith("image/")) throw new Error("The address is not a picture.");
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > MAX_BYTES) throw new Error("The picture is too big.");
  return buf;
}

/**
 * Stores a picture and puts it on the word card for `word` in a lesson. The
 * lesson's status doesn't change; a picture it replaces is removed.
 */
export async function attachPicture(supabase: SupabaseClient, lessonId: string, word: string, image: Buffer, source: string): Promise<void> {
  const { data: row } = await supabase.from("content_items").select("data").eq("id", lessonId).maybeSingle<{ data: Omit<Lesson, "status"> }>();
  if (!row || row.data.type !== "lesson") throw new Error("Lesson not found.");
  const cards = row.data.wordCards as WordCard[];
  if (!withPicture(cards, word, "check")) throw new Error(`The lesson has no word card “${word}”.`);

  const small = await shrink(image);
  const { data: pic, error } = await supabase
    .from("pictures")
    .insert({ data: small.toString("base64"), mime: "image/webp", source: source.slice(0, 500) })
    .select("id")
    .single();
  if (error || !pic) throw new Error(`The picture could not be saved: ${error?.message ?? "unknown error"}`);

  const old = pictureId(cards.find((c) => c.word.trim().toLowerCase() === word.trim().toLowerCase())?.image ?? null);
  const next = withPicture(cards, word, `/pictures/${pic.id}`)!;
  const { error: updateError } = await supabase.from("content_items").update({ data: { ...row.data, wordCards: next } }).eq("id", lessonId);
  if (updateError) {
    await supabase.from("pictures").delete().eq("id", pic.id);
    throw new Error(`The lesson could not be updated: ${updateError.message}`);
  }
  if (old) await supabase.from("pictures").delete().eq("id", old);
}

/** Removes the picture from a word card. */
export async function detachPicture(supabase: SupabaseClient, lessonId: string, word: string): Promise<void> {
  const { data: row } = await supabase.from("content_items").select("data").eq("id", lessonId).maybeSingle<{ data: Omit<Lesson, "status"> }>();
  if (!row || row.data.type !== "lesson") throw new Error("Lesson not found.");
  const cards = row.data.wordCards as WordCard[];
  const old = pictureId(cards.find((c) => c.word.trim().toLowerCase() === word.trim().toLowerCase())?.image ?? null);
  const next = withPicture(cards, word, null);
  if (!next) throw new Error(`The lesson has no word card “${word}”.`);
  const { error } = await supabase.from("content_items").update({ data: { ...row.data, wordCards: next } }).eq("id", lessonId);
  if (error) throw new Error(error.message);
  if (old) await supabase.from("pictures").delete().eq("id", old);
}

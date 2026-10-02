// Matching pictures to word cards. Kept free of server code so it can be tested.

import type { WordCard } from "@/lib/content/types";

const norm = (s: string) => s.normalize("NFC").trim().toLowerCase();

/** Position of the card for a word in a lesson's word cards, or -1. */
export function findCard(cards: WordCard[], word: string): number {
  return cards.findIndex((c) => norm(c.word) === norm(word));
}

/** The cards with a picture set (or removed) for one word; the other cards are unchanged. */
export function withPicture(cards: WordCard[], word: string, image: string | null): WordCard[] | null {
  const i = findCard(cards, word);
  if (i < 0) return null;
  return cards.map((c, k) => (k === i ? { ...c, image } : c));
}

/** The picture id from a card's image address "/pictures/<id>", or null for other addresses. */
export function pictureId(image: string | null): string | null {
  const m = /^\/pictures\/([0-9a-f-]{36})$/.exec(image ?? "");
  return m ? m[1] : null;
}

export interface PictureEntry {
  lessonId: string;
  word: string;
  url: string;
}

/** Only pictures from the image generator's own address are fetched by the site. */
export const ALLOWED_PICTURE_HOSTS = ["d8j0ntlcm91z4.cloudfront.net"];

export function allowedPictureUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && ALLOWED_PICTURE_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

/** Reads a pictures file: a list of { lessonId, word, url }. Returns the entries and the problems. */
export function parsePictureFile(json: unknown): { entries: PictureEntry[]; problems: string[] } {
  const entries: PictureEntry[] = [];
  const problems: string[] = [];
  if (!Array.isArray(json)) return { entries, problems: ["The file must contain a list of pictures."] };
  json.forEach((raw, i) => {
    const r = raw as Partial<PictureEntry> | null;
    if (!r || typeof r.lessonId !== "string" || typeof r.word !== "string" || typeof r.url !== "string") {
      problems.push(`Item ${i + 1}: needs lessonId, word and url.`);
      return;
    }
    if (!allowedPictureUrl(r.url)) {
      problems.push(`Item ${i + 1} (${r.word}): the picture address is not allowed.`);
      return;
    }
    entries.push({ lessonId: r.lessonId, word: r.word, url: r.url });
  });
  return { entries, problems };
}

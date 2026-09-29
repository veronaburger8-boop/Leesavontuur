// Checks uploaded content files (admin Import) against the data format in
// section 9 of the brief before anything is saved.

import { z } from "zod";
import { checkItem } from "./parse-source";
import type { ContentItem } from "./types";

const text = z.string().trim().min(1);

const multipleChoice = z
  .object({
    question: text,
    options: z.array(text).min(2),
    answer: z.number().int().min(0),
    thinking: z.boolean().default(false),
  })
  .refine((q) => q.answer < q.options.length, { message: "answer must point to one of the options" });

const wordCard = z.object({
  word: text,
  definitions: z.array(text).min(1),
  example: z.string(),
  forms: z.string().nullable().default(null),
  translation: z.string(),
  image: z.string().nullable().default(null),
  imageNote: z.string().nullable().default(null),
  extra: z.boolean().default(false),
});

const grammarItem = z
  .object({
    prompt: text,
    accepted: z.array(text).min(1).optional(),
    blanks: z.array(z.array(text).min(1)).min(2).optional(),
    choices: z.array(text).min(2).optional(),
    note: z.string().optional(),
  })
  .refine((g) => Boolean(g.accepted) !== Boolean(g.blanks), { message: "a grammar item needs either accepted or blanks" });

const base = {
  id: z.string().regex(/^[a-z0-9-]+$/, "id may only contain a–z, 0–9 and dashes"),
  language: z.enum(["af", "en"]),
  level: z.number().int().min(1).max(15),
  status: z.enum(["draft", "in_review", "published", "retired"]).default("draft"),
  title: text,
  sequence: z.number().int().min(1).optional(),
  layout: z.enum(["lines", "paragraphs"]),
  passage: z.array(text).min(1),
  comprehension: z.array(multipleChoice).min(1),
  spelling: z.array(text).min(1),
  reviewNote: z.string().optional(),
};

const lesson = z.object({
  ...base,
  type: z.literal("lesson"),
  topic: z.string().regex(/^[a-z0-9-]+$/),
  wordCards: z.array(wordCard),
  extraWords: z.array(text).default([]),
  grammar: z.object({
    focus: text,
    instruction: z.string(),
    instructionNote: z.string().optional(),
    items: z.array(grammarItem).min(1),
  }),
  vocabulary: z.array(
    z
      .object({ sentence: text, options: z.array(text).min(2), answer: z.number().int().min(0) })
      .refine((v) => v.answer < v.options.length, { message: "answer must point to one of the options" }),
  ),
});

const calibration = z.object({ ...base, type: z.literal("calibration"), topic: z.null().default(null) });

export const contentItemSchema = z.discriminatedUnion("type", [lesson, calibration]);

export interface ValidatedItem {
  item: ContentItem;
  /** Problems that do not stop saving, e.g. 4 questions instead of 5. */
  warnings: string[];
}

export interface ValidationResult {
  valid: ValidatedItem[];
  errors: { index: number; id?: string; messages: string[] }[];
}

/** Validates the contents of an uploaded file: one item or a list of items. */
export function validateContentFile(json: unknown): ValidationResult {
  const list = Array.isArray(json) ? json : [json];
  const result: ValidationResult = { valid: [], errors: [] };
  const seen = new Set<string>();
  list.forEach((raw, index) => {
    const parsed = contentItemSchema.safeParse(raw);
    const id = typeof raw === "object" && raw && "id" in raw ? String((raw as { id: unknown }).id) : undefined;
    if (!parsed.success) {
      result.errors.push({
        index,
        id,
        messages: parsed.error.issues.map((i) => `${i.path.join(".") || "item"}: ${i.message}`),
      });
      return;
    }
    const item = parsed.data as ContentItem;
    if (seen.has(item.id)) {
      result.errors.push({ index, id: item.id, messages: ["this id appears more than once in the file"] });
      return;
    }
    seen.add(item.id);
    result.valid.push({ item, warnings: checkItem(item) });
  });
  return result;
}

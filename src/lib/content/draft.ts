import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";
import { type Draft, draftSchema, ideasSchema } from "./draft-map";
import { BENCHMARKS, type Language } from "./types";
import { WRITING_GUIDE } from "./writing-guide";

// "Draft passages" (brief, section 6): Claude writes new lessons from the
// writing guide. The results are saved as Drafts only; nothing goes live
// until the admin publishes it. The API key lives in the ANTHROPIC_API_KEY
// environment variable on the server (Vercel), never in the code or browser.

const MODEL = "claude-opus-5-5";

export const aiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);

export interface DraftRequest {
  language: Language;
  level: number;
  topic: { key: string; name_en: string; name_af: string };
  count: number;
  /** Titles already used at this language and level, so topics and stories aren't repeated. */
  existingTitles: string[];
}

export interface DraftResult {
  drafts: Draft[];
  errors: string[];
  inputTokens: number;
  outputTokens: number;
}

const languageName = (l: Language) => (l === "af" ? "Afrikaans" : "South African English");

function system(): string {
  return `You write reading lessons for Leesavontuur, a reading program for South African children (English and Afrikaans). An experienced teacher checks every lesson before children see it.

Follow this writing guide exactly:

${WRITING_GUIDE}

Output rules:
- Write everything a child reads (passage, word cards, questions, options, grammar, vocabulary) in the lesson's language only. Only the word card "translation" is in the other language.
- Afrikaans: standard spelling with the correct diacritics (ê, ë, ô, û, ï) and 'n.
- "passage": one sentence per entry for Levels 1–3; one paragraph per entry for Levels 4 and up.
- Word cards: "definitions" has 1–2 short sentences; "forms" gives plural, verb forms or an opposite, or null; "imageNote" describes a simple picture for Levels 1–2, otherwise null; "extra": true only for the extra support cards.
- Comprehension: "answer" is the position of the correct option counting from 0, and the position varies between questions. "thinking": true for the thinking questions (answer inferred, not stated), and the number of thinking questions matches the level.
- "spelling": 10 words, all of which appear in the passage, including the word card words.
- Grammar: 5 items with one focus that fits the level. "accepted" lists every correct answer. Use "secondBlank" only when an item has two answers (e.g. min – minder – minste), otherwise an empty list. Use "choices" only when the child picks from given words (e.g. their / there, or F / O for fact or opinion), otherwise an empty list.
- Vocabulary: 5 new sentences (not from the passage), each with "______" for the missing word and 4 near-miss options, exactly one of which fits.`;
}

async function ask<S extends z.ZodType>(
  client: Anthropic,
  schema: S,
  prompt: string,
  maxTokens: number,
  effort: "medium" | "high",
): Promise<{ value: z.infer<S>; input: number; output: number }> {
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: maxTokens,
    // If a safety check declines the request, the API retries it on a suitable model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort, format: betaZodOutputFormat(schema) },
    system: system(),
    messages: [{ role: "user", content: prompt }],
  });
  const message = await stream.finalMessage();
  const input = message.usage.input_tokens + (message.usage.cache_read_input_tokens ?? 0) + (message.usage.cache_creation_input_tokens ?? 0);
  const output = message.usage.output_tokens;
  if (message.stop_reason === "refusal") throw new DraftError("Claude declined to write this. Try a different topic or wording.", input, output);
  if (message.stop_reason === "max_tokens") throw new DraftError("The answer was cut off (too long). Please try again.", input, output);
  const text = message.content.map((b) => (b.type === "text" ? b.text : "")).join("");
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new DraftError("Claude's answer could not be read. Please try again.", input, output);
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new DraftError("Claude's answer was not in the expected format. Please try again.", input, output);
  return { value: parsed.data, input, output };
}

class DraftError extends Error {
  constructor(
    message: string,
    readonly input = 0,
    readonly output = 0,
  ) {
    super(message);
  }
}

/** A plain explanation of what went wrong, for the admin. */
function explain(e: unknown): string {
  if (e instanceof DraftError) return e.message;
  if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError)
    return "The Anthropic API key was not accepted. Check ANTHROPIC_API_KEY in Vercel.";
  if (e instanceof Anthropic.RateLimitError) return "Too many requests at once. Please wait a minute and try again.";
  if (e instanceof Anthropic.BadRequestError && /credit/i.test(e.message)) return "The Anthropic account has run out of credit. Add credit in the Anthropic Console.";
  if (e instanceof Anthropic.APIError) return `The Claude API returned an error (${e.status ?? "no status"}). Please try again later.`;
  if (e instanceof Anthropic.APIConnectionError) return "Could not reach the Claude API. Please try again.";
  return "Something went wrong while drafting. Please try again.";
}

/**
 * Plans distinct story ideas, then writes each lesson (at the same time).
 * `onDraft` is called as soon as each lesson is written, so it can be saved
 * straight away even if the others take longer.
 */
export async function draftLessons(req: DraftRequest, onDraft: (draft: Draft) => Promise<void>): Promise<DraftResult> {
  // The page may run for 5 minutes at most, so no slow retries.
  const client = new Anthropic({ maxRetries: 1, timeout: 240_000 });
  const result: DraftResult = { drafts: [], errors: [], inputTokens: 0, outputTokens: 0 };
  const bench = BENCHMARKS[req.level];
  const where = `${languageName(req.language)}, Level ${req.level}, topic "${req.topic.name_en}" (${req.topic.name_af})`;
  const used = req.existingTitles.length ? req.existingTitles.map((t) => `- ${t}`).join("\n") : "(none yet)";

  let ideas: { title: string; idea: string }[];
  try {
    const r = await ask(
      client,
      ideasSchema,
      `Plan ${req.count} new lessons: ${where}.
Give each a title in ${languageName(req.language)} and a one-sentence idea. The ideas must differ clearly from each other and from these lessons already at this level:
${used}`,
      8000,
      "medium",
    );
    result.inputTokens += r.input;
    result.outputTokens += r.output;
    ideas = r.value.ideas.slice(0, req.count);
  } catch (e) {
    result.errors.push(explain(e));
    if (e instanceof DraftError) {
      result.inputTokens += e.input;
      result.outputTokens += e.output;
    }
    return result;
  }

  const written = await Promise.allSettled(
    ideas.map(async (idea) => {
      const r = await ask(
        client,
        draftSchema,
        `Write one complete lesson: ${where}.
Title: ${idea.title}
Idea: ${idea.idea}
Level ${req.level} benchmark: about ${bench?.words ?? "?"} words, average sentence ${bench?.sentence ?? "?"}, word cards ${bench?.wordCards ?? "?"}, ${bench?.thinking ?? 0} thinking question(s).`,
        32000,
        "high",
      );
      await onDraft(r.value);
      return r;
    }),
  );
  written.forEach((w, i) => {
    if (w.status === "fulfilled") {
      result.drafts.push(w.value.value);
      result.inputTokens += w.value.input;
      result.outputTokens += w.value.output;
    } else {
      result.errors.push(`“${ideas[i].title}”: ${explain(w.reason)}`);
      if (w.reason instanceof DraftError) {
        result.inputTokens += w.reason.input;
        result.outputTokens += w.reason.output;
      }
    }
  });
  return result;
}

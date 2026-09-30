// Tests the database access rules on a plain PostgreSQL server.
//
// Run with: TEST_DATABASE_URL=postgres://postgres@localhost/leesavontuur_test npm test
// The database is wiped and rebuilt from the migrations, so point this at a
// throwaway database only. Without TEST_DATABASE_URL these tests are skipped.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.TEST_DATABASE_URL;
const dir = join(__dirname, "..");

describe.skipIf(!url)("database access rules", () => {
  const db = new Client({ connectionString: url });
  const ids = {
    parentA: "00000000-0000-0000-0000-00000000000a",
    parentB: "00000000-0000-0000-0000-00000000000b",
    admin: "00000000-0000-0000-0000-0000000000ad",
  };

  /** Runs queries as a signed-in user (or anonymous visitor), then rolls back unless `commit`. */
  async function as<T>(who: string | null, fn: (q: Client["query"]) => Promise<T>, commit = false): Promise<T> {
    await db.query("begin");
    try {
      await db.query(`set local role ${who ? "authenticated" : "anon"}`);
      await db.query("select set_config('request.jwt.claim.sub', $1, true)", [who ?? ""]);
      const result = await fn(db.query.bind(db) as Client["query"]);
      await db.query(commit ? "commit" : "rollback");
      return result;
    } catch (e) {
      await db.query("rollback");
      throw e;
    }
  }

  beforeAll(async () => {
    await db.connect();
    await db.query("drop schema if exists public cascade; drop schema if exists auth cascade; create schema public;");
    await db.query("drop type if exists public.user_role cascade");
    await db.query(readFileSync(join(dir, "tests/supabase-shim.sql"), "utf8"));
    for (const f of readdirSync(join(dir, "migrations")).sort()) await db.query(readFileSync(join(dir, "migrations", f), "utf8"));

    const meta = JSON.stringify({ display_name: "Ouer", locale: "af", privacy_version: "2026-09" });
    for (const [key, id] of Object.entries(ids))
      await db.query("insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)", [id, `${key}@example.com`, meta]);
    await db.query("update public.profiles set role = 'admin' where id = $1", [ids.admin]);

    const item = (id: string, status: string) =>
      db.query(
        `insert into public.content_items (id, type, language, level, topic, status, title, data)
         values ($1, 'lesson', 'af', 1, 'animals', $2, $1, '{}')`,
        [id, status],
      );
    await item("published-item", "published");
    await item("review-item", "in_review");
    await item("draft-item", "draft");
    await item("retired-item", "retired");
    await item("lesson-two", "published");
  });

  afterAll(async () => {
    await db.end();
  });

  it("creates a profile with the privacy consent on sign-up", async () => {
    const { rows } = await db.query("select role, locale, privacy_version, privacy_accepted_at from public.profiles where id = $1", [ids.parentA]);
    expect(rows[0]).toMatchObject({ role: "parent", locale: "af", privacy_version: "2026-09" });
    expect(rows[0].privacy_accepted_at).not.toBeNull();
  });

  it("shows parents only published content", async () => {
    const rows = await as(ids.parentA, async (q) => (await q("select id from public.content_items order by id")).rows);
    expect(rows.map((r) => r.id)).toEqual(["lesson-two", "published-item"]);
  });

  it("does not show unpublished content even when asked for it by id", async () => {
    const rows = await as(ids.parentA, async (q) => (await q("select id from public.content_items where id = 'draft-item'")).rows);
    expect(rows).toHaveLength(0);
  });

  it("shows staff all content", async () => {
    const rows = await as(ids.admin, async (q) => (await q("select id from public.content_items")).rows);
    expect(rows).toHaveLength(5);
  });

  it("gives visitors who are not signed in no access at all", async () => {
    await expect(as(null, (q) => q("select id from public.content_items"))).rejects.toThrow(/permission denied/);
    await expect(as(null, (q) => q("select id from public.learners"))).rejects.toThrow(/permission denied/);
  });

  it("stops parents from adding or changing content", async () => {
    await expect(
      as(ids.parentA, (q) =>
        q(`insert into public.content_items (id, type, language, level, topic, status, title, data)
           values ('sneaky', 'lesson', 'af', 1, 'animals', 'published', 'x', '{}')`),
      ),
    ).rejects.toThrow(/row-level security/);
    const updated = await as(ids.parentA, async (q) => (await q("update public.content_items set status = 'published' where id = 'draft-item'")).rowCount);
    expect(updated).toBe(0);
  });

  it("stops parents from making themselves admin", async () => {
    await expect(as(ids.parentA, (q) => q("update public.profiles set role = 'admin' where id = $1", [ids.parentA]))).rejects.toThrow(
      /permission denied/,
    );
    const changed = await as(ids.parentA, async (q) => (await q("update public.profiles set locale = 'en' where id = $1", [ids.parentA])).rowCount);
    expect(changed).toBe(1);
  });

  it("keeps each family's children private", async () => {
    await as(
      ids.parentA,
      async (q) => {
        const { rows } = await q("insert into public.learners (name, grade) values ('Rone', 3) returning id");
        await q("insert into public.learner_languages (learner_id, language, level) values ($1, 'af', 3), ($1, 'en', 2)", [rows[0].id]);
      },
      true,
    );
    const own = await as(ids.parentA, async (q) => (await q("select name from public.learners")).rows);
    expect(own.map((r) => r.name)).toEqual(["Rone"]);
    const other = await as(ids.parentB, async (q) => (await q("select name from public.learners")).rows);
    expect(other).toHaveLength(0);
    const otherLanguages = await as(ids.parentB, async (q) => (await q("select * from public.learner_languages")).rows);
    expect(otherLanguages).toHaveLength(0);
    const staff = await as(ids.admin, async (q) => (await q("select name from public.learners")).rows);
    expect(staff).toHaveLength(0);
  });

  it("lets a parent add a child with levels in one step, but not a visitor", async () => {
    const levels = await as(ids.parentB, async (q) => {
      const { rows } = await q("select public.create_learner('Sipho', 2::smallint, 1::smallint, 2::smallint) as id");
      return (await q("select language, level from public.learner_languages where learner_id = $1 order by language", [rows[0].id])).rows;
    });
    expect(levels).toEqual([
      { language: "af", level: 1 },
      { language: "en", level: 2 },
    ]);
    await expect(as(null, (q) => q("select public.create_learner('X', null, 1::smallint, 1::smallint)"))).rejects.toThrow(/permission denied/);
  });

  it("stops a parent from adding a child to another account or moving one", async () => {
    await expect(
      as(ids.parentB, (q) => q("insert into public.learners (parent_id, name) values ($1, 'X')", [ids.parentA])),
    ).rejects.toThrow(/row-level security/);
    await expect(as(ids.parentA, (q) => q("update public.learners set parent_id = $1", [ids.parentB]))).rejects.toThrow(/permission denied/);
    const renamed = await as(ids.parentB, async (q) => (await q("update public.learners set name = 'Hacked'")).rowCount);
    expect(renamed).toBe(0);
  });

  it("records who published what, and when", async () => {
    await as(ids.admin, (q) => q("update public.content_items set status = 'published', review_note = 'Looks good' where id = 'review-item'"), true);
    const { rows } = await db.query("select published_by, published_at from public.content_items where id = 'review-item'");
    expect(rows[0].published_by).toBe(ids.admin);
    expect(rows[0].published_at).not.toBeNull();
    const log = await as(ids.admin, async (q) => (await q("select from_status, to_status, note, changed_by from public.content_status_log where content_id = 'review-item' order by id")).rows);
    expect(log.at(-1)).toEqual({ from_status: "in_review", to_status: "published", note: "Looks good", changed_by: ids.admin });
    const parentLog = await as(ids.parentA, async (q) => (await q("select * from public.content_status_log")).rows);
    expect(parentLog).toHaveLength(0);
  });

  it("hides retired content from parents", async () => {
    await as(ids.admin, (q) => q("update public.content_items set status = 'retired' where id = 'published-item'"), true);
    const rows = await as(ids.parentA, async (q) => (await q("select id from public.content_items")).rows);
    expect(rows.map((r) => r.id)).toEqual(["lesson-two", "review-item"]);
  });

  it("allows at most 2 children per family", async () => {
    await as(ids.parentB, (q) => q("insert into public.learners (name) values ('Lerato'), ('Thabo')"), true);
    await expect(as(ids.parentB, (q) => q("insert into public.learners (name) values ('Derde')"))).rejects.toThrow(/learner_limit/);
    await expect(as(ids.parentB, (q) => q("select public.create_learner('Derde', null, 1::smallint, 1::smallint)"))).rejects.toThrow(/learner_limit/);
  });

  const record = (learner: string, content: string, wpm: number, fast = false) =>
    `select public.record_lesson_result('${learner}', '${content}', ${wpm}, ${fast}, 80::smallint, 90::smallint, 100::smallint, 60::smallint, 'lines', 300)`;

  it("saves a finished lesson and the child's new reading speed", async () => {
    const rone = (await db.query("select id from public.learners where name = 'Rone'")).rows[0].id;
    await as(ids.parentA, (q) => q(record(rone, "lesson-two", 95)), true);
    const rows = await as(ids.parentA, async (q) => (await q("select content_title, words_per_minute, comprehension_pct, vocabulary_pct from public.lesson_results")).rows);
    expect(rows).toEqual([{ content_title: "lesson-two", words_per_minute: 95, comprehension_pct: 80, vocabulary_pct: 60 }]);
    const speed = await as(ids.parentA, async (q) => (await q("select reading_wpm from public.learner_languages where learner_id = $1 and language = 'af'", [rone])).rows[0].reading_wpm);
    expect(speed).toBe(95);
    // An impossibly fast reading is saved, but does not change the speed.
    await as(ids.parentA, (q) => q(record(rone, "lesson-two", 500, true)), true);
    const after = await as(ids.parentA, async (q) => (await q("select reading_wpm from public.learner_languages where learner_id = $1 and language = 'af'", [rone])).rows[0].reading_wpm);
    expect(after).toBe(95);
  });

  it("only saves results for your own child and for published lessons", async () => {
    const rone = (await db.query("select id from public.learners where name = 'Rone'")).rows[0].id;
    await expect(as(ids.parentB, (q) => q(record(rone, "lesson-two", 90)))).rejects.toThrow(/not_your_learner/);
    await expect(as(ids.parentA, (q) => q(record(rone, "draft-item", 90)))).rejects.toThrow(/not_published/);
    await expect(
      as(ids.parentA, (q) => q("insert into public.lesson_results (learner_id, content_title, content_type, language, level) values ($1, 'x', 'lesson', 'af', 1)", [rone])),
    ).rejects.toThrow(/permission denied/);
    const others = await as(ids.parentB, async (q) => (await q("select * from public.lesson_results")).rows);
    expect(others).toHaveLength(0);
    const staff = await as(ids.admin, async (q) => (await q("select * from public.lesson_results")).rows);
    expect(staff).toHaveLength(0);
  });

  it("deletes a family's children when the account is deleted", async () => {
    await db.query("delete from auth.users where id = $1", [ids.parentA]);
    const { rows } = await db.query("select count(*)::int as n from public.learners where parent_id = $1", [ids.parentA]);
    expect(rows[0].n).toBe(0);
    const results = await db.query("select count(*)::int as n from public.lesson_results");
    expect(results.rows[0].n).toBe(0);
  });
});

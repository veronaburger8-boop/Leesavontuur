# Leesavontuur

A reading program in Afrikaans and English for South African children. The full specification is in [PROJECT-BRIEF.md](PROJECT-BRIEF.md). Instructions for Claude Code are in [CLAUDE.md](CLAUDE.md).

**Status: Phase 1 (Foundation)** covers parent accounts, children's profiles, the content data model, the 130 imported passages and the admin content library.

## What's where

| Path | What it is |
| --- | --- |
| `content/lessons-source.md` | The lessons document (Markdown export). |
| `content/lessons.json` | The 130 passages converted to the data format (made by `npm run content:convert`). |
| `content/import-report.md` | **Read this first.** What the conversion found and what needs checking. |
| `supabase/migrations/` | The database: tables and access rules. |
| `src/app/` | The website pages. |
| `prototype/` | The approved one-lesson prototype. |

## Setting it up online (one time)

You need a **Supabase** account (database and logins) and a **Vercel** account (hosting). Both can be free while testing.

1. **Supabase:** create a new project. Choose the region closest to South Africa that's offered.
2. **Create the database:** in Supabase, open **SQL Editor**, paste the whole contents of `supabase/migrations/20260929134023_foundation.sql`, and press **Run**.
3. **Login settings:** in Supabase, go to **Authentication → URL Configuration**. Set **Site URL** to your website address (for example the `….vercel.app` address), and add `https://<your-address>/**` under **Redirect URLs**.
4. **Vercel:** import the GitHub repository as a new project, and add these **Environment Variables**. The values are under Supabase → **Project Settings → API Keys**:
   - `NEXT_PUBLIC_SUPABASE_URL`: the project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the publishable key
   - `SUPABASE_SECRET_KEY`: the secret key (**never** share this one)
   - `NEXT_PUBLIC_SITE_URL`: your website address
5. **Deploy**, then sign up on the site with your own email address.
6. **Make yourself admin:** in Supabase **SQL Editor**, run (with your email address):
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
7. **Import the lessons:** on the site, go to **Admin → Import** and upload `content/lessons.json`.

Supabase's built-in email is fine for testing but only sends a few emails an hour. Before real families sign up, connect an email service (Supabase → Authentication → Emails → SMTP).

## Trying out Phase 1

1. Open the site and choose **Skep 'n rekening**. Try it once *without* ticking the privacy box: it should refuse.
2. Add a child (**Voeg 'n kind by**). Pick a grade and a level for each language, and tick the consent box.
3. Edit the child and change a level. Press **English** at the top: the parent area switches language.
4. Under **My rekening**, download your family's data and have a look at the file.
5. Open **Admin** (after step 6 of the set-up). You should see 126 items **Published** and 4 **In review**.
6. Open an item that is in review (click the **In review** count). Read the review note and check the expanded questions. Then press **Publish**.
7. Open any lesson and press **Retire**. Its status says children can no longer see it, and the **History** shows who retired it and when. (Children's lesson screens arrive in Phase 2. The database rule that hides everything except Published items is already in place and tested.)
8. Filter the library by language, level, topic and status, and search for a title.

## For developers

```bash
npm install
cp .env.example .env.local        # fill in the values
npm run dev                       # http://localhost:3000
npm test                          # converter and validation tests
npm run test:db                   # database access-rule tests (needs a throwaway PostgreSQL database)
npm run content:convert           # lessons-source.md → lessons.json + import-report.md
npm run make-admin -- you@example.com
```

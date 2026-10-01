# Leesavontuur

A reading program in Afrikaans and English for South African children. The full specification is in [PROJECT-BRIEF.md](PROJECT-BRIEF.md). Instructions for Claude Code are in [CLAUDE.md](CLAUDE.md).

**Status: Phase 6 (Games and polish)**: the Galgie game, "About reading" articles, Mika the meerkat mascot, and an accessibility check of every page. Built on Phase 1 (accounts, profiles, content library), Phase 2 (the 7-step lesson player), Phase 3 (placement tests and levels), Phase 4 (reports, PIN and child mode) and Phase 5 (topics, requests, lesson form and AI drafting).

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
2. **Create the database:** in Supabase, open **SQL Editor** and run each file in `supabase/migrations/` **in order, once each**: paste the whole file and press **Run**. (`…_foundation.sql` first, then `…_lesson_results.sql`, then `…_levels_and_calibration.sql`, then `…_parent_pin.sql`, then `…_topics_and_requests.sql`, then `…_games_and_articles.sql`, then `…_eye_games.sql`.)
3. **Login settings:** in Supabase, go to **Authentication → URL Configuration**. Set **Site URL** to your website address (for example the `….vercel.app` address), and add `https://<your-address>/**` under **Redirect URLs**.
4. **Vercel:** import the GitHub repository as a new project, and add these **Environment Variables**. The values are under Supabase → **Project Settings → API Keys**:
   - `NEXT_PUBLIC_SUPABASE_URL`: the project URL
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: the publishable key
   - `SUPABASE_SECRET_KEY`: the secret key (**never** share this one)
   - `NEXT_PUBLIC_SITE_URL`: your website address
   - `ANTHROPIC_API_KEY` (optional, for "Draft with AI"): an API key from your Anthropic account (console.anthropic.com). **Never** share this one either.
5. **Deploy**, then sign up on the site with your own email address.
6. **Make yourself admin:** in Supabase **SQL Editor**, run (with your email address):
   ```sql
   update public.profiles set role = 'admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
7. **Import the lessons:** on the site, go to **Admin → Import** and upload `content/lessons.json`.

Supabase's built-in email is fine for testing but only sends a few emails an hour. Before real families sign up, connect an email service (Supabase → Authentication → Emails → SMTP).

## If something goes wrong

- **Use the site's main address.** In Vercel, open the project and use **Overview → Visit** (or **Settings → Domains**). Addresses with an extra code in them, like `leesavontuur-abc123x-….vercel.app`, are frozen snapshots of old versions.
- **Updates publish from `main`.** Vercel publishes automatically when `main` changes on GitHub, as long as **Settings → Git** shows the connected repository. If it doesn't, use **Deployments → Create Deployment → `main`**.
- **Locked out, and the reset email doesn't arrive?** Supabase's built-in email only sends a few emails per hour. Set a new password directly in Supabase **SQL Editor** (replace the password, and delete the query afterwards):
  ```sql
  update auth.users
  set encrypted_password = extensions.crypt('NewPassword123', extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now())
  where email = 'leesavontuur194@gmail.com';
  ```
- **Admin button missing?** Check the role with `select u.email, p.role from auth.users u join public.profiles p on p.id = u.id;` and run the "make yourself admin" line again if needed.

## Trying out Phase 1

1. Open the site and choose **Skep 'n rekening**. Try it once *without* ticking the privacy box: it should refuse.
2. Add a child (**Voeg 'n kind by**). Pick a grade and a level for each language, and tick the consent box.
3. Edit the child and change a level. Press **English** at the top: the parent area switches language.
4. Under **My rekening**, download your family's data and have a look at the file.
5. Open **Admin** (after step 6 of the set-up). You should see 126 items **Published** and 4 **In review**.
6. Open an item that is in review (click the **In review** count). Read the review note: it lists the questions whose options are still in shortened form. (Editing them in the site comes later; for now, leave these 4 lessons in review.)
7. Open any lesson and press **Retire**. Its status says children can no longer see it, and the **History** shows who retired it and when. (Children's lesson screens arrive in Phase 2. The database rule that hides everything except Published items is already in place and tested.)
8. Filter the library by language, level, topic and status, and search for a title.

## Trying out Phase 2

1. **Update the database first:** in Supabase **SQL Editor**, run `supabase/migrations/20260930080815_lesson_results.sql` once (copy it from GitHub the same way as the first file).
2. In the parent area, press **Begin lees** next to a child, then **Begin vandag se les** (Afrikaans) or **Start today's lesson** (English).
3. Go through all 7 steps. On the first lesson the eye exercise is skipped: the timed reading measures the child's speed first.
4. In the timed reading, try pressing **Klaar gelees** straight away: it should ask whether you really read every word.
5. Try the special-letter buttons (ê, ë, 'n …) in the spelling and grammar steps, and answer some questions wrong to see the second try and the messages.
6. At the end, the report is saved. The child's card in the parent area now shows it.
7. Start the next lesson: it's the next unread one, and now the eye exercise runs at the measured speed. The three eye-exercise modes take turns.
8. Try adding a third child: the site allows at most 2 per family.
9. As admin, open any lesson in the library and press **▶ Play as a child (preview)**. You can choose the eye-exercise mode and speed. Nothing is saved.

## Trying out Phase 3

1. **Update the database first:** in Supabase **SQL Editor**, run `supabase/migrations/20260930100856_levels_and_calibration.sql` once.
2. **Grade advice:** add or edit a child in Grade R or Grade 1. The card shows the recommendation to start in Grade 1, Term 3.
3. **Placement test:** on a child's card, open **Plasingstoets**, choose a language and level, and press **Begin die toets**. The child picks one of three passages, reads it, answers 4 questions and spells 7 words. At the end, **Vir die ouer** shows the result and a suggestion. Press **Stel vlak op …** to set the level. The reading speed becomes the eye exercise's starting speed.
4. **"Ready for the next level?":** after 5 lessons at 90% or more in every score, the child is asked at the end of a lesson. **Ja, kom ons gaan!** sends you a request in the parent area. **Keur goed** makes the next lesson a challenge lesson from the next level; with 80% or more, the child moves up and you're told.
5. **Suggestions for you:** after 5 lessons averaging 90%+ (or below 50%), the child's card suggests moving up (or down). **Skuif na Vlak …** or **Ignoreer**.
6. **Settings:** under **Wysig**, choose how the passage looks (plain, coloured border, tinted background), fix one eye-exercise mode, and choose "Ask me first" or "Let my child move up after a challenge lesson".
7. **Admin → Settings:** the thresholds above (90%, 5 lessons, 80% …) can be changed here.

## Trying out Phase 4

1. **Update the database first:** in Supabase **SQL Editor**, run `supabase/migrations/20260930112518_parent_pin.sql` once.
2. **Report:** on a child's card, press **Verslag**. Choose the language and level at the top. The table has one row per lesson with an average row at the bottom; placement tests and challenge lessons are marked and not counted in the average. Below it is the reading-speed chart: hover over (or tap) a point to see the lesson and speed.
3. **Print or PDF:** press **Druk of stoor as PDF**. In the print window, choose "Save as PDF" to keep a copy.
4. **Parent PIN:** go to **My rekening** and choose a 4-digit PIN.
5. **Child mode:** press **Begin lees** on a child's card. The top bar now only shows **Ouerarea 🔒**. The child sees their name, a path of stepping stones per language and a "Speletjies – binnekort" corner.
6. **Unlock:** press **Ouerarea 🔒** and type your PIN. After 5 wrong tries it locks for 5 minutes. Without a PIN, the site asks for your password instead.
7. **Placement test result:** at the end of a placement test, **Stel vlak op …** now asks for the PIN first, then asks you to confirm the level.

## Trying out Phase 5

1. **Update the database first:** in Supabase **SQL Editor**, run `supabase/migrations/20261001090000_topics_and_requests.sql` once.
2. **Favourite topics:** under **Wysig** on a child's card, tick 2 to 4 favourite topics and save. (Children added before Phase 5 have none yet, so the site asks for them the next time you save that child.) The next lesson now comes from a favourite topic first.
3. **The child chooses too:** press **Begin lees**, then **⭐ My onderwerpe · My topics**.
4. **Ask for a topic:** in the parent area, under **Vra vir 'n nuwe onderwerp**, type for example "perde", choose the child and language, and press **Stuur**. The request shows **Ontvang → Word voorberei → Gereed**.
5. **Requests inbox (Admin → Requests):** requests are grouped, with the children's languages and levels. **Link to a topic** (a new one, e.g. English "Horses", Afrikaans "Perde") or **Decline** with a short reply. Once linked, buttons appear to draft or write lessons for it.
6. **Write a lesson (Admin → Write a lesson):** fill in every part. The **Checks** bar at the bottom shows what must be fixed and what is worth a second look (for example a passage much longer than the level's benchmark). It is saved as a Draft. Publish it on its page: the parents who asked for that topic see "Goeie nuus!" in their parent area, and the topic appears in their children's choices.
7. **Fix the 4 lessons in review:** open one from the content library (status *In review*), press **✎ Edit**, rewrite the shortened options, **Save changes**, then **Publish**.
8. **Draft with AI:** shows "Not set up yet" until `ANTHROPIC_API_KEY` is added in Vercel (then redeploy). After that, choose the language, level, topic and number, and press **Draft passages**. It takes a few minutes; the lessons appear as Drafts with a note, and the page shows the estimated cost.
9. **Admin → Topics:** add topics, or hide one.

## Trying out Phase 6

1. **Update the database first:** in Supabase **SQL Editor**, run `supabase/migrations/20261002080000_games_and_articles.sql` once.
2. **Mika the meerkat** is in the top-left corner, on the home page and on the child's screen. The browser tab shows Mika's face.
3. **Galgie:** press **Begin lees**, then **🎈 Galgie** (or **🎈 Hangman** for English) in the games corner. Tap letters (or type them). Each wrong letter pops a balloon; 7 balloons per word. The words come from the child's own level.
4. **Game time in the report:** after a few words, open the child's **Verslag**: "Speletjies hierdie maand: … min" appears under the summary line.
5. **About reading articles:** go to **Admin → Articles**. There are 6 drafts (3 Afrikaans, 3 English). Open one, rewrite it in your own words and check every fact, press **Save**, then **Publish**. Visitors (also people who are not signed in) find it under **Oor lees** at the bottom of every page.

## Trying out the eye games

1. **Update the database first:** in Supabase **SQL Editor**, run `supabase/migrations/20261003080000_eye_games.sql` once. (Supabase may warn that it drops something: it only replaces the list of allowed game names, so it is safe to run.)
2. Press **Begin lees**, then **Speel · Play** in the games corner. The games page shows Galgie and the three eye games, each in Afrikaans or English.
3. **✨ Vang die vuurvliegie:** follow the firefly with your eyes; tap it when it turns gold. 8 gold moments per game.
4. **🔍 Soek-en-vind:** find all the letters shown at the top; at higher difficulty they become short words from the child's lessons. 3 grids per game.
5. **🦘 Spring-woorde:** a word flashes somewhere on the screen; choose which word you saw. 8 words per game.
6. Each game adapts: after a very good game the next one is a step harder (faster firefly, bigger grid, shorter flash); after a hard game, a step easier. Time played appears in the report with the other games.

### Testing with real children (checklist)

Try this with one or two children, on a phone and on a tablet if you can:

- Can the child find their name and start a lesson without help?
- Is the reading text big enough and comfortable to read? Is anything too small to tap?
- Do the special letter buttons (ê, ë, 'n …) work when typing answers?
- Does the eye exercise feel too fast or too slow?
- Are the encouraging messages understood? Does anything confuse or upset the child?
- Is Galgie fun, and are the words right for the child's level?
- How long does one lesson take? (About 15–20 minutes is a good target.)
- Write down anything the child says or struggles with, and send it to me.

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

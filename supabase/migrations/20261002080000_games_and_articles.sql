-- Phase 6: time spent on games (for the parent report) and the public
-- "About reading" articles. Games never count towards lesson scores.
-- The starter articles are Drafts written with Claude's help: the owner
-- rewrites and approves every article before it is published (brief, section 12).

-- ------------------------------------------------------------------ games

create table public.game_sessions (
  id bigint generated always as identity primary key,
  learner_id uuid not null references public.learners (id) on delete cascade,
  game text not null check (game in ('galgie')),
  language public.language not null,
  level smallint not null check (level between 1 and 15),
  seconds integer not null check (seconds between 0 and 3600),
  words_played integer not null default 0 check (words_played between 0 and 500),
  words_won integer not null default 0 check (words_won between 0 and 500),
  played_at timestamptz not null default now()
);

create index game_sessions_learner_idx on public.game_sessions (learner_id, played_at desc);

alter table public.game_sessions enable row level security;
revoke all on public.game_sessions from anon;
revoke update, delete on public.game_sessions from authenticated;

create policy "Parents read own children's games"
  on public.game_sessions for select to authenticated
  using (exists (select 1 from public.learners l where l.id = learner_id and l.parent_id = (select auth.uid())));

create policy "Parents save own children's games"
  on public.game_sessions for insert to authenticated
  with check (exists (select 1 from public.learners l where l.id = learner_id and l.parent_id = (select auth.uid())));

-- ------------------------------------------------------------------ articles

create table public.articles (
  id bigint generated always as identity primary key,
  slug text not null check (slug ~ '^[a-z0-9-]+$' and char_length(slug) <= 80),
  language public.language not null,
  title text not null check (char_length(title) between 1 and 120),
  summary text not null default '' check (char_length(summary) <= 300),
  -- Simple text: paragraphs separated by an empty line, "## " for a heading, "- " for a list item.
  body text not null default '' check (char_length(body) <= 20000),
  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  updated_by uuid references public.profiles (id) on delete set null default auth.uid(),
  unique (language, slug)
);

create function public.articles_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce((select auth.uid()), new.updated_by);
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger articles_before_write
  before insert or update on public.articles
  for each row execute function public.articles_before_write();

alter table public.articles enable row level security;
grant select on public.articles to anon, authenticated;
revoke insert, update, delete on public.articles from anon;

-- Everyone, also visitors who are not signed in, reads published articles.
create policy "Published articles are public; staff read everything"
  on public.articles for select to anon, authenticated
  using (status = 'published' or (select public.is_staff()));

create policy "Staff add articles"
  on public.articles for insert to authenticated
  with check ((select public.is_staff()));

create policy "Staff edit articles"
  on public.articles for update to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

create policy "Admin deletes articles"
  on public.articles for delete to authenticated
  using ((select public.is_admin()));

-- ------------------------------------------------------------------ starter drafts (for the owner to review)

insert into public.articles (slug, language, title, summary, body, sort_order) values
(
  'hoe-kinders-leer-lees', 'af',
  'Hoe kinders leer lees',
  'Lees is nie een vaardigheid nie, maar ''n hele paar wat saamwerk. So bou ''n kind dit stap vir stap op.',
  $body$Wanneer ons 'n volwassene sien lees, lyk dit maklik: die oë gly oor die bladsy en die betekenis kom vanself. Vir 'n kind wat leer lees, is elke sin egter 'n klein legkaart. Lees bestaan uit 'n paar vaardighede wat mekaar ondersteun.

## Klanke en letters

Eers moet 'n kind hoor dat woorde uit klanke bestaan: dat *kat* begin met 'n k-klank en eindig met 'n t-klank. Daarna leer die kind watter letter by watter klank hoort. Hierdie stap is die fondament. Daarom beveel ons aan dat kinders eers in Graad 1, kwartaal 3, met Leesavontuur begin, wanneer hulle al die klanke ken wat op Vlak 1 gebruik word.

## Woorde uitklank en herken

Met klanke en letters kan 'n kind 'n nuwe woord uitklank: k-a-t, *kat*. Hoe meer 'n kind lees, hoe meer woorde herken hy of sy dadelik, sonder om uit te klank. Dan word lees vinniger en gemakliker.

## Vlot lees

'n Vlot leser lees teen 'n gemaklike tempo, met min foute en met uitdrukking. Vlot lees is belangrik omdat die brein dan nie meer al sy aandag aan die woorde self hoef te gee nie. Daar bly aandag oor om te verstaan.

## Begrip en woordeskat

Die doel van lees is om te verstaan. Begrip groei wanneer 'n kind baie woorde ken, oor die storie gesels en vrae vra. Daarom begin elke les in Leesavontuur met woordkaarte en eindig dit met begripsvrae.

## Elke kind op sy eie pad

Kinders leer nie almal ewe vinnig lees nie, en dit is heeltemal normaal. Kort, gereelde oefening, geduld en baie aanmoediging help die meeste.$body$,
  1
),
(
  'spoed-en-begrip', 'af',
  'Leesspoed en begrip: waarom albei saak maak',
  'Vinnig lees is nie die doel nie. Die doel is om gemaklik genoeg te lees om te verstaan.',
  $body$In Leesavontuur meet ons hoeveel woorde per minuut 'n kind lees, en hoeveel van die vrae hy of sy reg beantwoord. Waarom kyk ons na albei?

## Te stadig

As 'n kind elke woord moet uitklank, is die begin van die sin dikwels vergete teen die tyd dat die einde kom. Dan is dit moeilik om die storie te volg, al is elke woord reg gelees.

## Te vinnig

Om te jaag help ook nie. 'n Kind wat net so vinnig moontlik deur die teks jaag, slaan woorde oor en verstaan minder. Daarom wys die site 'n boodskap as 'n kind onrealisties vinnig "klaar gelees" druk, en tel so 'n lesing nie in die gemiddeld nie.

## Die regte tempo

Die beste tempo is een waarteen die kind gemaklik lees en goed verstaan. Dit verskil van kind tot kind. Daarom meet die plasingstoets elke kind se eie begintempo, en pas die oogoefening daarby aan. Die spoed styg stadig soos die kind oefen.

## Wat die verslag vir u sê

Kyk in die verslag na albei getalle saam. Styg die spoed terwyl begrip hoog bly? Dan gaan dit uitstekend. Styg die spoed, maar daal begrip? Moedig u kind aan om rustig te lees. Bly albei 'n tyd lank dieselfde? Dit is ook normaal: leer gebeur in treetjies.$body$,
  2
),
(
  'wenke-vir-ouers', 'af',
  'Tien wenke vir ouers',
  'Klein gewoontes by die huis maak ''n groot verskil vir ''n jong leser.',
  $body$U hoef nie 'n onderwyser te wees om u kind met lees te help nie. Hier is 'n paar eenvoudige idees.

- **Lees elke dag hardop vir u kind**, ook as hy of sy al self kan lees. Dit bou woordeskat en wys dat lees lekker is.
- **Hou oefening kort en gereeld.** Een les per dag werk beter as vyf lesse op een Saterdag.
- **Kies 'n rustige tyd en plek**, sonder 'n televisie in die agtergrond.
- **Prys die moeite, nie net die punte nie.** "Jy het baie mooi gekonsentreer" help meer as "Jy is slim".
- **Gesels oor die storie.** Vra: Wat dink jy gaan volgende gebeur? Wat sou jy gedoen het?
- **Laat u kind kies.** Kinders lees graag oor dinge waarvan hulle hou. Kies saam gunsteling-onderwerpe.
- **Wees geduldig met foute.** Gee tyd om self reg te maak voordat u help.
- **Gebruik die biblioteek.** Laat u kind boeke kies oor sy of haar gunsteling-onderwerpe.
- **Wees self 'n leser.** Kinders doen wat hulle sien.
- **Kontak die onderwyser** as u bekommerd is. Soms het 'n kind ekstra hulp nodig, byvoorbeeld met sig of gehoor.$body$,
  3
),
(
  'how-children-learn-to-read', 'en',
  'How children learn to read',
  'Reading is not one skill but several working together. Here is how children build them, step by step.',
  $body$Watching an adult read, it looks effortless. For a child who is learning, every sentence is a small puzzle made of several skills.

## Sounds and letters

First, children notice that spoken words are made of sounds: *cat* starts with a /k/ sound and ends with a /t/ sound. Then they learn which letters stand for which sounds. This is the foundation, which is why we recommend starting Leesavontuur in Grade 1, Term 3, once children know the sounds used at Level 1.

## Sounding out and recognising words

Knowing sounds and letters, a child can sound out a new word: c-a-t, *cat*. With practice, more and more words are recognised at a glance, and reading becomes quicker and easier.

## Fluency

A fluent reader reads at a comfortable pace, accurately and with expression. Fluency matters because the brain no longer needs all its attention for the words themselves, which leaves attention free for understanding.

## Vocabulary and comprehension

Understanding is the point of reading. It grows as children learn more words, talk about what they read and ask questions. That is why every Leesavontuur lesson starts with word cards and ends with comprehension questions.

## Every child at their own pace

Children learn to read at different speeds, and that is normal. Short, regular practice, patience and plenty of encouragement help most.$body$,
  1
),
(
  'reading-speed-and-understanding', 'en',
  'Reading speed and understanding: why both matter',
  'Reading fast is not the goal. Reading comfortably enough to understand is.',
  $body$Leesavontuur measures how many words per minute a child reads and how many questions they answer correctly. Why look at both?

## Too slow

When a child has to sound out every word, the start of a sentence is often forgotten by the time they reach the end. The story is hard to follow, even if every word was read correctly.

## Too fast

Rushing does not help either. A child racing through the text skips words and understands less. That is why the site shows a message when a child presses "finished" impossibly quickly, and leaves such readings out of the average.

## The right pace

The best pace is the one at which a child reads comfortably and understands well, and it differs from child to child. The placement test measures each child's own starting speed, and the eye exercise adapts to it. Speed rises gradually with practice.

## Reading the report

Look at both numbers together. Speed rising while comprehension stays high? Excellent. Speed rising but comprehension falling? Encourage your child to slow down a little. Both staying the same for a while? That is normal too: learning happens in steps.$body$,
  2
),
(
  'tips-for-parents', 'en',
  'Ten tips for parents',
  'Small habits at home make a big difference for a young reader.',
  $body$You don't need to be a teacher to help your child with reading. Here are a few simple ideas.

- **Read aloud to your child every day**, even once they can read on their own. It builds vocabulary and shows that reading is enjoyable.
- **Keep practice short and regular.** One lesson a day works better than five on a Saturday.
- **Choose a calm time and place**, without the television on in the background.
- **Praise effort, not only scores.** "You concentrated really well" helps more than "You're clever".
- **Talk about the story.** Ask: What do you think will happen next? What would you have done?
- **Let your child choose.** Children love reading about things they are interested in. Choose favourite topics together.
- **Be patient with mistakes.** Give your child time to correct themselves before you help.
- **Visit the library.** Let your child pick books about their favourite topics.
- **Be a reader yourself.** Children copy what they see.
- **Talk to the teacher** if you are worried. Sometimes a child needs extra help, for example with eyesight or hearing.$body$,
  3
);

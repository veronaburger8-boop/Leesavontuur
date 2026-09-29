-- Leesavontuur – Phase 1 (Foundation)
--
-- Accounts, learner profiles and the content library.
--
-- The rule everything depends on: children only ever see content with status
-- 'published'. It is enforced here, in the row level security policies, so it
-- holds no matter which page or query asks for content.
--
-- Children's personal information is kept to a minimum (POPIA): a first name or
-- nickname, an optional grade, and their levels. No surnames, photos, schools
-- or ID numbers.

-- ------------------------------------------------------------------ types

create type public.user_role as enum ('parent', 'reviewer', 'admin');
create type public.language as enum ('af', 'en');
create type public.content_type as enum ('lesson', 'calibration');
create type public.content_status as enum ('draft', 'in_review', 'published', 'retired');

-- ------------------------------------------------------------------ profiles

-- One row per account (parent, reviewer or admin), created automatically when
-- someone signs up.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 80),
  role public.user_role not null default 'parent',
  -- Language of the parent area.
  locale public.language not null default 'af',
  privacy_accepted_at timestamptz,
  privacy_version text,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Account holders. The role can only be changed by the database owner (see scripts/make-admin.ts).';

-- ------------------------------------------------------------------ helper functions

-- True when the signed-in user is an admin or reviewer. Security definer so it
-- can read profiles without being blocked by the profiles policies.
create function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin', 'reviewer')
  );
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- Creates the profile when an account is created. The sign-up form sends the
-- privacy policy version the parent accepted, and the chosen language.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, locale, privacy_accepted_at, privacy_version)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en'::public.language else 'af'::public.language end,
    case when new.raw_user_meta_data ->> 'privacy_version' is not null then now() end,
    new.raw_user_meta_data ->> 'privacy_version'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------------ learners

create table public.learners (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  -- First name or nickname only.
  name text not null check (char_length(trim(name)) between 1 and 40),
  grade smallint check (grade between 0 and 12),
  -- When and by whom consent was given to process this child's information.
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index learners_parent_id_idx on public.learners (parent_id);

-- Each learner has a separate level and reading speed per language.
create table public.learner_languages (
  learner_id uuid not null references public.learners (id) on delete cascade,
  language public.language not null,
  level smallint not null default 1 check (level between 1 and 15),
  -- Latest reading speed in words per minute (set by lessons from Phase 2).
  reading_wpm integer check (reading_wpm > 0),
  updated_at timestamptz not null default now(),
  primary key (learner_id, language)
);

-- ------------------------------------------------------------------ topics

-- Topics are data, so the admin can add more later.
create table public.topics (
  key text primary key check (key ~ '^[a-z0-9-]+$'),
  name_en text not null,
  name_af text not null,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.topics (key, name_en, name_af, sort_order) values
  ('animals', 'Animals', 'Diere', 1),
  ('nature', 'Nature and outdoors', 'Natuur en buitelug', 2),
  ('sport', 'Sport and games', 'Sport en speletjies', 3),
  ('space', 'Space and stars', 'Die ruimte en sterre', 4),
  ('food', 'Food and cooking', 'Kos en kook', 5),
  ('adventure', 'Adventure and make-believe', 'Avontuur en fantasie', 6),
  ('body', 'My body and health', 'My liggaam en gesondheid', 7),
  ('how-things-work', 'How things work', 'Hoe dinge werk', 8);

-- ------------------------------------------------------------------ content

-- Lessons and calibration passages. The searchable fields are columns; the
-- full item (word cards, passage, questions …) is in `data`, in the format of
-- section 9 of the brief.
create table public.content_items (
  id text primary key check (id ~ '^[a-z0-9-]+$'),
  type public.content_type not null,
  language public.language not null,
  level smallint not null check (level between 1 and 15),
  topic text references public.topics (key) on update cascade,
  status public.content_status not null default 'draft',
  title text not null,
  sequence integer,
  word_count integer not null default 0,
  data jsonb not null,
  review_note text,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null default auth.uid(),
  published_at timestamptz,
  published_by uuid references public.profiles (id) on delete set null,
  constraint lessons_have_topic check (type <> 'lesson' or topic is not null)
);

create index content_items_library_idx on public.content_items (language, level, type, status);
create index content_items_topic_idx on public.content_items (topic);

-- Who changed the status of what, and when.
create table public.content_status_log (
  id bigint generated always as identity primary key,
  content_id text not null references public.content_items (id) on delete cascade,
  from_status public.content_status,
  to_status public.content_status not null,
  note text,
  changed_by uuid references public.profiles (id) on delete set null,
  changed_at timestamptz not null default now()
);

create index content_status_log_content_idx on public.content_status_log (content_id, changed_at desc);

-- Keeps updated_at / published_at current and records every status change.
create function public.content_items_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce((select auth.uid()), new.updated_by);
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := now();
    new.published_by := (select auth.uid());
  end if;
  return new;
end;
$$;

create trigger content_items_before_write
  before insert or update on public.content_items
  for each row execute function public.content_items_before_write();

create function public.content_items_log_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.content_status_log (content_id, from_status, to_status, note, changed_by)
    values (
      new.id,
      case when tg_op = 'UPDATE' then old.status end,
      new.status,
      new.review_note,
      (select auth.uid())
    );
  end if;
  return new;
end;
$$;

create trigger content_items_log_status
  after insert or update on public.content_items
  for each row execute function public.content_items_log_status();

create function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger learners_touch before update on public.learners
  for each row execute function public.touch_updated_at();
create trigger learner_languages_touch before update on public.learner_languages
  for each row execute function public.touch_updated_at();

-- ------------------------------------------------------------------ row level security

alter table public.profiles enable row level security;
alter table public.learners enable row level security;
alter table public.learner_languages enable row level security;
alter table public.topics enable row level security;
alter table public.content_items enable row level security;
alter table public.content_status_log enable row level security;

-- Visitors who are not signed in get nothing.
revoke all on public.profiles, public.learners, public.learner_languages, public.topics,
  public.content_items, public.content_status_log from anon;

-- profiles: you see and edit your own profile. Only the name and language can
-- be changed from the site; the role cannot.
revoke insert, update, delete on public.profiles from authenticated;
grant update (display_name, locale) on public.profiles to authenticated;

create policy "Own profile is readable"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_staff()));

create policy "Own profile is editable"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- learners: a parent sees and manages only their own children. Staff have no
-- access to children's profiles.
create policy "Parents read own learners"
  on public.learners for select to authenticated
  using (parent_id = (select auth.uid()));

create policy "Parents add own learners"
  on public.learners for insert to authenticated
  with check (parent_id = (select auth.uid()));

create policy "Parents edit own learners"
  on public.learners for update to authenticated
  using (parent_id = (select auth.uid()))
  with check (parent_id = (select auth.uid()));

create policy "Parents delete own learners"
  on public.learners for delete to authenticated
  using (parent_id = (select auth.uid()));

-- Only the name and grade of a learner can be changed after creation.
revoke update on public.learners from authenticated;
grant update (name, grade) on public.learners to authenticated;

create policy "Parents manage own learners' languages"
  on public.learner_languages for all to authenticated
  using (exists (select 1 from public.learners l where l.id = learner_id and l.parent_id = (select auth.uid())))
  with check (exists (select 1 from public.learners l where l.id = learner_id and l.parent_id = (select auth.uid())));

-- topics: everyone signed in can read them; only the admin changes them.
create policy "Topics are readable"
  on public.topics for select to authenticated
  using (true);

create policy "Admin manages topics"
  on public.topics for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- content_items: THE RULE. Anyone who is not staff sees published items only.
create policy "Published content is readable; staff read everything"
  on public.content_items for select to authenticated
  using (status = 'published' or (select public.is_staff()));

create policy "Staff add content"
  on public.content_items for insert to authenticated
  with check ((select public.is_staff()));

create policy "Staff edit content"
  on public.content_items for update to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

create policy "Admin deletes content"
  on public.content_items for delete to authenticated
  using ((select public.is_admin()));

-- The status log is written by the trigger and read by staff.
revoke insert, update, delete on public.content_status_log from authenticated;

create policy "Staff read the status log"
  on public.content_status_log for select to authenticated
  using ((select public.is_staff()));

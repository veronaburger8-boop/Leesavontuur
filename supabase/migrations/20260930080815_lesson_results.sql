-- Leesavontuur – Phase 2 (The lesson)
--
-- 1. At most 2 children per family (owner's decision).
-- 2. Lesson results: one row per finished lesson, the report row from
--    section 2 of the brief. Unfinished lessons are not saved.

-- ------------------------------------------------------------------ 2 children per family

create function public.enforce_learner_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Lock the parent's profile so two quick requests cannot both get through.
  perform 1 from public.profiles where id = new.parent_id for update;
  if (select count(*) from public.learners where parent_id = new.parent_id) >= 2 then
    raise exception 'learner_limit' using hint = 'A family can have at most 2 children.';
  end if;
  return new;
end;
$$;

create trigger learners_limit
  before insert on public.learners
  for each row execute function public.enforce_learner_limit();

-- ------------------------------------------------------------------ lesson results

create type public.eye_mode as enum ('lines', 'groups', 'pacer');

create table public.lesson_results (
  id bigint generated always as identity primary key,
  learner_id uuid not null references public.learners (id) on delete cascade,
  -- Kept when an item is later deleted, so reports keep their history.
  content_id text references public.content_items (id) on delete set null,
  content_title text not null,
  content_type public.content_type not null,
  language public.language not null,
  level smallint not null,
  completed_at timestamptz not null default now(),
  words_per_minute integer check (words_per_minute > 0),
  -- The child pressed "Continue" after "Did you really read every word?".
  unusually_fast boolean not null default false,
  comprehension_pct smallint check (comprehension_pct between 0 and 100),
  spelling_pct smallint check (spelling_pct between 0 and 100),
  grammar_pct smallint check (grammar_pct between 0 and 100),
  vocabulary_pct smallint check (vocabulary_pct between 0 and 100),
  eye_mode public.eye_mode,
  duration_seconds integer check (duration_seconds >= 0)
);

create index lesson_results_learner_idx on public.lesson_results (learner_id, language, completed_at desc);

alter table public.lesson_results enable row level security;
revoke all on public.lesson_results from anon;
-- Results are added only through record_lesson_result() below and never changed.
revoke insert, update, delete on public.lesson_results from authenticated;

create policy "Parents read own children's results"
  on public.lesson_results for select to authenticated
  using (exists (select 1 from public.learners l where l.id = learner_id and l.parent_id = (select auth.uid())));

-- Saves a finished lesson and the learner's new reading speed. Only a
-- published item, and only for the caller's own child.
create function public.record_lesson_result(
  p_learner_id uuid,
  p_content_id text,
  p_words_per_minute integer,
  p_unusually_fast boolean,
  p_comprehension_pct smallint,
  p_spelling_pct smallint,
  p_grammar_pct smallint,
  p_vocabulary_pct smallint,
  p_eye_mode public.eye_mode,
  p_duration_seconds integer
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.content_items;
  v_id bigint;
begin
  if not exists (select 1 from public.learners where id = p_learner_id and parent_id = (select auth.uid())) then
    raise exception 'not_your_learner';
  end if;
  select * into v_item from public.content_items where id = p_content_id and status = 'published';
  if not found then
    raise exception 'not_published';
  end if;

  insert into public.lesson_results (
    learner_id, content_id, content_title, content_type, language, level,
    words_per_minute, unusually_fast, comprehension_pct, spelling_pct, grammar_pct, vocabulary_pct,
    eye_mode, duration_seconds
  ) values (
    p_learner_id, v_item.id, v_item.title, v_item.type, v_item.language, v_item.level,
    p_words_per_minute, coalesce(p_unusually_fast, false), p_comprehension_pct, p_spelling_pct, p_grammar_pct, p_vocabulary_pct,
    p_eye_mode, p_duration_seconds
  ) returning id into v_id;

  -- The next eye exercise starts from this speed (plus about 5%). An
  -- impossibly fast result does not change it.
  if p_words_per_minute is not null and not coalesce(p_unusually_fast, false) then
    insert into public.learner_languages (learner_id, language, reading_wpm)
    values (p_learner_id, v_item.language, p_words_per_minute)
    on conflict (learner_id, language) do update set reading_wpm = excluded.reading_wpm;
  end if;
  return v_id;
end;
$$;

revoke execute on function public.record_lesson_result(uuid, text, integer, boolean, smallint, smallint, smallint, smallint, public.eye_mode, integer) from public, anon;
grant execute on function public.record_lesson_result(uuid, text, integer, boolean, smallint, smallint, smallint, smallint, public.eye_mode, integer) to authenticated;

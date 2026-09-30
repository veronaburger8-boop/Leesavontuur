-- Leesavontuur – Phase 3 (Calibration and levels)
--
-- Parent settings per child, level-up requests and challenge lessons,
-- on-site notifications for parents, and adjustable thresholds (admin).
-- The parent always decides: no level changes without the parent's approval
-- or the parent's chosen setting.

-- ------------------------------------------------------------------ parent settings per child

create type public.display_style as enum ('plain', 'border', 'tint');
create type public.level_up_mode as enum ('ask', 'auto');

alter table public.learners
  add column display_style public.display_style not null default 'border',
  -- null = the three eye-exercise modes take turns.
  add column eye_mode_fixed public.eye_mode,
  -- 'ask' (default): the parent approves a move up. 'auto': the child moves up
  -- after passing a challenge lesson; the parent is still told.
  add column level_up_mode public.level_up_mode not null default 'ask';

grant update (display_style, eye_mode_fixed, level_up_mode) on public.learners to authenticated;

-- When the "Ready for the next level?" prompt or a parent suggestion was last
-- put off, as the number of lessons done in that language at that moment.
alter table public.learner_languages
  add column prompt_snoozed_at integer not null default 0,
  add column suggestion_snoozed_at integer not null default 0;

-- ------------------------------------------------------------------ thresholds (admin settings)

create table public.app_settings (
  key text primary key,
  value numeric not null,
  description text not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value, description) values
  ('prompt_lessons', 5, 'Number of recent lessons used for the child''s "Ready for the next level?" prompt'),
  ('prompt_min_pct', 90, 'Average needed in each of comprehension, word recognition, grammar and vocabulary for the prompt'),
  ('prompt_wait_lessons', 3, 'Lessons to wait before asking again after "Not yet" or a decline'),
  ('challenge_pass_pct', 80, 'Average needed in the challenge lesson to move up'),
  ('suggest_lessons', 5, 'Number of recent lessons used for the parent''s level suggestions'),
  ('suggest_up_pct', 90, 'Average at or above which the parent is asked whether to move up'),
  ('suggest_down_pct', 50, 'Average below which the parent is asked whether to move down'),
  ('suggest_wait_lessons', 5, 'Lessons to wait before suggesting again after "Ignore"');

alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon;

create policy "Settings are readable"
  on public.app_settings for select to authenticated
  using (true);

create policy "Admin changes settings"
  on public.app_settings for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

revoke insert, delete on public.app_settings from authenticated;

-- ------------------------------------------------------------------ level-up requests

create type public.level_request_status as enum ('pending', 'approved', 'declined', 'passed', 'failed', 'cancelled');

create table public.level_requests (
  id bigint generated always as identity primary key,
  learner_id uuid not null references public.learners (id) on delete cascade,
  language public.language not null,
  from_level smallint not null,
  to_level smallint not null check (to_level = from_level + 1),
  status public.level_request_status not null default 'pending',
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  challenge_result_id bigint references public.lesson_results (id) on delete set null,
  -- The child has seen the parent's answer (for a kind message after a decline).
  child_informed boolean not null default false
);

-- At most one open request per child and language.
create unique index level_requests_one_open
  on public.level_requests (learner_id, language)
  where status in ('pending', 'approved');

alter table public.level_requests enable row level security;
revoke all on public.level_requests from anon;
revoke delete on public.level_requests from authenticated;

create policy "Parents manage own children's level requests"
  on public.level_requests for all to authenticated
  using (exists (select 1 from public.learners l where l.id = learner_id and l.parent_id = (select auth.uid())))
  with check (exists (select 1 from public.learners l where l.id = learner_id and l.parent_id = (select auth.uid())));

-- ------------------------------------------------------------------ notifications (on the site)

create table public.notifications (
  id bigint generated always as identity primary key,
  parent_id uuid not null references public.profiles (id) on delete cascade default auth.uid(),
  learner_id uuid references public.learners (id) on delete cascade,
  -- 'level_request', 'moved_up', 'challenge_not_passed', 'request_declined'
  kind text not null,
  language public.language,
  level smallint,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index notifications_parent_idx on public.notifications (parent_id, created_at desc);

alter table public.notifications enable row level security;
revoke all on public.notifications from anon;

create policy "Parents read own notifications"
  on public.notifications for select to authenticated
  using (parent_id = (select auth.uid()));

create policy "Parents add notifications about own children"
  on public.notifications for insert to authenticated
  with check (
    parent_id = (select auth.uid())
    and (learner_id is null or exists (select 1 from public.learners l where l.id = learner_id and l.parent_id = (select auth.uid())))
  );

create policy "Parents mark own notifications as read"
  on public.notifications for update to authenticated
  using (parent_id = (select auth.uid()))
  with check (parent_id = (select auth.uid()));

revoke update on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

-- ------------------------------------------------------------------ challenge lessons in the results

alter table public.lesson_results add column is_challenge boolean not null default false;

-- Replaces the Phase 2 version: calibration results have no grammar or
-- vocabulary score, and challenge lessons are marked.
drop function public.record_lesson_result(uuid, text, integer, boolean, smallint, smallint, smallint, smallint, public.eye_mode, integer);

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
  p_duration_seconds integer,
  p_is_challenge boolean default false
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
    eye_mode, duration_seconds, is_challenge
  ) values (
    p_learner_id, v_item.id, v_item.title, v_item.type, v_item.language, v_item.level,
    p_words_per_minute, coalesce(p_unusually_fast, false), p_comprehension_pct, p_spelling_pct, p_grammar_pct, p_vocabulary_pct,
    p_eye_mode, p_duration_seconds, coalesce(p_is_challenge, false)
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

revoke execute on function public.record_lesson_result(uuid, text, integer, boolean, smallint, smallint, smallint, smallint, public.eye_mode, integer, boolean) from public, anon;
grant execute on function public.record_lesson_result(uuid, text, integer, boolean, smallint, smallint, smallint, smallint, public.eye_mode, integer, boolean) to authenticated;

-- Finishes a challenge lesson: moves the child up if the average is high
-- enough, and tells the parent either way. Runs with the caller's own access.
create function public.finish_challenge(p_request_id bigint, p_result_id bigint, p_average numeric)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_request public.level_requests;
  v_pass numeric;
  v_passed boolean;
begin
  select * into v_request from public.level_requests where id = p_request_id and status = 'approved' for update;
  if not found then
    raise exception 'no_open_challenge';
  end if;
  select value into v_pass from public.app_settings where key = 'challenge_pass_pct';
  v_passed := p_average >= coalesce(v_pass, 80);

  update public.level_requests
    set status = case when v_passed then 'passed'::public.level_request_status else 'failed'::public.level_request_status end,
        decided_at = now(),
        challenge_result_id = p_result_id
    where id = p_request_id;

  if v_passed then
    update public.learner_languages set level = v_request.to_level
      where learner_id = v_request.learner_id and language = v_request.language;
  else
    -- The prompt can come back after a few more strong lessons.
    update public.learner_languages
      set prompt_snoozed_at = (select count(*) from public.lesson_results r
                               where r.learner_id = v_request.learner_id and r.language = v_request.language)
      where learner_id = v_request.learner_id and language = v_request.language;
  end if;

  insert into public.notifications (learner_id, kind, language, level)
    values (v_request.learner_id, case when v_passed then 'moved_up' else 'challenge_not_passed' end, v_request.language, v_request.to_level);
  return v_passed;
end;
$$;

revoke execute on function public.finish_challenge(bigint, bigint, numeric) from public, anon;
grant execute on function public.finish_challenge(bigint, bigint, numeric) to authenticated;

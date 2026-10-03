-- Subscriptions (owner's decision, brief section 11): a free pilot for invited
-- families; after that one free lesson per child, then R99 per family per
-- month through PayFast. We never see or keep card details: PayFast handles
-- the payment and tells the site the outcome.
--
-- While charging is switched off (the pilot) everything stays free. The
-- owner switches it on in Admin → Families, where she can also mark pilot
-- families, who keep free access.

insert into public.app_settings (key, value, description) values
  ('billing_on', 0, 'Charging on (1) or off (0). While off, as during the pilot, everything is free'),
  ('free_lessons', 1, 'Free lessons per child before the family needs a subscription (when charging is on)');

create type public.subscription_status as enum ('none', 'pending', 'active', 'cancelled', 'failed');

-- One row per family (parent account). Written only by the server (PayFast's
-- notifications, the parent's own subscribe and cancel buttons) and by the admin.
create table public.subscriptions (
  parent_id uuid primary key references public.profiles (id) on delete cascade,
  status public.subscription_status not null default 'none',
  -- A pilot family keeps free access while this is on (set by the admin).
  pilot boolean not null default false,
  -- Our reference for PayFast (m_payment_id) and PayFast's subscription token.
  reference text unique check (char_length(reference) <= 100),
  payfast_token text check (char_length(payfast_token) <= 100),
  -- Access lasts until this moment (paid month plus a few days' grace).
  paid_until timestamptz,
  started_at timestamptz,
  cancelled_at timestamptz,
  updated_at timestamptz not null default now()
);

-- What PayFast told us, for the admin to check payments. No names, email
-- addresses or card details are kept.
create table public.payment_events (
  id bigint generated always as identity primary key,
  parent_id uuid references public.profiles (id) on delete cascade,
  reference text check (char_length(reference) <= 100),
  pf_payment_id text check (char_length(pf_payment_id) <= 50),
  payment_status text not null check (char_length(payment_status) <= 30),
  amount_cents integer,
  received_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
alter table public.payment_events enable row level security;
revoke all on public.subscriptions, public.payment_events from anon;
revoke insert, update, delete on public.subscriptions, public.payment_events from authenticated;

create policy "Parents read own subscription; staff read all"
  on public.subscriptions for select to authenticated
  using (parent_id = (select auth.uid()) or (select public.is_staff()));

create policy "Staff read payment events"
  on public.payment_events for select to authenticated
  using ((select public.is_staff()));

-- ------------------------------------------------------------------ who may carry on

-- True when the family may use everything: charging is off, it's a pilot
-- family, or the subscription is paid up.
create function public.family_has_access(p_parent uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select value from public.app_settings where key = 'billing_on'), 0) = 0
    or exists (
      select 1 from public.subscriptions s
      where s.parent_id = p_parent and (s.pilot or s.paid_until > now())
    );
$$;

revoke execute on function public.family_has_access(uuid) from public, anon, authenticated;

-- True when this child may do another lesson or play: the family has access,
-- or the child hasn't used up the free lessons yet. Only answers for the
-- caller's own children (false otherwise). Placement tests are always free.
create function public.learner_may_continue(p_learner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.learners l
    where l.id = p_learner_id
      and l.parent_id = (select auth.uid())
      and (
        public.family_has_access(l.parent_id)
        or (
          select count(*) from public.lesson_results r
          where r.learner_id = l.id and r.content_type = 'lesson'
        ) < coalesce((select value from public.app_settings where key = 'free_lessons'), 1)
      )
  );
$$;

revoke execute on function public.learner_may_continue(uuid) from public, anon;
grant execute on function public.learner_may_continue(uuid) to authenticated;

-- The signed-in parent's own situation, for the parent area.
create function public.my_access()
returns table (billing_on boolean, has_access boolean, pilot boolean, status public.subscription_status, paid_until timestamptz, free_lessons integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce((select value from public.app_settings where key = 'billing_on'), 0) = 1,
    public.family_has_access((select auth.uid())),
    coalesce(s.pilot, false),
    coalesce(s.status, 'none'),
    s.paid_until,
    coalesce((select value from public.app_settings where key = 'free_lessons'), 1)::integer
  from (select 1) one
  left join public.subscriptions s on s.parent_id = (select auth.uid());
$$;

revoke execute on function public.my_access() from public, anon;
grant execute on function public.my_access() to authenticated;

-- ------------------------------------------------------------------ the rule in the database

-- Saving a lesson now also checks the free lesson / subscription rule.
-- (Same as before, plus the check; placement tests stay free.)
create or replace function public.record_lesson_result(
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
  if v_item.type = 'lesson' and not public.learner_may_continue(p_learner_id) then
    raise exception 'subscription_needed';
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

-- Games are part of the subscription too.
drop policy "Parents save own children's games" on public.game_sessions;

create policy "Parents save own children's games"
  on public.game_sessions for insert to authenticated
  with check (
    exists (select 1 from public.learners l where l.id = learner_id and l.parent_id = (select auth.uid()))
    and public.learner_may_continue(learner_id)
  );

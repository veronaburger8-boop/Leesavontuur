-- Phase 5: favourite topics per child, topic requests from parents, and
-- on-site notifications when a requested topic is ready (or declined).
-- Staff see requests with the child's language and level only, never the
-- child's name.

-- ------------------------------------------------------------------ favourite topics

create table public.learner_topics (
  learner_id uuid not null references public.learners (id) on delete cascade,
  topic text not null references public.topics (key) on update cascade on delete cascade,
  created_at timestamptz not null default now(),
  primary key (learner_id, topic)
);

alter table public.learner_topics enable row level security;
revoke all on public.learner_topics from anon;
revoke update on public.learner_topics from authenticated;

create policy "Parents manage own learners' topics"
  on public.learner_topics for all to authenticated
  using (exists (select 1 from public.learners l where l.id = learner_id and l.parent_id = (select auth.uid())))
  with check (exists (select 1 from public.learners l where l.id = learner_id and l.parent_id = (select auth.uid())));

-- At most 4 favourite topics per child (the site asks for 2 to 4).
create function public.learner_topics_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.learner_topics where learner_id = new.learner_id) >= 4 then
    raise exception 'topic_limit: at most 4 favourite topics per child';
  end if;
  return new;
end;
$$;

create trigger learner_topics_limit
  before insert on public.learner_topics
  for each row execute function public.learner_topics_limit();

-- ------------------------------------------------------------------ topic requests

create type public.topic_request_status as enum ('received', 'preparing', 'ready', 'declined');

create table public.topic_requests (
  id bigint generated always as identity primary key,
  parent_id uuid not null references public.profiles (id) on delete cascade,
  learner_id uuid references public.learners (id) on delete set null,
  request text not null check (char_length(request) between 2 and 60),
  -- The child's language and level when the request was made.
  language public.language not null,
  level smallint not null check (level between 1 and 15),
  status public.topic_request_status not null default 'received',
  -- The topic the admin linked the request to.
  topic text references public.topics (key) on update cascade on delete set null,
  reply text check (char_length(reply) <= 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index topic_requests_parent_idx on public.topic_requests (parent_id, created_at desc);
create index topic_requests_open_idx on public.topic_requests (status, topic);

alter table public.topic_requests enable row level security;
revoke all on public.topic_requests from anon;
-- Parents add requests through request_topic() only; staff change the status,
-- linked topic and reply only.
revoke insert, update, delete on public.topic_requests from authenticated;
grant update (status, topic, reply) on public.topic_requests to authenticated;

create policy "Parents read own requests; staff read all"
  on public.topic_requests for select to authenticated
  using (parent_id = (select auth.uid()) or (select public.is_staff()));

create policy "Staff handle requests"
  on public.topic_requests for update to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

-- Whether a published lesson exists for a topic in a language at a level.
create function public.topic_has_lessons(p_topic text, p_language public.language, p_level smallint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.content_items
    where type = 'lesson' and status = 'published' and topic = p_topic and language = p_language and level = p_level
  );
$$;

revoke execute on function public.topic_has_lessons(text, public.language, smallint) from public, anon;
grant execute on function public.topic_has_lessons(text, public.language, smallint) to authenticated;

-- A parent asks for a topic for one child in one language. The level is taken
-- from the child's current level. At most 5 open requests per parent.
create function public.request_topic(p_request text, p_learner_id uuid, p_language public.language)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_level smallint;
  v_id bigint;
  v_text text := regexp_replace(trim(coalesce(p_request, '')), '\s+', ' ', 'g');
begin
  if (select auth.uid()) is null then
    raise exception 'not_signed_in';
  end if;
  if char_length(v_text) < 2 or char_length(v_text) > 60 then
    raise exception 'request_length: 2 to 60 characters';
  end if;
  select ll.level into v_level
  from public.learners l
  join public.learner_languages ll on ll.learner_id = l.id and ll.language = p_language
  where l.id = p_learner_id and l.parent_id = (select auth.uid());
  if v_level is null then
    raise exception 'not_your_child';
  end if;
  if (select count(*) from public.topic_requests
      where parent_id = (select auth.uid()) and status in ('received', 'preparing')) >= 5 then
    raise exception 'request_limit: at most 5 open requests';
  end if;
  insert into public.topic_requests (parent_id, learner_id, request, language, level)
  values ((select auth.uid()), p_learner_id, v_text, p_language, v_level)
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.request_topic(text, uuid, public.language) from public, anon;
grant execute on function public.request_topic(text, uuid, public.language) to authenticated;

-- Linking a request to a topic marks it "being prepared", or "ready" straight
-- away when lessons for that topic already exist at the child's level.
create function public.topic_requests_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  if new.topic is not null and new.status in ('received', 'preparing') then
    if public.topic_has_lessons(new.topic, new.language, new.level) then
      new.status := 'ready';
    elsif new.status = 'received' then
      new.status := 'preparing';
    end if;
  end if;
  if new.status = 'ready' and new.topic is null then
    raise exception 'ready_needs_topic: link the request to a topic first';
  end if;
  return new;
end;
$$;

create trigger topic_requests_before_update
  before update on public.topic_requests
  for each row execute function public.topic_requests_before_update();

-- ------------------------------------------------------------------ notifications about requests

alter table public.notifications
  add column topic_request_id bigint references public.topic_requests (id) on delete cascade;

-- Tells the parent on the site when their request is ready or declined.
create function public.topic_requests_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status in ('ready', 'declined') and old.status is distinct from new.status then
    insert into public.notifications (parent_id, learner_id, kind, language, level, topic_request_id)
    values (new.parent_id, new.learner_id, 'topic_' || new.status, new.language, new.level, new.id);
  end if;
  return new;
end;
$$;

create trigger topic_requests_notify
  after update on public.topic_requests
  for each row execute function public.topic_requests_notify();

-- When a lesson is published, open requests for its topic, language and level
-- become ready (which notifies the parents).
create function public.content_items_ready_requests()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.type = 'lesson' and new.status = 'published' and new.topic is not null
     and (tg_op = 'INSERT' or old.status is distinct from 'published' or old.topic is distinct from new.topic) then
    update public.topic_requests
    set status = 'ready'
    where topic = new.topic and language = new.language and level = new.level
      and status in ('received', 'preparing');
  end if;
  return new;
end;
$$;

create trigger content_items_ready_requests
  after insert or update on public.content_items
  for each row execute function public.content_items_ready_requests();

-- ------------------------------------------------------------------ AI drafting log

-- Every "Draft passages" run, so the admin can see what was asked and what it cost.
create table public.draft_runs (
  id bigint generated always as identity primary key,
  created_by uuid references public.profiles (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  language public.language not null,
  level smallint not null,
  topic text references public.topics (key) on update cascade on delete set null,
  requested integer not null,
  saved integer not null default 0,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  error text
);

alter table public.draft_runs enable row level security;
revoke all on public.draft_runs from anon;
revoke update, delete on public.draft_runs from authenticated;

create policy "Staff read draft runs"
  on public.draft_runs for select to authenticated
  using ((select public.is_staff()));

create policy "Staff log draft runs"
  on public.draft_runs for insert to authenticated
  with check ((select public.is_staff()));

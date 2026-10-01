-- Eye-movement games (brief, section 7): Catch the firefly, Find it and
-- Jumping words. No camera is used. Each child's difficulty per game is
-- remembered so the next session starts where the last one ended. Time
-- played appears in the parent report; games never count towards lesson scores.

-- Allow the new games in the time log.
alter table public.game_sessions drop constraint game_sessions_game_check;
alter table public.game_sessions
  add constraint game_sessions_game_check check (game in ('galgie', 'vuurvliegie', 'soek', 'springwoorde'));

create table public.game_progress (
  learner_id uuid not null references public.learners (id) on delete cascade,
  game text not null check (game in ('vuurvliegie', 'soek', 'springwoorde')),
  -- Difficulty from 1 (easiest) to 20.
  step smallint not null default 1 check (step between 1 and 20),
  updated_at timestamptz not null default now(),
  primary key (learner_id, game)
);

alter table public.game_progress enable row level security;
revoke all on public.game_progress from anon;

create policy "Parents manage own children's game progress"
  on public.game_progress for all to authenticated
  using (exists (select 1 from public.learners l where l.id = learner_id and l.parent_id = (select auth.uid())))
  with check (exists (select 1 from public.learners l where l.id = learner_id and l.parent_id = (select auth.uid())));

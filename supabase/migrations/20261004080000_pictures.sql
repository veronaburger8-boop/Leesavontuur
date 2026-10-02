-- Word-card pictures (brief, section 11: pictures for Levels 1–2). The
-- pictures are small black-and-white line drawings, stored in the database
-- as compressed WebP and served at /pictures/<id>. They contain no personal
-- information, so anyone may view them; only staff add or remove them.

create table public.pictures (
  id uuid primary key default gen_random_uuid(),
  mime text not null default 'image/webp' check (mime in ('image/webp', 'image/png', 'image/jpeg')),
  -- Base64-encoded image, at most about 400 KB.
  data text not null check (char_length(data) <= 550000),
  -- Where the picture came from (a file name or the generator's address), for the admin.
  source text check (char_length(source) <= 500),
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null default auth.uid()
);

alter table public.pictures enable row level security;
grant select on public.pictures to anon, authenticated;
revoke insert, update, delete on public.pictures from anon;
revoke update on public.pictures from authenticated;

create policy "Pictures are public"
  on public.pictures for select to anon, authenticated
  using (true);

create policy "Staff add pictures"
  on public.pictures for insert to authenticated
  with check ((select public.is_staff()));

create policy "Staff remove pictures"
  on public.pictures for delete to authenticated
  using ((select public.is_staff()));

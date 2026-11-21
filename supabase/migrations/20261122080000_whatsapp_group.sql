-- The parents' WhatsApp support group. A parent may say they would like to
-- join (when signing up, on the parent home page or on My account), and may
-- give a phone number so the owner can contact them. Both are optional. The
-- parent then gets a "Join on WhatsApp" button with the group's invite link.
-- Only the parent and the admin can see a parent's number (not reviewers).

create table public.parent_contacts (
  parent_id uuid primary key references public.profiles (id) on delete cascade default auth.uid(),
  -- Stored as +27821234567 (the site tidies up what the parent typed).
  phone text check (phone is null or phone ~ '^\+[0-9]{9,15}$'),
  wants_group boolean not null default false,
  -- The parent closed the invitation card on the parent home page.
  card_closed boolean not null default false,
  updated_at timestamptz not null default now()
);

comment on table public.parent_contacts is 'Optional phone number and WhatsApp support group wish of a parent. Readable by the parent and the admin only.';

alter table public.parent_contacts enable row level security;
revoke all on public.parent_contacts from anon;
grant select, insert, update, delete on public.parent_contacts to authenticated;

create policy "Parents read their own contact details; the admin reads all"
  on public.parent_contacts for select to authenticated
  using (parent_id = (select auth.uid()) or (select public.is_admin()));

create policy "Parents add their own contact details"
  on public.parent_contacts for insert to authenticated
  with check (parent_id = (select auth.uid()));

create policy "Parents change their own contact details"
  on public.parent_contacts for update to authenticated
  using (parent_id = (select auth.uid()))
  with check (parent_id = (select auth.uid()));

create policy "Parents remove their own contact details"
  on public.parent_contacts for delete to authenticated
  using (parent_id = (select auth.uid()));

-- The group's invite link (one row). Signed-in parents may read it so they can
-- join; only the admin changes it. Empty = no group yet, so nothing is shown.
create table public.support_group (
  id smallint primary key default 1 check (id = 1),
  invite_link text not null default '' check (invite_link = '' or invite_link ~ '^https://chat\.whatsapp\.com/[A-Za-z0-9]{10,40}$'),
  updated_at timestamptz not null default now()
);

insert into public.support_group (id) values (1);

alter table public.support_group enable row level security;
revoke all on public.support_group from anon;
revoke insert, delete on public.support_group from authenticated;

create policy "Signed-in users read the support group link"
  on public.support_group for select to authenticated
  using (true);

create policy "Admin changes the support group link"
  on public.support_group for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- A parent who ticks "invite me to the WhatsApp group" when signing up. (The
-- phone number is never sent with the sign-up: the parent adds it later in the
-- parent area, so it is not kept in the login system.)
create or replace function public.handle_new_user()
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
  if new.raw_user_meta_data ->> 'whatsapp_group' = 'true' then
    insert into public.parent_contacts (parent_id, wants_group) values (new.id, true);
  end if;
  return new;
end;
$$;

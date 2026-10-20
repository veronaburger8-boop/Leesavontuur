-- Paying by bank transfer (EFT), while card payments (PayFast) wait for
-- approval. Parents see the owner's banking details and their own payment
-- reference; the owner marks each family as paid on Admin → Families, which
-- moves their "paid until" date on by a month. Card payments are shown to
-- parents only when the owner switches them on.

insert into public.app_settings (key, value, description) values
  ('card_payments', 0, 'Card payments through PayFast shown to parents (1) or not (0)');

-- The owner's banking details for EFT (one row). Parents may read them so they
-- can pay; only the admin changes them. Kept in the database, not in the code.
create table public.eft_details (
  id smallint primary key default 1 check (id = 1),
  bank text not null default '' check (char_length(bank) <= 80),
  account_name text not null default '' check (char_length(account_name) <= 80),
  account_number text not null default '' check (char_length(account_number) <= 30),
  branch_code text not null default '' check (char_length(branch_code) <= 20),
  account_type text not null default '' check (char_length(account_type) <= 30),
  updated_at timestamptz not null default now()
);

insert into public.eft_details (id) values (1);

alter table public.eft_details enable row level security;
revoke all on public.eft_details from anon;
revoke insert, delete on public.eft_details from authenticated;

create policy "Signed-in users read the EFT details"
  on public.eft_details for select to authenticated
  using (true);

create policy "Admin changes the EFT details"
  on public.eft_details for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

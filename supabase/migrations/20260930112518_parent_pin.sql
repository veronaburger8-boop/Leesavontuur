-- Leesavontuur – Phase 4 (Reports and parent area)
--
-- A 4-digit PIN that protects the parent area while a child uses the device
-- (brief, section 5). The PIN is stored only as a bcrypt hash. After 5 wrong
-- tries the PIN is locked for 5 minutes.

alter table public.profiles
  add column pin_hash text,
  add column pin_failures smallint not null default 0,
  add column pin_locked_until timestamptz;

-- Sets or removes (null) the signed-in parent's PIN.
create function public.set_parent_pin(p_pin text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_pin is not null and p_pin !~ '^[0-9]{4}$' then
    raise exception 'pin_must_be_4_digits';
  end if;
  update public.profiles
    set pin_hash = case when p_pin is null then null else extensions.crypt(p_pin, extensions.gen_salt('bf')) end,
        pin_failures = 0,
        pin_locked_until = null
    where id = (select auth.uid());
end;
$$;

-- Checks the signed-in parent's PIN: 'ok', 'wrong', 'locked' or 'no_pin'.
create function public.check_parent_pin(p_pin text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
begin
  select * into v_profile from public.profiles where id = (select auth.uid()) for update;
  if not found or v_profile.pin_hash is null then
    return 'no_pin';
  end if;
  if v_profile.pin_locked_until is not null and v_profile.pin_locked_until > now() then
    return 'locked';
  end if;
  if extensions.crypt(coalesce(p_pin, ''), v_profile.pin_hash) = v_profile.pin_hash then
    update public.profiles set pin_failures = 0, pin_locked_until = null where id = v_profile.id;
    return 'ok';
  end if;
  update public.profiles
    set pin_failures = case when v_profile.pin_failures + 1 >= 5 then 0 else v_profile.pin_failures + 1 end,
        pin_locked_until = case when v_profile.pin_failures + 1 >= 5 then now() + interval '5 minutes' else null end
    where id = v_profile.id;
  return case when v_profile.pin_failures + 1 >= 5 then 'locked' else 'wrong' end;
end;
$$;

-- Whether the signed-in parent has a PIN (without revealing the hash).
create function public.has_parent_pin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select pin_hash is not null from public.profiles where id = (select auth.uid());
$$;

revoke execute on function public.set_parent_pin(text) from public, anon;
revoke execute on function public.check_parent_pin(text) from public, anon;
revoke execute on function public.has_parent_pin() from public, anon;
grant execute on function public.set_parent_pin(text) to authenticated;
grant execute on function public.check_parent_pin(text) to authenticated;
grant execute on function public.has_parent_pin() to authenticated;

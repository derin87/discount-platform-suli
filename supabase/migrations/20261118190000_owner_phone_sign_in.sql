create table dashka_private.owner_login_phone (
  phone text primary key check (phone ~ '^\+9647[0-9]{9}$'),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  verified_at timestamptz not null,
  window_start timestamptz not null default now(),
  attempts integer not null default 0
);

revoke all on dashka_private.owner_login_phone from public, anon, authenticated;

-- Charge a login attempt atomically, including simultaneous requests.
create function public.dashka_begin_owner_sign_in(login_phone text) returns text
language sql security definer set search_path = ''
as $$
  update dashka_private.owner_login_phone p
  set attempts = case when p.window_start <= now() - interval '10 minutes' then 1 else p.attempts + 1 end,
      window_start = case when p.window_start <= now() - interval '10 minutes' then now() else p.window_start end
  from auth.users u
  where p.phone = login_phone and u.id = p.user_id and u.email_confirmed_at is not null
    and (p.attempts < 8 or p.window_start <= now() - interval '10 minutes')
  returning u.email
$$;

revoke all on function public.dashka_begin_owner_sign_in(text) from public, anon, authenticated;
grant execute on function public.dashka_begin_owner_sign_in(text) to service_role;

export const SUPABASE_SETUP_SQL = `-- Create a simple settings table for the shared access password
create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- Store each shared cookbook group as a JSON blob
create table if not exists public.catalogs (
  id uuid primary key default gen_random_uuid(),
  group_code text unique not null,
  group_name text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Allow admin SQL changes from the app (protected by admin_password_hash).
create or replace function public.run_admin_sql(sql text, password_hash text)
returns void
language plpgsql
security definer
as $$
declare
  stored_hash text;
begin
  select value into stored_hash
  from public.site_settings
  where key = 'admin_password_hash';

  if stored_hash is null or stored_hash = '' then
    raise exception 'Admin password not set';
  end if;

  if stored_hash <> password_hash then
    raise exception 'Invalid admin password';
  end if;

  execute sql;
end;
$$;

grant execute on function public.run_admin_sql(text, text) to anon;
`;

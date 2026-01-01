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
`;

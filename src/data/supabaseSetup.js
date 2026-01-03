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

-- Create a public storage bucket for cookbook cover uploads
insert into storage.buckets (id, name, public)
values ('cookbook_storage', 'cookbook_storage', true)
on conflict do nothing;

-- Allow public read access to cookbook covers
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public cookbook storage read'
  ) then
    create policy "Public cookbook storage read"
      on storage.objects
      for select
      using (bucket_id = 'cookbook_storage');
  end if;
end $$;

-- Allow anonymous uploads/updates for cookbook covers
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Anonymous cookbook storage write'
  ) then
    create policy "Anonymous cookbook storage write"
      on storage.objects
      for insert
      with check (bucket_id = 'cookbook_storage');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Anonymous cookbook storage update'
  ) then
    create policy "Anonymous cookbook storage update"
      on storage.objects
      for update
      using (bucket_id = 'cookbook_storage')
      with check (bucket_id = 'cookbook_storage');
  end if;
end $$;
`;

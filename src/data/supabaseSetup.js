export const SUPABASE_SETUP_SQL = `-- Create a simple settings table for the shared access password
create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

-- Store each shared cookbook group as a JSON blob
create table if not exists public.catalogs (
  id uuid primary key default gen_random_uuid(),
  group_code text unique not null,
  group_name text,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.catalogs enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'site_settings'
      and policyname = 'Public site settings read'
  ) then
    create policy "Public site settings read"
      on public.site_settings
      for select
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'site_settings'
      and policyname = 'Public site settings insert'
  ) then
    create policy "Public site settings insert"
      on public.site_settings
      for insert
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'site_settings'
      and policyname = 'Public site settings update'
  ) then
    create policy "Public site settings update"
      on public.site_settings
      for update
      using (true)
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'catalogs'
      and policyname = 'Public catalogs read'
  ) then
    create policy "Public catalogs read"
      on public.catalogs
      for select
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'catalogs'
      and policyname = 'Public catalogs insert'
  ) then
    create policy "Public catalogs insert"
      on public.catalogs
      for insert
      with check (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'catalogs'
      and policyname = 'Public catalogs update'
  ) then
    create policy "Public catalogs update"
      on public.catalogs
      for update
      using (true)
      with check (true);
  end if;
end $$;

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

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

-- Normalized catalog tables
create table if not exists public.catalog_groups (
  id uuid primary key default gen_random_uuid(),
  group_code text unique not null,
  group_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.catalog_groups enable row level security;

create table if not exists public.recipes (
  group_id uuid not null references public.catalog_groups(id) on delete cascade,
  id text not null,
  name text not null,
  source_type text,
  cookbook_title text,
  cuisine text,
  page text,
  url text,
  rating integer,
  duration_minutes integer,
  notes text,
  times_cooked integer not null default 0,
  last_cooked timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (group_id, id)
);

alter table public.recipes enable row level security;

create table if not exists public.cookbooks (
  group_id uuid not null references public.catalog_groups(id) on delete cascade,
  title text not null,
  cover_url text,
  updated_at timestamptz not null default now(),
  primary key (group_id, title)
);

alter table public.cookbooks enable row level security;

create table if not exists public.cuisines (
  group_id uuid not null references public.catalog_groups(id) on delete cascade,
  name text not null,
  updated_at timestamptz not null default now(),
  primary key (group_id, name)
);

alter table public.cuisines enable row level security;

create table if not exists public.logs (
  group_id uuid not null references public.catalog_groups(id) on delete cascade,
  id text not null,
  recipe_id text,
  name text not null,
  cuisine text,
  cookbook_title text,
  date date,
  meal text,
  timestamp timestamptz,
  note text,
  created_at timestamptz not null default now(),
  primary key (group_id, id),
  foreign key (group_id, recipe_id) references public.recipes(group_id, id) on delete set null
);

alter table public.logs enable row level security;

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

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'catalog_groups'
      and policyname = 'Public catalog groups read'
  ) then
    create policy "Public catalog groups read"
      on public.catalog_groups
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
      and tablename = 'catalog_groups'
      and policyname = 'Public catalog groups insert'
  ) then
    create policy "Public catalog groups insert"
      on public.catalog_groups
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
      and tablename = 'catalog_groups'
      and policyname = 'Public catalog groups update'
  ) then
    create policy "Public catalog groups update"
      on public.catalog_groups
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
      and tablename = 'catalog_groups'
      and policyname = 'Public catalog groups delete'
  ) then
    create policy "Public catalog groups delete"
      on public.catalog_groups
      for delete
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'recipes'
      and policyname = 'Public recipes read'
  ) then
    create policy "Public recipes read"
      on public.recipes
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
      and tablename = 'recipes'
      and policyname = 'Public recipes insert'
  ) then
    create policy "Public recipes insert"
      on public.recipes
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
      and tablename = 'recipes'
      and policyname = 'Public recipes update'
  ) then
    create policy "Public recipes update"
      on public.recipes
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
      and tablename = 'recipes'
      and policyname = 'Public recipes delete'
  ) then
    create policy "Public recipes delete"
      on public.recipes
      for delete
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'cookbooks'
      and policyname = 'Public cookbooks read'
  ) then
    create policy "Public cookbooks read"
      on public.cookbooks
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
      and tablename = 'cookbooks'
      and policyname = 'Public cookbooks insert'
  ) then
    create policy "Public cookbooks insert"
      on public.cookbooks
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
      and tablename = 'cookbooks'
      and policyname = 'Public cookbooks update'
  ) then
    create policy "Public cookbooks update"
      on public.cookbooks
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
      and tablename = 'cookbooks'
      and policyname = 'Public cookbooks delete'
  ) then
    create policy "Public cookbooks delete"
      on public.cookbooks
      for delete
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'cuisines'
      and policyname = 'Public cuisines read'
  ) then
    create policy "Public cuisines read"
      on public.cuisines
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
      and tablename = 'cuisines'
      and policyname = 'Public cuisines insert'
  ) then
    create policy "Public cuisines insert"
      on public.cuisines
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
      and tablename = 'cuisines'
      and policyname = 'Public cuisines update'
  ) then
    create policy "Public cuisines update"
      on public.cuisines
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
      and tablename = 'cuisines'
      and policyname = 'Public cuisines delete'
  ) then
    create policy "Public cuisines delete"
      on public.cuisines
      for delete
      using (true);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'logs'
      and policyname = 'Public logs read'
  ) then
    create policy "Public logs read"
      on public.logs
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
      and tablename = 'logs'
      and policyname = 'Public logs insert'
  ) then
    create policy "Public logs insert"
      on public.logs
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
      and tablename = 'logs'
      and policyname = 'Public logs update'
  ) then
    create policy "Public logs update"
      on public.logs
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
      and tablename = 'logs'
      and policyname = 'Public logs delete'
  ) then
    create policy "Public logs delete"
      on public.logs
      for delete
      using (true);
  end if;
end $$;

-- Migrate existing catalog JSON into normalized tables (safe to re-run)
insert into public.catalog_groups (group_code, group_name, updated_at)
select group_code, group_name, updated_at
from public.catalogs
on conflict (group_code) do update
  set group_name = excluded.group_name,
      updated_at = excluded.updated_at;

with catalog_data as (
  select catalogs.*, groups.id as group_id
  from public.catalogs
  join public.catalog_groups groups
    on groups.group_code = catalogs.group_code
)
insert into public.recipes (
  group_id,
  id,
  name,
  source_type,
  cookbook_title,
  cuisine,
  page,
  url,
  rating,
  duration_minutes,
  notes,
  times_cooked,
  last_cooked,
  updated_at
)
select
  catalog_data.group_id,
  recipe->>'id' as id,
  recipe->>'name' as name,
  recipe->>'sourceType' as source_type,
  recipe->>'cookbookTitle' as cookbook_title,
  recipe->>'cuisine' as cuisine,
  recipe->>'page' as page,
  recipe->>'url' as url,
  nullif(recipe->>'rating', '')::int as rating,
  nullif(recipe->>'durationMinutes', '')::int as duration_minutes,
  recipe->>'notes' as notes,
  coalesce(nullif(recipe->>'timesCooked', '')::int, 0) as times_cooked,
  nullif(recipe->>'lastCooked', '')::timestamptz as last_cooked,
  catalog_data.updated_at
from catalog_data,
  jsonb_array_elements(coalesce(catalog_data.data->'recipes', '[]'::jsonb)) as recipe
on conflict (group_id, id) do update
  set name = excluded.name,
      source_type = excluded.source_type,
      cookbook_title = excluded.cookbook_title,
      cuisine = excluded.cuisine,
      page = excluded.page,
      url = excluded.url,
      rating = excluded.rating,
      duration_minutes = excluded.duration_minutes,
      notes = excluded.notes,
      times_cooked = excluded.times_cooked,
      last_cooked = excluded.last_cooked,
      updated_at = excluded.updated_at;

with catalog_data as (
  select catalogs.*, groups.id as group_id
  from public.catalogs
  join public.catalog_groups groups
    on groups.group_code = catalogs.group_code
)
insert into public.cookbooks (
  group_id,
  title,
  cover_url,
  updated_at
)
select
  catalog_data.group_id,
  case
    when jsonb_typeof(cookbook) = 'string' then cookbook #>> '{}'
    else cookbook->>'title'
  end as title,
  case
    when jsonb_typeof(cookbook) = 'object' then cookbook->>'coverUrl'
    else ''
  end as cover_url,
  catalog_data.updated_at
from catalog_data,
  jsonb_array_elements(coalesce(catalog_data.data->'cookbooks', '[]'::jsonb)) as cookbook
on conflict (group_id, title) do update
  set cover_url = excluded.cover_url,
      updated_at = excluded.updated_at;

with catalog_data as (
  select catalogs.*, groups.id as group_id
  from public.catalogs
  join public.catalog_groups groups
    on groups.group_code = catalogs.group_code
)
insert into public.cuisines (
  group_id,
  name,
  updated_at
)
select
  catalog_data.group_id,
  cuisine #>> '{}' as name,
  catalog_data.updated_at
from catalog_data,
  jsonb_array_elements(coalesce(catalog_data.data->'cuisines', '[]'::jsonb)) as cuisine
on conflict (group_id, name) do update
  set updated_at = excluded.updated_at;

with catalog_data as (
  select catalogs.*, groups.id as group_id
  from public.catalogs
  join public.catalog_groups groups
    on groups.group_code = catalogs.group_code
)
insert into public.logs (
  group_id,
  id,
  recipe_id,
  name,
  cuisine,
  cookbook_title,
  date,
  meal,
  timestamp,
  note
)
select
  catalog_data.group_id,
  entry->>'id' as id,
  entry->>'recipeId' as recipe_id,
  entry->>'name' as name,
  entry->>'cuisine' as cuisine,
  entry->>'cookbookTitle' as cookbook_title,
  nullif(entry->>'date', '')::date as date,
  entry->>'meal' as meal,
  nullif(entry->>'timestamp', '')::timestamptz as timestamp,
  entry->>'note' as note
from catalog_data,
  jsonb_array_elements(coalesce(catalog_data.data->'logs', '[]'::jsonb)) as entry
on conflict (group_id, id) do update
  set recipe_id = excluded.recipe_id,
      name = excluded.name,
      cuisine = excluded.cuisine,
      cookbook_title = excluded.cookbook_title,
      date = excluded.date,
      meal = excluded.meal,
      timestamp = excluded.timestamp,
      note = excluded.note;

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

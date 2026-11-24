-- ChargeWise backend foundation
-- Run with: supabase db push
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'member' check (role in ('member','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_chargewise_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email,''),'@',1))
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_chargewise_user_created on auth.users;
create trigger on_chargewise_user_created
after insert on auth.users
for each row execute procedure public.handle_new_chargewise_user();

create or replace function public.is_chargewise_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create table if not exists public.charging_stations (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_id text not null,
  name text not null,
  operator text,
  city text not null default 'Bengaluru',
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  connector text,
  max_power text,
  access text,
  opening_hours text,
  source_url text,
  raw_tags jsonb not null default '{}'::jsonb,
  is_verified boolean not null default false,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_id)
);

create index if not exists charging_stations_city_idx on public.charging_stations(city);
create index if not exists charging_stations_location_idx on public.charging_stations(latitude, longitude);
create index if not exists charging_stations_operator_idx on public.charging_stations(operator);

create table if not exists public.saved_stations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  source_id text not null,
  station_name text not null,
  latitude double precision not null,
  longitude double precision not null,
  operator text,
  created_at timestamptz not null default now(),
  unique (user_id, source, source_id)
);
create index if not exists saved_stations_user_idx on public.saved_stations(user_id, created_at desc);

create table if not exists public.station_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  report_type text not null check (report_type in (
    'station_closed','wrong_location','connector_incorrect','power_incorrect',
    'access_issue','hours_incorrect','suggest_new_station','other'
  )),
  station_source text,
  station_source_id text,
  station_name text not null,
  latitude double precision,
  longitude double precision,
  description text not null check (char_length(description) between 12 and 2000),
  evidence_url text,
  status text not null default 'pending' check (status in ('pending','reviewing','accepted','rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists station_reports_user_idx on public.station_reports(reporter_id, created_at desc);
create index if not exists station_reports_status_idx on public.station_reports(status, created_at desc);

create table if not exists public.station_sync_runs (
  id uuid primary key default gen_random_uuid(),
  started_by uuid references auth.users(id) on delete set null,
  source text not null default 'openstreetmap',
  result_count integer not null default 0,
  status text not null check (status in ('success','failed')),
  message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.charging_stations enable row level security;
alter table public.saved_stations enable row level security;
alter table public.station_reports enable row level security;
alter table public.station_sync_runs enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.charging_stations to anon, authenticated;
grant select, insert, update, delete on public.saved_stations to authenticated;
grant select, insert on public.station_reports to authenticated;
grant select on public.profiles to authenticated;
grant select on public.station_sync_runs to authenticated;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles for select to authenticated
using (id = auth.uid() or public.is_chargewise_admin());

drop policy if exists "Public can read station inventory" on public.charging_stations;
create policy "Public can read station inventory"
on public.charging_stations for select to anon, authenticated
using (true);

drop policy if exists "Admins manage station inventory" on public.charging_stations;
create policy "Admins manage station inventory"
on public.charging_stations for all to authenticated
using (public.is_chargewise_admin())
with check (public.is_chargewise_admin());

drop policy if exists "Users manage their saved stations" on public.saved_stations;
create policy "Users manage their saved stations"
on public.saved_stations for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users submit their own station reports" on public.station_reports;
create policy "Users submit their own station reports"
on public.station_reports for insert to authenticated
with check (reporter_id = auth.uid() and status = 'pending');

drop policy if exists "Users read their own reports" on public.station_reports;
create policy "Users read their own reports"
on public.station_reports for select to authenticated
using (reporter_id = auth.uid() or public.is_chargewise_admin());

drop policy if exists "Admins review reports" on public.station_reports;
create policy "Admins review reports"
on public.station_reports for update to authenticated
using (public.is_chargewise_admin())
with check (public.is_chargewise_admin());

drop policy if exists "Admins read sync history" on public.station_sync_runs;
create policy "Admins read sync history"
on public.station_sync_runs for select to authenticated
using (public.is_chargewise_admin());

-- Intentionally no anon insert policy for reports and no client-side role update policy.
-- Promote the project owner to admin only from the trusted Supabase SQL editor:
-- update public.profiles set role = 'admin' where email = 'your-owner-email@example.com';

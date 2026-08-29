-- CropXense Supabase Schema
-- Run this in Supabase SQL Editor or via migration

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'farmer' check (role in ('farmer', 'officer', 'expert')),
  phone text,
  village text,
  district text not null default 'akola',
  language text default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup via trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role, phone, district, language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'farmer'),
    coalesce(new.raw_user_meta_data->>'mobile', null),
    coalesce(new.raw_user_meta_data->>'district', 'akola'),
    coalesce(new.raw_user_meta_data->>'language', 'en')
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    role = excluded.role,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- FARMS
-- ============================================================
create table if not exists farms (
  id text primary key,
  owner_id uuid references profiles(id) on delete set null,
  name text not null,
  owner_name text not null default '',
  village text not null default '',
  district text not null default '',
  state text default 'Maharashtra',
  crop_id text not null default '',
  crop_name text,
  variety text,
  area_ha numeric(8,2) not null default 1.0,
  sowing_date date,
  growth_stage text default 'vegetative',
  lat numeric(10,6),
  lon numeric(10,6),
  parcel jsonb default '[]'::jsonb,
  health_status text default 'healthy' check (health_status in ('healthy', 'at_risk', 'affected')),
  is_archived boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_farms_owner on farms(owner_id);
create index if not exists idx_farms_district on farms(district);

-- ============================================================
-- CROP SCANS
-- ============================================================
create table if not exists crop_scans (
  id text primary key,
  farmer_id uuid references profiles(id) on delete set null,
  farm_id text references farms(id) on delete set null,
  case_id text,
  image_url text,
  crop text,
  crop_stage text,
  observed_symptoms jsonb default '[]'::jsonb,
  image_quality text default 'good',
  leaf_detected boolean default true,
  suspected_issue text,
  confidence numeric(5,2),
  image_validation jsonb,
  notes text,
  is_follow_up boolean default false,
  previous_scan_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_scans_farmer on crop_scans(farmer_id);
create index if not exists idx_scans_farm on crop_scans(farm_id);
create index if not exists idx_scans_case on crop_scans(case_id);

-- ============================================================
-- CROP HEALTH CASES
-- ============================================================
create table if not exists crop_health_cases (
  id text primary key,
  case_number text,
  farmer_id uuid references profiles(id) on delete set null,
  farm_id text references farms(id) on delete set null,
  scan_id text,
  reported_by uuid references profiles(id) on delete set null,
  threat_type text,
  threat_id text,
  threat_name text,
  description text,
  crop_id text,
  district text,
  severity smallint default 1 check (severity between 1 and 5),
  confidence numeric(5,2),
  status text not null default 'detected' check (status in (
    'detected','awaiting_validation','field_investigation','expert_review',
    'expert_confirmed','field_confirmed','advisory_issued',
    'follow_up_required','resolved','rejected'
  )),
  priority smallint,
  affected_area_ha numeric(8,2),
  detected_via jsonb default '[]'::jsonb,
  evidence jsonb default '[]'::jsonb,
  risk_assessment jsonb,
  notes text,
  advisory_id text,
  review_id text,
  feedback_ids jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists idx_cases_farmer on crop_health_cases(farmer_id);
create index if not exists idx_cases_farm on crop_health_cases(farm_id);
create index if not exists idx_cases_status on crop_health_cases(status);
create index if not exists idx_cases_district on crop_health_cases(district);

-- ============================================================
-- CASE EVIDENCE
-- ============================================================
create table if not exists case_evidence (
  id uuid primary key default uuid_generate_v4(),
  case_id text references crop_health_cases(id) on delete cascade,
  source_type text not null,
  source_id text,
  description text,
  supports boolean default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- OFFICER VISITS
-- ============================================================
create table if not exists officer_visits (
  id text primary key,
  case_id text references crop_health_cases(id) on delete cascade,
  officer_id uuid references profiles(id) on delete set null,
  farm_id text references farms(id) on delete set null,
  officer_name text,
  scheduled_for date,
  completed_at timestamptz,
  location text,
  observation text,
  recommendation text,
  finding text,
  status text default 'scheduled' check (status in ('scheduled','completed','missed')),
  created_at timestamptz not null default now()
);

create index if not exists idx_visits_case on officer_visits(case_id);
create index if not exists idx_visits_officer on officer_visits(officer_id);

-- ============================================================
-- EXPERT REVIEWS
-- ============================================================
create table if not exists expert_reviews (
  id text primary key,
  case_id text references crop_health_cases(id) on delete cascade,
  expert_id uuid references profiles(id) on delete set null,
  reviewer_name text,
  decision text check (decision in ('confirmed','rejected','needs_field_visit','needs_lab_test','corrected')),
  confirmed_diagnosis text,
  corrected_threat text,
  confidence numeric(5,2),
  notes text,
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists idx_reviews_case on expert_reviews(case_id);

-- ============================================================
-- ADVISORIES
-- ============================================================
create table if not exists advisories (
  id text primary key,
  case_id text references crop_health_cases(id) on delete cascade,
  issued_by uuid references profiles(id) on delete set null,
  farm_id text references farms(id) on delete set null,
  title text,
  summary text,
  cultural_action jsonb default '[]'::jsonb,
  biological_control jsonb default '[]'::jsonb,
  chemical_referral jsonb default '[]'::jsonb,
  action_window text,
  reinspect_after_days smallint default 5,
  status text default 'active',
  acknowledged boolean default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_advisories_case on advisories(case_id);
create index if not exists idx_advisories_farm on advisories(farm_id);

-- ============================================================
-- FOLLOW UPS
-- ============================================================
create table if not exists follow_ups (
  id text primary key,
  case_id text references crop_health_cases(id) on delete cascade,
  farmer_id uuid references profiles(id) on delete set null,
  due_date date,
  completed_at timestamptz,
  observation text,
  health_status text,
  action text,
  reason text,
  notes text,
  done boolean default false,
  result_scan_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_followups_case on follow_ups(case_id);

-- ============================================================
-- PEST TRAPS
-- ============================================================
create table if not exists pest_traps (
  id text primary key,
  farm_id text references farms(id) on delete set null,
  district text,
  trap_type text check (trap_type in ('pheromone','light','sticky')),
  pest_id text,
  pest text,
  etl_threshold numeric,
  lat numeric(10,6),
  lon numeric(10,6),
  status text default 'active' check (status in ('active','needs_lure','damaged')),
  installed_on date,
  created_at timestamptz not null default now()
);

-- ============================================================
-- PEST READINGS
-- ============================================================
create table if not exists pest_readings (
  id uuid primary key default uuid_generate_v4(),
  trap_id text references pest_traps(id) on delete cascade,
  count integer not null default 0,
  threshold integer,
  recorded_at date not null default current_date
);

-- ============================================================
-- WEATHER OBSERVATIONS
-- ============================================================
create table if not exists weather_observations (
  id uuid primary key default uuid_generate_v4(),
  district text not null,
  temperature_max numeric(5,1),
  temperature_min numeric(5,1),
  humidity numeric(5,1),
  rainfall_mm numeric(6,1),
  leaf_wetness_hours numeric(4,1),
  wind_speed numeric(5,1),
  observed_at date not null default current_date
);

create index if not exists idx_weather_district on weather_observations(district);

-- ============================================================
-- SENSORS
-- ============================================================
create table if not exists sensors (
  id text primary key,
  farm_id text references farms(id) on delete set null,
  district text,
  type text,
  status text default 'online',
  lat numeric(10,6),
  lon numeric(10,6),
  last_seen timestamptz,
  battery integer,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SENSOR READINGS
-- ============================================================
create table if not exists sensor_readings (
  id uuid primary key default uuid_generate_v4(),
  sensor_id text references sensors(id) on delete cascade,
  t timestamptz not null,
  value numeric(8,2),
  unit text
);

-- ============================================================
-- FARMER FEEDBACK
-- ============================================================
create table if not exists farmer_feedback (
  id text primary key,
  case_id text references crop_health_cases(id) on delete cascade,
  farmer_id uuid references profiles(id) on delete set null,
  farm_id text,
  message text,
  observation text check (observation in ('improving','no_change','worsening')),
  rating smallint,
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ENABLE REALTIME
-- ============================================================
alter publication supabase_realtime add table crop_health_cases;
alter publication supabase_realtime add table expert_reviews;
alter publication supabase_realtime add table advisories;
alter publication supabase_realtime add table follow_ups;
alter publication supabase_realtime add table officer_visits;
alter publication supabase_realtime add table farms;

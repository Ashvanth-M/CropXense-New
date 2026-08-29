-- CropXense Row Level Security Policies
-- Run AFTER schema.sql

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table farms enable row level security;
alter table crop_scans enable row level security;
alter table crop_health_cases enable row level security;
alter table case_evidence enable row level security;
alter table officer_visits enable row level security;
alter table expert_reviews enable row level security;
alter table advisories enable row level security;
alter table follow_ups enable row level security;
alter table pest_traps enable row level security;
alter table pest_readings enable row level security;
alter table weather_observations enable row level security;
alter table sensors enable row level security;
alter table sensor_readings enable row level security;
alter table farmer_feedback enable row level security;

-- Helper: get current user's role
create or replace function public.get_user_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- ============================================================
-- PROFILES
-- ============================================================
create policy "Users can view own profile"
  on profiles for select using (id = auth.uid());

create policy "Users can update own profile"
  on profiles for update using (id = auth.uid());

create policy "Officers and experts can view all profiles"
  on profiles for select using (
    get_user_role() in ('officer', 'expert')
  );

-- ============================================================
-- FARMS
-- ============================================================
-- Farmers see their own farms
create policy "Farmers see own farms"
  on farms for select using (
    owner_id = auth.uid() or get_user_role() in ('officer', 'expert')
  );

create policy "Farmers create own farms"
  on farms for insert with check (owner_id = auth.uid());

create policy "Farmers update own farms"
  on farms for update using (owner_id = auth.uid());

create policy "Farmers delete own farms"
  on farms for delete using (owner_id = auth.uid());

-- Officers/experts can see all farms for regional ops
create policy "Officers update farm status"
  on farms for update using (get_user_role() = 'officer');

-- ============================================================
-- CROP SCANS
-- ============================================================
create policy "Farmers see own scans"
  on crop_scans for select using (
    farmer_id = auth.uid() or get_user_role() in ('officer', 'expert')
  );

create policy "Farmers create scans"
  on crop_scans for insert with check (farmer_id = auth.uid());

-- ============================================================
-- CROP HEALTH CASES
-- ============================================================
-- All authenticated users can read cases (needed for cross-role visibility)
create policy "Authenticated users read cases"
  on crop_health_cases for select using (auth.uid() is not null);

create policy "Farmers create cases"
  on crop_health_cases for insert with check (
    farmer_id = auth.uid() or reported_by = auth.uid()
  );

create policy "Officers update case status"
  on crop_health_cases for update using (
    get_user_role() in ('officer', 'expert')
  );

create policy "Farmers update own cases"
  on crop_health_cases for update using (farmer_id = auth.uid());

-- ============================================================
-- CASE EVIDENCE
-- ============================================================
create policy "Authenticated read evidence"
  on case_evidence for select using (auth.uid() is not null);

create policy "Authenticated insert evidence"
  on case_evidence for insert with check (auth.uid() is not null);

-- ============================================================
-- OFFICER VISITS
-- ============================================================
create policy "Authenticated read visits"
  on officer_visits for select using (auth.uid() is not null);

create policy "Officers create visits"
  on officer_visits for insert with check (
    get_user_role() = 'officer'
  );

create policy "Officers update visits"
  on officer_visits for update using (
    get_user_role() = 'officer'
  );

-- ============================================================
-- EXPERT REVIEWS
-- ============================================================
create policy "Authenticated read reviews"
  on expert_reviews for select using (auth.uid() is not null);

create policy "Experts create reviews"
  on expert_reviews for insert with check (
    get_user_role() = 'expert'
  );

-- ============================================================
-- ADVISORIES
-- ============================================================
create policy "Authenticated read advisories"
  on advisories for select using (auth.uid() is not null);

create policy "Experts and officers create advisories"
  on advisories for insert with check (
    get_user_role() in ('officer', 'expert')
  );

create policy "Farmers acknowledge advisories"
  on advisories for update using (auth.uid() is not null);

-- ============================================================
-- FOLLOW UPS
-- ============================================================
create policy "Authenticated read followups"
  on follow_ups for select using (auth.uid() is not null);

create policy "Authenticated create followups"
  on follow_ups for insert with check (auth.uid() is not null);

create policy "Authenticated update followups"
  on follow_ups for update using (auth.uid() is not null);

-- ============================================================
-- PEST TRAPS / READINGS / WEATHER / SENSORS (reference data — read-only for all)
-- ============================================================
create policy "Authenticated read pest_traps"
  on pest_traps for select using (auth.uid() is not null);

create policy "Authenticated read pest_readings"
  on pest_readings for select using (auth.uid() is not null);

create policy "Authenticated read weather"
  on weather_observations for select using (auth.uid() is not null);

create policy "Authenticated read sensors"
  on sensors for select using (auth.uid() is not null);

create policy "Authenticated read sensor_readings"
  on sensor_readings for select using (auth.uid() is not null);

-- ============================================================
-- FARMER FEEDBACK
-- ============================================================
create policy "Authenticated read feedback"
  on farmer_feedback for select using (auth.uid() is not null);

create policy "Farmers create feedback"
  on farmer_feedback for insert with check (farmer_id = auth.uid());

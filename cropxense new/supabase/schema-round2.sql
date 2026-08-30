-- CropXense Round 2 Schema Extensions
-- Run this in Supabase SQL Editor after the base schema

-- ============================================================
-- VOICE REPORTS
-- ============================================================
create table if not exists voice_reports (
  id text primary key,
  farmer_id uuid references profiles(id) on delete set null,
  field_id text references farms(id) on delete set null,
  transcript text not null default '',
  language text default 'en',
  crop text,
  symptoms_text text,
  status text not null default 'submitted' check (status in ('submitted','case_created','reviewed','resolved')),
  case_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_voice_reports_farmer on voice_reports(farmer_id);
create index if not exists idx_voice_reports_case on voice_reports(case_id);

-- ============================================================
-- ASSISTED REPORTS (Officer on behalf of farmer)
-- ============================================================
create table if not exists assisted_reports (
  id text primary key,
  farmer_id uuid references profiles(id) on delete set null,
  officer_id uuid references profiles(id) on delete set null,
  field_id text references farms(id) on delete set null,
  source text not null default 'assisted_report',
  farmer_name text,
  phone text,
  village text,
  crop text,
  symptoms jsonb default '[]'::jsonb,
  notes text,
  officer_observation text,
  photo_url text,
  approximate_area text,
  status text not null default 'submitted' check (status in ('submitted','case_created','reviewed','resolved')),
  case_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_assisted_reports_officer on assisted_reports(officer_id);
create index if not exists idx_assisted_reports_case on assisted_reports(case_id);

-- ============================================================
-- SCHEME INFORMATION
-- ============================================================
create table if not exists scheme_information (
  id text primary key,
  name text not null,
  description text,
  category text,
  eligibility text,
  benefits text,
  documents text,
  application_method text,
  official_source text,
  last_verified_at date
);

-- ============================================================
-- CASE TIMELINE EVENTS
-- ============================================================
create table if not exists case_timeline_events (
  id text primary key,
  case_id text references crop_health_cases(id) on delete cascade,
  event_type text not null check (event_type in (
    'farmer_reported','voice_reported','assisted_reported',
    'ai_assessment','officer_review','field_visit',
    'expert_validation','advisory_issued','farmer_followup','resolved'
  )),
  title text not null,
  detail text,
  actor_role text,
  created_at timestamptz not null default now()
);

create index if not exists idx_timeline_case on case_timeline_events(case_id);

-- ============================================================
-- ADD COLUMNS TO EXISTING TABLES
-- ============================================================

-- Add source tracking to crop_health_cases
alter table crop_health_cases add column if not exists source text default 'scan';
alter table crop_health_cases add column if not exists voice_transcript text;
alter table crop_health_cases add column if not exists ai_assessment jsonb;

-- Add farmer_reported to status check (recreate check constraint)
alter table crop_health_cases drop constraint if exists crop_health_cases_status_check;
alter table crop_health_cases add constraint crop_health_cases_status_check
  check (status in (
    'farmer_reported','detected','awaiting_validation','field_investigation','expert_review',
    'expert_confirmed','field_confirmed','advisory_issued',
    'follow_up_required','resolved','rejected'
  ));

-- ============================================================
-- ENABLE REALTIME ON NEW TABLES
-- ============================================================
alter publication supabase_realtime add table voice_reports;
alter publication supabase_realtime add table assisted_reports;
alter publication supabase_realtime add table case_timeline_events;

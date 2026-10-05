-- ============================================================
-- FEZ OU NÃO FEZ — Supabase schema v2
-- Fresh install / idempotent setup.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area text not null check (area in ('DBA / DP-300','AWS / Data Lake','Inglês')),
  task_title text,
  started_at timestamptz not null default now(),
  planned_start_at timestamptz,
  start_latency_minutes integer,
  finished_at timestamptz,
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  mood text check (mood is null or mood in ('sim','mais-ou-menos','nao')),
  practical_done boolean not null default false,
  notes text,
  learned text,
  doubt text,
  next_action text,
  created_at timestamptz not null default now()
);

alter table public.study_sessions add column if not exists planned_start_at timestamptz;
alter table public.study_sessions add column if not exists start_latency_minutes integer;

create index if not exists idx_study_sessions_user_started on public.study_sessions(user_id, started_at desc);
create index if not exists idx_study_sessions_user_area_started on public.study_sessions(user_id, area, started_at desc);

create table if not exists public.evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id uuid references public.study_sessions(id) on delete set null,
  area text not null check (area in ('DBA / DP-300','AWS / Data Lake','Inglês')),
  description text not null check (length(trim(description)) > 0),
  created_at timestamptz not null default now()
);
create index if not exists idx_evidence_user_created on public.evidence(user_id, created_at desc);
create index if not exists idx_evidence_session on public.evidence(session_id);

create table if not exists public.competencies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area text not null check (area in ('DBA / DP-300','AWS / Data Lake','Inglês')),
  name text not null,
  level smallint not null default 0 check (level between 0 and 5),
  position integer not null default 0,
  updated_at timestamptz not null default now(),
  unique(user_id, area, name)
);
create index if not exists idx_competencies_user_area on public.competencies(user_id, area, position);

create table if not exists public.parking_lot (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic text not null check (length(trim(topic)) > 0),
  created_at timestamptz not null default now()
);
create index if not exists idx_parking_user_created on public.parking_lot(user_id, created_at desc);

alter table public.study_sessions enable row level security;
alter table public.evidence enable row level security;
alter table public.competencies enable row level security;
alter table public.parking_lot enable row level security;

revoke all on table public.study_sessions from anon, authenticated;
revoke all on table public.evidence from anon, authenticated;
revoke all on table public.competencies from anon, authenticated;
revoke all on table public.parking_lot from anon, authenticated;

grant select, insert, update, delete on table public.study_sessions to authenticated;
grant select, insert, update, delete on table public.evidence to authenticated;
grant select, insert, update, delete on table public.competencies to authenticated;
grant select, insert, update, delete on table public.parking_lot to authenticated;

drop policy if exists "study_sessions_select_own" on public.study_sessions;
drop policy if exists "study_sessions_insert_own" on public.study_sessions;
drop policy if exists "study_sessions_update_own" on public.study_sessions;
drop policy if exists "study_sessions_delete_own" on public.study_sessions;
create policy "study_sessions_select_own" on public.study_sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy "study_sessions_insert_own" on public.study_sessions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "study_sessions_update_own" on public.study_sessions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "study_sessions_delete_own" on public.study_sessions for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "evidence_select_own" on public.evidence;
drop policy if exists "evidence_insert_own" on public.evidence;
drop policy if exists "evidence_update_own" on public.evidence;
drop policy if exists "evidence_delete_own" on public.evidence;
create policy "evidence_select_own" on public.evidence for select to authenticated using ((select auth.uid()) = user_id);
create policy "evidence_insert_own" on public.evidence for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "evidence_update_own" on public.evidence for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "evidence_delete_own" on public.evidence for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "competencies_select_own" on public.competencies;
drop policy if exists "competencies_insert_own" on public.competencies;
drop policy if exists "competencies_update_own" on public.competencies;
drop policy if exists "competencies_delete_own" on public.competencies;
create policy "competencies_select_own" on public.competencies for select to authenticated using ((select auth.uid()) = user_id);
create policy "competencies_insert_own" on public.competencies for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "competencies_update_own" on public.competencies for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "competencies_delete_own" on public.competencies for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "parking_select_own" on public.parking_lot;
drop policy if exists "parking_insert_own" on public.parking_lot;
drop policy if exists "parking_update_own" on public.parking_lot;
drop policy if exists "parking_delete_own" on public.parking_lot;
create policy "parking_select_own" on public.parking_lot for select to authenticated using ((select auth.uid()) = user_id);
create policy "parking_insert_own" on public.parking_lot for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "parking_update_own" on public.parking_lot for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "parking_delete_own" on public.parking_lot for delete to authenticated using ((select auth.uid()) = user_id);


-- ============================================================
-- FORGE V5 — Career RPG OS
-- ============================================================
alter table public.study_sessions
  add column if not exists track_id text,
  add column if not exists module_id text;

create index if not exists idx_study_sessions_user_track_module
  on public.study_sessions(user_id, track_id, module_id, started_at desc);

create table if not exists public.module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null check (track_id in ('dba','aws','english')),
  module_id text not null,
  lab_done boolean not null default false,
  evidence_done boolean not null default false,
  breakfix_done boolean not null default false,
  portfolio_done boolean not null default false,
  assessment_score integer check (assessment_score is null or assessment_score between 0 and 100),
  validated_level smallint check (validated_level is null or validated_level between 0 and 5),
  updated_at timestamptz not null default now(),
  unique(user_id, track_id, module_id)
);

create index if not exists idx_module_progress_user_track
  on public.module_progress(user_id, track_id, updated_at desc);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id text not null check (track_id in ('dba','aws','english')),
  module_id text not null,
  score integer not null check (score between 0 and 100),
  validated_level smallint check (validated_level is null or validated_level between 0 and 5),
  summary text,
  strengths jsonb not null default '[]'::jsonb,
  gaps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_assessments_user_created
  on public.assessments(user_id, created_at desc);

create index if not exists idx_assessments_user_module
  on public.assessments(user_id, track_id, module_id, created_at desc);

alter table public.module_progress enable row level security;
alter table public.assessments enable row level security;

revoke all on table public.module_progress from anon, authenticated;
revoke all on table public.assessments from anon, authenticated;

grant select, insert, update, delete on table public.module_progress to authenticated;
grant select, insert, update, delete on table public.assessments to authenticated;

drop policy if exists "module_progress_select_own" on public.module_progress;
drop policy if exists "module_progress_insert_own" on public.module_progress;
drop policy if exists "module_progress_update_own" on public.module_progress;
drop policy if exists "module_progress_delete_own" on public.module_progress;

create policy "module_progress_select_own"
on public.module_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "module_progress_insert_own"
on public.module_progress
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "module_progress_update_own"
on public.module_progress
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "module_progress_delete_own"
on public.module_progress
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "assessments_select_own" on public.assessments;
drop policy if exists "assessments_insert_own" on public.assessments;
drop policy if exists "assessments_update_own" on public.assessments;
drop policy if exists "assessments_delete_own" on public.assessments;

create policy "assessments_select_own"
on public.assessments
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "assessments_insert_own"
on public.assessments
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "assessments_update_own"
on public.assessments
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "assessments_delete_own"
on public.assessments
for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Validação opcional:
-- select table_name from information_schema.tables
-- where table_schema='public'
-- and table_name in ('module_progress','assessments');

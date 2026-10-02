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

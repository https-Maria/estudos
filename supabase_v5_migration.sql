-- FORGE V5 — Career RPG OS
-- Execute este arquivo UMA VEZ no SQL Editor do Supabase.
-- É idempotente: pode ser executado novamente sem apagar dados.

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


-- ============================================================
-- BASE TABLE PERMISSIONS — V5.2
-- Corrige instalações antigas que tinham RLS, mas não GRANT.
-- ============================================================

grant usage on schema public to authenticated;

grant select, insert, update, delete on table public.study_sessions to authenticated;
grant select, insert, update, delete on table public.evidence to authenticated;
grant select, insert, update, delete on table public.competencies to authenticated;
grant select, insert, update, delete on table public.parking_lot to authenticated;
grant select, insert, update, delete on table public.module_progress to authenticated;
grant select, insert, update, delete on table public.assessments to authenticated;

alter table public.study_sessions enable row level security;
alter table public.evidence enable row level security;
alter table public.competencies enable row level security;
alter table public.parking_lot enable row level security;

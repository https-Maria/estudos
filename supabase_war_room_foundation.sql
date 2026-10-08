-- FORGE — War Room foundation
-- Applied to Supabase on 2026-10-08 via tracked migration: war_room_foundation

create table if not exists public.war_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  incident_id text not null,
  track_id text not null check (track_id in ('dba','aws','english')),
  module_id text not null,
  status text not null default 'active' check (status in ('active','resolved','failed','abandoned')),
  current_state text not null default 'start',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  elapsed_minutes integer not null default 0 check (elapsed_minutes >= 0),
  sla_minutes integer not null check (sla_minutes > 0),
  score integer check (score is null or score between 0 and 100),
  technical_score integer check (technical_score is null or technical_score between 0 and 100),
  communication_score integer check (communication_score is null or communication_score between 0 and 100),
  architecture_score integer check (architecture_score is null or architecture_score between 0 and 100),
  business_score integer check (business_score is null or business_score between 0 and 100),
  result text,
  debrief jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_war_runs_user_created
  on public.war_runs(user_id, created_at desc);

create index if not exists idx_war_runs_user_incident
  on public.war_runs(user_id, incident_id, created_at desc);

create table if not exists public.war_events (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.war_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  sequence integer not null check (sequence > 0),
  event_type text not null,
  action_id text,
  payload jsonb not null default '{}'::jsonb,
  time_cost integer not null default 0 check (time_cost >= 0),
  created_at timestamptz not null default now(),
  unique(run_id, sequence)
);

create index if not exists idx_war_events_run_sequence
  on public.war_events(run_id, sequence);

create index if not exists idx_war_events_user_created
  on public.war_events(user_id, created_at desc);

alter table public.war_runs enable row level security;
alter table public.war_events enable row level security;

grant select, insert, update, delete on table public.war_runs to authenticated;
grant select, insert, update, delete on table public.war_events to authenticated;

drop policy if exists "war_runs_select_own" on public.war_runs;
drop policy if exists "war_runs_insert_own" on public.war_runs;
drop policy if exists "war_runs_update_own" on public.war_runs;
drop policy if exists "war_runs_delete_own" on public.war_runs;

create policy "war_runs_select_own"
on public.war_runs for select to authenticated
using ((select auth.uid()) = user_id);

create policy "war_runs_insert_own"
on public.war_runs for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "war_runs_update_own"
on public.war_runs for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "war_runs_delete_own"
on public.war_runs for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "war_events_select_own" on public.war_events;
drop policy if exists "war_events_insert_own" on public.war_events;
drop policy if exists "war_events_update_own" on public.war_events;
drop policy if exists "war_events_delete_own" on public.war_events;

create policy "war_events_select_own"
on public.war_events for select to authenticated
using ((select auth.uid()) = user_id);

create policy "war_events_insert_own"
on public.war_events for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.war_runs r
    where r.id = run_id
      and r.user_id = (select auth.uid())
  )
);

create policy "war_events_update_own"
on public.war_events for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "war_events_delete_own"
on public.war_events for delete to authenticated
using ((select auth.uid()) = user_id);

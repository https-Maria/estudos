-- FORGE — War Room runtime state
-- Applied to Supabase on 2026-10-08 via tracked migration: war_room_runtime_state

alter table public.war_runs
  add column if not exists runtime jsonb not null default '{}'::jsonb;

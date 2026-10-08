-- FORGE — War Room learning integration
-- Applied to Supabase on 2026-10-08 via tracked migration: war_room_learning_integration

alter table public.assessments
  add column if not exists source_type text not null default 'boss_chat'
    check (source_type in ('boss_chat','war_room')),
  add column if not exists source_id text;

create unique index if not exists idx_assessments_user_source
  on public.assessments(user_id, source_type, source_id)
  where source_id is not null;

alter table public.war_runs
  add column if not exists integrated_at timestamptz;

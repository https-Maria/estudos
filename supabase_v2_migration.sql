-- Execute somente se você JÁ rodou a versão anterior do projeto.
alter table public.study_sessions add column if not exists planned_start_at timestamptz;
alter table public.study_sessions add column if not exists start_latency_minutes integer;
create index if not exists idx_study_sessions_user_area_started on public.study_sessions(user_id, area, started_at desc);
create index if not exists idx_evidence_session on public.evidence(session_id);

-- FORGE — HOTFIX de permissões
-- Corrige: "permission denied for table study_sessions"
-- Seguro para executar mais de uma vez.

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
alter table public.module_progress enable row level security;
alter table public.assessments enable row level security;

select
  has_table_privilege('authenticated', 'public.study_sessions', 'select') as study_sessions_select,
  has_table_privilege('authenticated', 'public.study_sessions', 'insert') as study_sessions_insert,
  has_table_privilege('authenticated', 'public.study_sessions', 'update') as study_sessions_update,
  has_table_privilege('authenticated', 'public.evidence', 'insert') as evidence_insert,
  has_table_privilege('authenticated', 'public.module_progress', 'select') as module_progress_select,
  has_table_privilege('authenticated', 'public.assessments', 'select') as assessments_select;

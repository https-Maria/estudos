-- FORGE — Recall foundation
-- Applied to Supabase on 2026-10-08 via tracked migration: recall_foundation

create table if not exists public.recall_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  track_id text not null check (track_id in ('dba','aws','english')),
  module_id text not null,
  stage smallint not null default 0 check (stage between 0 and 6),
  stability integer not null default 0 check (stability >= 0),
  attempts integer not null default 0 check (attempts >= 0),
  successes integer not null default 0 check (successes >= 0),
  last_grade smallint check (last_grade is null or last_grade between 0 and 3),
  last_answered_at timestamptz,
  next_review_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,item_id)
);

create index if not exists idx_recall_progress_due
  on public.recall_progress(user_id,next_review_at);

create table if not exists public.recall_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  track_id text not null check (track_id in ('dba','aws','english')),
  module_id text not null,
  question_type text not null check (question_type in ('mcq','short')),
  answer_text text,
  selected_option text,
  grade smallint not null check (grade between 0 and 3),
  correct boolean,
  feedback jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_recall_attempts_user_created
  on public.recall_attempts(user_id,created_at desc);

create index if not exists idx_recall_attempts_item
  on public.recall_attempts(user_id,item_id,created_at desc);

alter table public.recall_progress enable row level security;
alter table public.recall_attempts enable row level security;

grant select, insert, update, delete on table public.recall_progress to authenticated;
grant select, insert, update, delete on table public.recall_attempts to authenticated;

drop policy if exists "recall_progress_select_own" on public.recall_progress;
drop policy if exists "recall_progress_insert_own" on public.recall_progress;
drop policy if exists "recall_progress_update_own" on public.recall_progress;
drop policy if exists "recall_progress_delete_own" on public.recall_progress;

create policy "recall_progress_select_own"
on public.recall_progress for select to authenticated
using ((select auth.uid()) = user_id);

create policy "recall_progress_insert_own"
on public.recall_progress for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "recall_progress_update_own"
on public.recall_progress for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "recall_progress_delete_own"
on public.recall_progress for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "recall_attempts_select_own" on public.recall_attempts;
drop policy if exists "recall_attempts_insert_own" on public.recall_attempts;
drop policy if exists "recall_attempts_update_own" on public.recall_attempts;
drop policy if exists "recall_attempts_delete_own" on public.recall_attempts;

create policy "recall_attempts_select_own"
on public.recall_attempts for select to authenticated
using ((select auth.uid()) = user_id);

create policy "recall_attempts_insert_own"
on public.recall_attempts for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "recall_attempts_update_own"
on public.recall_attempts for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "recall_attempts_delete_own"
on public.recall_attempts for delete to authenticated
using ((select auth.uid()) = user_id);

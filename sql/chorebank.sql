-- Chore Bank storage. Run once in Supabase: SQL Editor > New query > paste > Run.
-- Only the server (service role key) reads or writes this table.
create table if not exists public.chorebank_kv (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.chorebank_kv enable row level security;
-- No policies on purpose: the browser can never read it directly.

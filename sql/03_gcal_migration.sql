-- ============================================================
-- Clarityboards — Feature #6: Google Calendar Two-Way Sync
-- Migration: sql/03_gcal_migration.sql
--
-- Safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS)
-- Run AFTER 01_recurring_migration.sql and 02_ical_migration.sql
-- ============================================================

-- ── Add GCal columns to items ─────────────────────────────────────────────────

alter table public.items
  add column if not exists gcal_event_id      text,
  add column if not exists gcal_calendar_id   text;

-- Index for quick lookup when syncing back from GCal
create index if not exists items_gcal_event_id_idx
  on public.items (user_id, gcal_event_id)
  where gcal_event_id is not null;

-- ── GCal sync tokens table ────────────────────────────────────────────────────
-- Stores per-user, per-calendar sync tokens for incremental sync (future use)

create table if not exists public.gcal_sync_tokens (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  calendar_id   text        not null default 'primary',
  sync_token    text,
  last_synced   timestamptz,
  created_at    timestamptz not null default now(),
  unique (user_id, calendar_id)
);

alter table public.gcal_sync_tokens enable row level security;

drop policy if exists "Users can view their own gcal tokens" on public.gcal_sync_tokens;
drop policy if exists "Users can insert their own gcal tokens" on public.gcal_sync_tokens;
drop policy if exists "Users can update their own gcal tokens" on public.gcal_sync_tokens;
drop policy if exists "Users can delete their own gcal tokens" on public.gcal_sync_tokens;

create policy "Users can view their own gcal tokens"
  on public.gcal_sync_tokens for select using (auth.uid() = user_id);
create policy "Users can insert their own gcal tokens"
  on public.gcal_sync_tokens for insert with check (auth.uid() = user_id);
create policy "Users can update their own gcal tokens"
  on public.gcal_sync_tokens for update using (auth.uid() = user_id);
create policy "Users can delete their own gcal tokens"
  on public.gcal_sync_tokens for delete using (auth.uid() = user_id);

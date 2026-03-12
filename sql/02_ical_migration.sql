-- ============================================================
-- Clarityboards — Feature #7: iCal Inbound Import
-- Migration: sql/02_ical_migration.sql
--
-- Safe to re-run
-- Run AFTER 01_recurring_migration.sql
-- ============================================================

-- ── Add iCal columns to items ─────────────────────────────────────────────────

alter table public.items
  add column if not exists ical_uid    text,
  add column if not exists ical_sub_id uuid;

create index if not exists items_ical_uid_idx
  on public.items (user_id, ical_uid)
  where ical_uid is not null;

-- ── iCal subscriptions table ──────────────────────────────────────────────────

create table if not exists public.ical_subscriptions (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  url           text        not null,
  label         text,
  default_board text        check (default_board in ('event','study','activity','career','task')),
  last_synced   timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.ical_subscriptions enable row level security;

-- Policies (drop first so re-runs are safe)
drop policy if exists "Users can view their own subscriptions"   on public.ical_subscriptions;
drop policy if exists "Users can insert their own subscriptions" on public.ical_subscriptions;
drop policy if exists "Users can update their own subscriptions" on public.ical_subscriptions;
drop policy if exists "Users can delete their own subscriptions" on public.ical_subscriptions;

create policy "Users can view their own subscriptions"
  on public.ical_subscriptions for select using (auth.uid() = user_id);
create policy "Users can insert their own subscriptions"
  on public.ical_subscriptions for insert with check (auth.uid() = user_id);
create policy "Users can update their own subscriptions"
  on public.ical_subscriptions for update using (auth.uid() = user_id);
create policy "Users can delete their own subscriptions"
  on public.ical_subscriptions for delete using (auth.uid() = user_id);

-- ── Foreign key from items → ical_subscriptions (safe re-run via DO block) ───

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'items_ical_sub_fk'
      and table_name = 'items'
  ) then
    alter table public.items
      add constraint items_ical_sub_fk
      foreign key (ical_sub_id) references public.ical_subscriptions(id);
  end if;
end $$;

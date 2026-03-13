-- ============================================================
-- Clarityboards — Notifications & PWA
-- Migration: sql/05_notifications_migration.sql
-- ============================================================

-- ── Notification preferences ──────────────────────────────────────────────────

create table if not exists public.notification_prefs (
  id              uuid        primary key default gen_random_uuid(),
  user_id         uuid        not null references auth.users(id) on delete cascade unique,
  digest_enabled  boolean     not null default false,
  digest_time     text        not null default '07:00',  -- "HH:MM" user's local pref
  push_enabled    boolean     not null default false,
  push_due_today  boolean     not null default true,
  push_overdue    boolean     not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.notification_prefs enable row level security;

drop policy if exists "Users can view their own prefs"   on public.notification_prefs;
drop policy if exists "Users can insert their own prefs" on public.notification_prefs;
drop policy if exists "Users can update their own prefs" on public.notification_prefs;

create policy "Users can view their own prefs"
  on public.notification_prefs for select using (auth.uid() = user_id);
create policy "Users can insert their own prefs"
  on public.notification_prefs for insert with check (auth.uid() = user_id);
create policy "Users can update their own prefs"
  on public.notification_prefs for update using (auth.uid() = user_id);

-- ── Push subscriptions (Web Push) ────────────────────────────────────────────

create table if not exists public.push_subscriptions (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  endpoint    text        not null unique,
  p256dh      text        not null,
  auth_key    text        not null,
  created_at  timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users can view their push subs"   on public.push_subscriptions;
drop policy if exists "Users can insert their push subs" on public.push_subscriptions;
drop policy if exists "Users can delete their push subs" on public.push_subscriptions;

create policy "Users can view their push subs"
  on public.push_subscriptions for select using (auth.uid() = user_id);
create policy "Users can insert their push subs"
  on public.push_subscriptions for insert with check (auth.uid() = user_id);
create policy "Users can delete their push subs"
  on public.push_subscriptions for delete using (auth.uid() = user_id);

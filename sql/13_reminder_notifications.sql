-- ============================================================
-- Clarityboards — Reminder Notifications (email + SMS)
-- Migration: sql/13_reminder_notifications.sql
-- ============================================================

-- ── Extend notification_prefs with reminder settings ──────────────────────────

alter table public.notification_prefs
  add column if not exists reminder_enabled      boolean     not null default false,
  add column if not exists reminder_channel       text        not null default 'email',  -- 'email' | 'sms' | 'both'
  add column if not exists reminder_default_mins  integer     not null default 60,        -- minutes before event
  add column if not exists reminder_phone         text,                                   -- E.164 format e.g. +15551234567
  add column if not exists quiet_hours_enabled    boolean     not null default false,
  add column if not exists quiet_start            text        not null default '22:00',
  add column if not exists quiet_end              text        not null default '07:00';

-- ── Per-item reminder overrides ───────────────────────────────────────────────

alter table public.items
  add column if not exists reminder_override      boolean     not null default false,     -- true = use item-level settings
  add column if not exists reminder_mins          integer,                                -- null = use user default
  add column if not exists reminder_channel       text,                                   -- null = use user default
  add column if not exists reminder_sent_at       timestamptz;                            -- tracks last sent to prevent duplicates

-- ── Index for efficient cron queries ─────────────────────────────────────────

create index if not exists items_reminder_lookup
  on public.items (user_id, date, reminder_sent_at)
  where date is not null;


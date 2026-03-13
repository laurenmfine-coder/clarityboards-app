-- ============================================================
-- Clarityboards — Zapier Integration
-- Migration: sql/04_zapier_migration.sql
--
-- Safe to re-run
-- Creates: zapier_api_keys, zapier_webhooks tables
-- ============================================================

-- ── API keys table ────────────────────────────────────────────────────────────
-- Each user gets one API key they paste into Zapier to authenticate

create table if not exists public.zapier_api_keys (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  key_hash    text        not null unique,   -- SHA-256 hash of the actual key
  key_prefix  text        not null,          -- First 8 chars shown in UI e.g. "cb_live_"
  label       text        not null default 'Zapier',
  last_used   timestamptz,
  created_at  timestamptz not null default now(),
  unique (user_id)                           -- One key per user for now
);

alter table public.zapier_api_keys enable row level security;

drop policy if exists "Users can view their own api keys"   on public.zapier_api_keys;
drop policy if exists "Users can insert their own api keys" on public.zapier_api_keys;
drop policy if exists "Users can update their own api keys" on public.zapier_api_keys;
drop policy if exists "Users can delete their own api keys" on public.zapier_api_keys;

create policy "Users can view their own api keys"
  on public.zapier_api_keys for select using (auth.uid() = user_id);
create policy "Users can insert their own api keys"
  on public.zapier_api_keys for insert with check (auth.uid() = user_id);
create policy "Users can update their own api keys"
  on public.zapier_api_keys for update using (auth.uid() = user_id);
create policy "Users can delete their own api keys"
  on public.zapier_api_keys for delete using (auth.uid() = user_id);

-- ── Webhooks table ────────────────────────────────────────────────────────────
-- Zapier registers a webhook URL; we POST to it when items are created/updated

create table if not exists public.zapier_webhooks (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  hook_url    text        not null,
  board       text        check (board in ('event','study','activity','career','task')),
  event_type  text        not null default 'item.created'
                          check (event_type in ('item.created','item.updated','item.completed')),
  created_at  timestamptz not null default now()
);

alter table public.zapier_webhooks enable row level security;

drop policy if exists "Users can view their own webhooks"   on public.zapier_webhooks;
drop policy if exists "Users can insert their own webhooks" on public.zapier_webhooks;
drop policy if exists "Users can delete their own webhooks" on public.zapier_webhooks;

create policy "Users can view their own webhooks"
  on public.zapier_webhooks for select using (auth.uid() = user_id);
create policy "Users can insert their own webhooks"
  on public.zapier_webhooks for insert with check (auth.uid() = user_id);
create policy "Users can delete their own webhooks"
  on public.zapier_webhooks for delete using (auth.uid() = user_id);

create index if not exists zapier_webhooks_user_event_idx
  on public.zapier_webhooks (user_id, event_type);

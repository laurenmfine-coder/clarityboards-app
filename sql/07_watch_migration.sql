-- ============================================================
-- Clarityboards — Price & Page Watch Feature
-- Migration: sql/07_watch_migration.sql
-- ============================================================

create table if not exists public.watches (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  title         text        not null,
  url           text        not null,
  watch_type    text        not null default 'price'
                            check (watch_type in ('price','availability','change')),
  target_value  numeric,                        -- target price (for price watches)
  current_value numeric,                        -- last seen price
  current_text  text,                           -- last seen text (for change/availability)
  board         text        not null default 'event'
                            check (board in ('meal','event','study','activity','career','task')),
  alert_item_id uuid,                           -- item created when alert fires
  last_checked  timestamptz,
  last_alerted  timestamptz,
  status        text        not null default 'active'
                            check (status in ('active','paused','alerted')),
  created_at    timestamptz not null default now()
);

alter table public.watches enable row level security;

drop policy if exists "Users can manage their own watches" on public.watches;
create policy "Users can manage their own watches"
  on public.watches for all using (auth.uid() = user_id);

create index if not exists watches_user_status_idx on public.watches (user_id, status);

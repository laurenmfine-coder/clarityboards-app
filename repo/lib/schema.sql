-- ============================================================
-- Clarityboards Database Schema
-- Run this in your Supabase project → SQL Editor → New Query
-- ============================================================

-- Items table: stores all board items for all users
create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  board       text not null check (board in ('event','study','activity','career','task')),
  title       text not null,
  date        date,
  notes       text,
  status      text not null default 'todo',
  checklist   jsonb not null default '[]',
  created_at  timestamptz not null default now()
);

-- Row-level security: users can only see and edit their own items
alter table public.items enable row level security;

create policy "Users can view their own items"
  on public.items for select
  using (auth.uid() = user_id);

create policy "Users can insert their own items"
  on public.items for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own items"
  on public.items for update
  using (auth.uid() = user_id);

create policy "Users can delete their own items"
  on public.items for delete
  using (auth.uid() = user_id);

-- Index for fast per-user queries sorted by date
create index if not exists items_user_date_idx on public.items (user_id, date asc nulls last);

-- ============================================================
-- Board sharing table (placeholder — not yet active in UI)
-- Structure is ready for when sharing is built
-- ============================================================
create table if not exists public.board_shares (
  id          uuid primary key default gen_random_uuid(),
  board       text not null check (board in ('event','study','activity','career','task')),
  owner_id    uuid references auth.users(id) on delete cascade not null,
  member_id   uuid references auth.users(id) on delete cascade not null,
  role        text not null default 'contributor' check (role in ('viewer','contributor','co-owner')),
  created_at  timestamptz not null default now(),
  unique (board, owner_id, member_id)
);

alter table public.board_shares enable row level security;

create policy "Owners can manage their shares"
  on public.board_shares for all
  using (auth.uid() = owner_id);

create policy "Members can view their shares"
  on public.board_shares for select
  using (auth.uid() = member_id);

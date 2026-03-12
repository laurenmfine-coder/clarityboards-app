-- ============================================================
-- Clarityboards Database Schema — Full (Post-Sprint)
-- Includes: original schema + Feature #5 (Recurring) + Feature #7 (iCal Import)
--
-- How to use this file:
--   FRESH database: run this entire file
--   EXISTING database: run only the migration files:
--     sql/01_recurring_migration.sql
--     sql/02_ical_migration.sql
-- ============================================================

-- ── Items table ───────────────────────────────────────────────────────────────
create table if not exists public.items (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        references auth.users(id) on delete cascade not null,
  board         text        not null check (board in ('event','study','activity','career','task')),
  title         text        not null,
  date          date,
  notes         text,
  status        text        not null default 'todo',
  checklist     jsonb       not null default '[]',
  -- Feature #5: recurring items
  recur_rule_id uuid,
  -- Feature #7: iCal inbound import
  ical_uid      text,
  ical_sub_id   uuid,
  -- Feature #6: Google Calendar two-way sync
  gcal_event_id    text,
  gcal_calendar_id text,
  created_at    timestamptz not null default now()
);

alter table public.items enable row level security;

create policy "Users can view their own items"
  on public.items for select using (auth.uid() = user_id);
create policy "Users can insert their own items"
  on public.items for insert with check (auth.uid() = user_id);
create policy "Users can update their own items"
  on public.items for update using (auth.uid() = user_id);
create policy "Users can delete their own items"
  on public.items for delete using (auth.uid() = user_id);

create index if not exists items_user_date_idx
  on public.items (user_id, date asc nulls last);
create index if not exists items_ical_uid_idx
  on public.items (user_id, ical_uid)
  where ical_uid is not null;

-- ── Board shares table ────────────────────────────────────────────────────────
create table if not exists public.board_shares (
  id           uuid primary key default gen_random_uuid(),
  board        text not null check (board in ('event','study','activity','career','task')),
  owner_id     uuid references auth.users(id) on delete cascade not null,
  member_id    uuid references auth.users(id) on delete cascade not null,
  role         text not null default 'contributor' check (role in ('viewer','contributor','co-owner')),
  created_at   timestamptz not null default now(),
  unique (board, owner_id, member_id)
);

alter table public.board_shares enable row level security;

create policy "Owners can manage their shares"
  on public.board_shares for all using (auth.uid() = owner_id);
create policy "Members can view their shares"
  on public.board_shares for select using (auth.uid() = member_id);

-- ── Recurring rules table (Feature #5) ───────────────────────────────────────
create table if not exists public.recurring_rules (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  board         text        not null check (board in ('event','study','activity','career','task')),
  title         text        not null,
  item_template jsonb       not null default '{}',
  frequency     text        not null check (frequency in ('daily','weekly','biweekly','monthly','quarterly','yearly','custom')),
  interval_val  integer     not null default 1,
  day_of_week   integer     check (day_of_week between 0 and 6),
  next_due      date        not null,
  end_date      date,
  created_at    timestamptz not null default now()
);

alter table public.recurring_rules enable row level security;

create policy "Users can view their own rules"
  on public.recurring_rules for select using (auth.uid() = user_id);
create policy "Users can insert their own rules"
  on public.recurring_rules for insert with check (auth.uid() = user_id);
create policy "Users can update their own rules"
  on public.recurring_rules for update using (auth.uid() = user_id);
create policy "Users can delete their own rules"
  on public.recurring_rules for delete using (auth.uid() = user_id);

create index if not exists recurring_rules_next_due_idx
  on public.recurring_rules (next_due asc);

-- Foreign key from items → recurring_rules (add after both tables exist)
alter table public.items
  add constraint if not exists items_recur_rule_fk
  foreign key (recur_rule_id) references public.recurring_rules(id);

-- ── iCal subscriptions table (Feature #7) ────────────────────────────────────
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

create policy "Users can view their own subscriptions"
  on public.ical_subscriptions for select using (auth.uid() = user_id);
create policy "Users can insert their own subscriptions"
  on public.ical_subscriptions for insert with check (auth.uid() = user_id);
create policy "Users can update their own subscriptions"
  on public.ical_subscriptions for update using (auth.uid() = user_id);
create policy "Users can delete their own subscriptions"
  on public.ical_subscriptions for delete using (auth.uid() = user_id);

-- Foreign key from items → ical_subscriptions
alter table public.items
  add constraint if not exists items_ical_sub_fk
  foreign key (ical_sub_id) references public.ical_subscriptions(id);

-- ── GCal sync tokens table (Feature #6) ──────────────────────────────────────
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

create policy "Users can view their own gcal tokens"
  on public.gcal_sync_tokens for select using (auth.uid() = user_id);
create policy "Users can insert their own gcal tokens"
  on public.gcal_sync_tokens for insert with check (auth.uid() = user_id);
create policy "Users can update their own gcal tokens"
  on public.gcal_sync_tokens for update using (auth.uid() = user_id);
create policy "Users can delete their own gcal tokens"
  on public.gcal_sync_tokens for delete using (auth.uid() = user_id);

create index if not exists items_gcal_event_id_idx
  on public.items (user_id, gcal_event_id)
  where gcal_event_id is not null;

-- ── Postgres function: create next recurring item (Feature #5) ───────────────
create or replace function public.create_next_recurring_item(rule_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  r public.recurring_rules%rowtype;
  new_next_due date;
begin
  select * into r from public.recurring_rules where id = rule_id;
  if not found then return; end if;

  insert into public.items (user_id, board, title, date, notes, status, checklist, recur_rule_id)
  values (
    r.user_id,
    r.board,
    r.title,
    r.next_due,
    (r.item_template->>'notes'),
    coalesce(r.item_template->>'status', 'todo'),
    coalesce((r.item_template->'checklist')::jsonb, '[]'::jsonb),
    r.id
  );

  new_next_due := case r.frequency
    when 'daily'     then r.next_due + (r.interval_val * interval '1 day')
    when 'weekly'    then r.next_due + (r.interval_val * interval '7 days')
    when 'biweekly'  then r.next_due + interval '14 days'
    when 'monthly'   then r.next_due + (r.interval_val * interval '1 month')
    when 'quarterly' then r.next_due + interval '3 months'
    when 'yearly'    then r.next_due + interval '1 year'
    when 'custom'    then r.next_due + (r.interval_val * interval '1 day')
    else r.next_due + interval '7 days'
  end;

  if r.end_date is not null and new_next_due > r.end_date then
    delete from public.recurring_rules where id = rule_id;
  else
    update public.recurring_rules set next_due = new_next_due where id = rule_id;
  end if;
end;
$$;

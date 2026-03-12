-- ============================================================
-- Clarityboards — Feature #5: Recurring Items
-- Migration: sql/01_recurring_migration.sql
--
-- Safe to re-run
-- Run this BEFORE 02_ical_migration.sql
-- ============================================================

-- ── Add recur_rule_id column to items ─────────────────────────────────────────

alter table public.items
  add column if not exists recur_rule_id uuid;

-- ── Recurring rules table ─────────────────────────────────────────────────────

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

-- Policies (drop first so re-runs are safe)
drop policy if exists "Users can view their own rules"   on public.recurring_rules;
drop policy if exists "Users can insert their own rules" on public.recurring_rules;
drop policy if exists "Users can update their own rules" on public.recurring_rules;
drop policy if exists "Users can delete their own rules" on public.recurring_rules;

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

-- ── Foreign key from items → recurring_rules (safe re-run via DO block) ──────

do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'items_recur_rule_fk'
      and table_name = 'items'
  ) then
    alter table public.items
      add constraint items_recur_rule_fk
      foreign key (recur_rule_id) references public.recurring_rules(id);
  end if;
end $$;

-- ── Postgres function: create_next_recurring_item ─────────────────────────────

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

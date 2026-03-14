-- ============================================================
-- Clarityboards — TravelBoard
-- Migration: sql/09_travel_migration.sql
-- ============================================================

-- Add 'travel' to the board check constraint on items
ALTER TABLE public.items
  DROP CONSTRAINT IF EXISTS items_board_check;

ALTER TABLE public.items
  ADD CONSTRAINT items_board_check
  CHECK (board IN ('event','study','activity','career','task','meal','travel'));

-- ── Trips ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.trips (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         text        NOT NULL,
  destination   text        NOT NULL,
  start_date    date,
  end_date      date,
  cover_image   text,
  status        text        NOT NULL DEFAULT 'planning'
                            CHECK (status IN ('want-to-go','planning','booked','done')),
  budget        numeric,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own trips" ON public.trips;
CREATE POLICY "Users manage own trips"
  ON public.trips FOR ALL USING (auth.uid() = user_id);

-- ── Place Cards ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.place_cards (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id       uuid        REFERENCES public.trips(id) ON DELETE CASCADE,
  title         text        NOT NULL,
  category      text        NOT NULL DEFAULT 'place'
                            CHECK (category IN ('restaurant','hotel','activity','transport','place','other')),
  address       text,
  url           text,
  cover_image   text,
  notes         text,
  day_number    integer,            -- which day of the trip (1-based, null = unscheduled)
  visit_time    text,               -- e.g. "8:00 AM", "Evening"
  status        text        NOT NULL DEFAULT 'want-to-go'
                            CHECK (status IN ('want-to-go','booked','done','skipped')),
  source        text,               -- e.g. "CityWindow", "Pinterest", "Manual"
  citywindow_id text,               -- ID from CityWindow if imported
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.place_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own place cards" ON public.place_cards;
CREATE POLICY "Users manage own place cards"
  ON public.place_cards FOR ALL USING (auth.uid() = user_id);

-- ── Packing Lists ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.packing_items (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id    uuid        NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  label      text        NOT NULL,
  category   text        NOT NULL DEFAULT 'other'
             CHECK (category IN ('clothing','toiletries','documents','electronics','health','other')),
  packed     boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.packing_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own packing items" ON public.packing_items;
CREATE POLICY "Users manage own packing items"
  ON public.packing_items FOR ALL USING (auth.uid() = user_id);

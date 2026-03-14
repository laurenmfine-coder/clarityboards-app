-- ============================================================
-- Clarityboards — WishlistBoard
-- Migration: sql/10_wishlist_migration.sql
-- ============================================================

-- Add 'wishlist' to items board constraint
ALTER TABLE public.items
  DROP CONSTRAINT IF EXISTS items_board_check;
ALTER TABLE public.items
  ADD CONSTRAINT items_board_check
  CHECK (board IN ('event','study','activity','career','task','meal','travel','wishlist'));

-- Also update watches board constraint
ALTER TABLE public.watches
  DROP CONSTRAINT IF EXISTS watches_board_check;
ALTER TABLE public.watches
  ADD CONSTRAINT watches_board_check
  CHECK (board IN ('meal','event','study','activity','career','task','wishlist'));

-- ── Wishlists (named lists: Birthday, Christmas, Registry…) ─
CREATE TABLE IF NOT EXISTS public.wishlists (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  list_type    text        NOT NULL DEFAULT 'general'
               CHECK (list_type IN ('birthday','christmas','registry','grocery','home','general')),
  description  text,
  share_token  text        UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_public    boolean     NOT NULL DEFAULT false,
  color        text        DEFAULT '#9B6B9E',
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own wishlists" ON public.wishlists;
CREATE POLICY "Users manage own wishlists"
  ON public.wishlists FOR ALL USING (auth.uid() = user_id);

-- Public read via share token (no auth required)
DROP POLICY IF EXISTS "Public read by token" ON public.wishlists;
CREATE POLICY "Public read by token"
  ON public.wishlists FOR SELECT USING (is_public = true);

-- ── Wish Items ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wish_items (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wishlist_id   uuid        NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  title         text        NOT NULL,
  url           text,
  cover_image   text,
  price         numeric,
  price_checked_at timestamptz,
  target_price  numeric,
  notes         text,
  priority      text        NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('high','medium','low')),
  status        text        NOT NULL DEFAULT 'want'
                CHECK (status IN ('want','purchased','received')),
  purchased_by  text,        -- name of person who bought (for shared lists)
  watch_id      uuid        REFERENCES public.watches(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wish_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own wish items" ON public.wish_items;
CREATE POLICY "Users manage own wish items"
  ON public.wish_items FOR ALL USING (auth.uid() = user_id);

-- Public read via joined wishlist
DROP POLICY IF EXISTS "Public read wish items by token" ON public.wish_items;
CREATE POLICY "Public read wish items by token"
  ON public.wish_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wishlists w
      WHERE w.id = wish_items.wishlist_id AND w.is_public = true
    )
  );

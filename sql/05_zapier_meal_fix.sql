-- ============================================================
-- Clarityboards — Fix Zapier webhooks to include 'meal' board
-- Migration: sql/05_zapier_meal_fix.sql
-- Run this in Supabase SQL Editor
-- ============================================================

-- Update the board check constraint on zapier_webhooks to include 'meal'
ALTER TABLE public.zapier_webhooks
  DROP CONSTRAINT IF EXISTS zapier_webhooks_board_check;

ALTER TABLE public.zapier_webhooks
  ADD CONSTRAINT zapier_webhooks_board_check
  CHECK (board IN ('meal','event','study','activity','career','task'));

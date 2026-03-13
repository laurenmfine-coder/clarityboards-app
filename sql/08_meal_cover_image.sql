-- Add cover_image to items for MealBoard recipe cards
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS cover_image text;

-- Add tags and source columns to garden_items table if they do not exist
ALTER TABLE public.garden_items ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE public.garden_items ADD COLUMN IF NOT EXISTS source text;

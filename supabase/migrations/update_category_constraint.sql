-- Drop the old category check constraint to allow the new entry types (Idea, Quote, Reference, Clipping, Observation)
ALTER TABLE public.garden_items DROP CONSTRAINT IF EXISTS garden_items_category_check;

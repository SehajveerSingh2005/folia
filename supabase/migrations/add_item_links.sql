-- Migration: Add item_links table for polymorphic relations
-- Created: 2026-02-25
-- Purpose: Store connections between Garden Notes and Flow Projects

CREATE TABLE IF NOT EXISTS item_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_item_id UUID NOT NULL,
    source_item_type TEXT NOT NULL, -- 'Garden' or 'Project'
    target_item_id UUID NOT NULL,
    target_item_type TEXT NOT NULL, -- 'Garden' or 'Project'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_item_links_source ON item_links(source_item_id);
CREATE INDEX IF NOT EXISTS idx_item_links_target ON item_links(target_item_id);
CREATE INDEX IF NOT EXISTS idx_item_links_user ON item_links(user_id);

-- Add RLS Policies
ALTER TABLE item_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own item links."
ON item_links FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own item links."
ON item_links FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own item links."
ON item_links FOR DELETE
USING (auth.uid() = user_id);

-- Optional: constraint to enforce types
ALTER TABLE item_links ADD CONSTRAINT valid_item_types CHECK (
    source_item_type IN ('Garden', 'Project') AND 
    target_item_type IN ('Garden', 'Project')
);

-- Migration: Add widgets column and convert old layouts
-- Created: 2026-02-14
-- Purpose: Simplify dashboard widget storage from complex grid layouts to simple widget configs

-- Step 1: Add new widgets column
ALTER TABLE user_dashboard_layouts 
ADD COLUMN IF NOT EXISTS widgets JSONB;

-- Step 2: Create migration function
CREATE OR REPLACE FUNCTION migrate_layouts_to_widgets()
RETURNS TABLE(user_id uuid, widgets_created integer) AS $$
BEGIN
  RETURN QUERY
  WITH migrated AS (
    UPDATE user_dashboard_layouts udl
    SET widgets = (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', item->>'i',
          'type', item->>'widget_type',
          'size', CASE 
            -- Wide: spans multiple columns (w >= 5)
            WHEN (item->>'w')::int >= 5 THEN 'wide'
            -- Large: tall widgets (h >= 7)
            WHEN (item->>'h')::int >= 7 THEN 'large'
            -- Medium: standard height (h >= 5)
            WHEN (item->>'h')::int >= 5 THEN 'medium'
            -- Small: compact widgets
            ELSE 'small'
          END,
          'order', (row_num - 1)::int
        )
        ORDER BY row_num
      )
      FROM jsonb_array_elements(udl.layouts->'lg') WITH ORDINALITY AS item(item, row_num)
    )
    WHERE udl.layouts IS NOT NULL 
      AND udl.layouts != 'null'::jsonb
      AND udl.widgets IS NULL
    RETURNING udl.user_id, jsonb_array_length(udl.widgets) as widget_count
  )
  SELECT migrated.user_id, migrated.widget_count
  FROM migrated;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Run migration
SELECT * FROM migrate_layouts_to_widgets();

-- Step 4: Verify migration
-- Check how many users have been migrated
SELECT 
  COUNT(*) FILTER (WHERE widgets IS NOT NULL) as migrated_users,
  COUNT(*) FILTER (WHERE widgets IS NULL AND layouts IS NOT NULL) as pending_users,
  COUNT(*) FILTER (WHERE widgets IS NULL AND layouts IS NULL) as new_users
FROM user_dashboard_layouts;

-- Step 5 (Optional): After verifying widgets work correctly, you can remove the old layouts column
-- DO NOT RUN THIS IMMEDIATELY - Wait until you're confident the new system works!
-- ALTER TABLE user_dashboard_layouts DROP COLUMN IF EXISTS layouts;

-- Step 6: Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_dashboard_layouts_widgets 
ON user_dashboard_layouts USING gin (widgets);

COMMENT ON COLUMN user_dashboard_layouts.widgets IS 
'Simplified widget configuration array. Each widget has: id (uuid), type (string), size (small|medium|large|wide), order (int)';

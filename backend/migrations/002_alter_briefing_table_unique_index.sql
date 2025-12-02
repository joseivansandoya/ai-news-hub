-- migrations/002_alter_briefing_table_unique_index.sql
-- Description: Remove unique constraint on briefings(user_id, date) to allow multiple briefings per day
-- Date: 2025-12-01

-- Remove the unique constraint
ALTER TABLE briefings DROP CONSTRAINT IF EXISTS briefings_user_id_date_key;

-- Record this migration
INSERT INTO schema_migrations (version, name) 
VALUES (2, 'alter_briefing_table_unique_index')
ON CONFLICT (version) DO NOTHING;

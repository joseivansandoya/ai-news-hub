-- migrations/003_add_source_urls_to_stories.sql
-- Description: Add source_urls column to stories table to track multiple sources
-- Date: 2026-02-04

-- Add source_urls column to store array of all URLs covering the same story
ALTER TABLE stories
ADD COLUMN source_urls JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the column
COMMENT ON COLUMN stories.source_urls IS 'Array of all source URLs covering this story (includes primary + duplicates)';

-- Create index for querying stories by source URLs
CREATE INDEX idx_stories_source_urls ON stories USING GIN (source_urls);

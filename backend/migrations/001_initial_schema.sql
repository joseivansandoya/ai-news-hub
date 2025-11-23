-- migrations/001_initial_schema.sql
-- Description: Initial database schema for AI News Hub
-- Date: 2025-11-23

-- Create schema_migrations table for tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TIMESTAMP DEFAULT NOW()
);

-- Users table (minimal for Phase 1)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  first_name TEXT NULL,
  last_name TEXT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Briefings table (one per day per user)
CREATE TABLE briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  metadata JSONB,
  deleted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Stories table (normalized, not JSON in briefings)
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  briefing_id UUID NOT NULL REFERENCES briefings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT[] NOT NULL,
  content TEXT[] NOT NULL,
  source_url TEXT NOT NULL,
  source_name TEXT NOT NULL,
  published_at TIMESTAMP NOT NULL,
  cover_image_url TEXT,
  display_order INTEGER NOT NULL,
  category TEXT,
  importance INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Read states table (tracks user's read/unread status)
CREATE TABLE read_states (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  marked_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, story_id)
);

-- Indexes for query performance
CREATE INDEX idx_briefings_user_date ON briefings(user_id, date);
CREATE INDEX idx_briefings_deleted ON briefings(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_stories_briefing ON stories(briefing_id);
CREATE INDEX idx_stories_published_at ON stories(published_at);
CREATE INDEX idx_read_states_user ON read_states(user_id);

-- Record this migration
INSERT INTO schema_migrations (version, name) 
VALUES (1, 'initial_schema')
ON CONFLICT (version) DO NOTHING;

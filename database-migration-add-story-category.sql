-- Migration: Add story_category column to stories table
-- Date: 2025-09-07
-- Description: Add category field to stories for better filtering and organization

-- Add the story_category column with default value
ALTER TABLE stories 
ADD COLUMN story_category VARCHAR(50) DEFAULT 'ficcion';

-- Create index for better query performance on category filtering
CREATE INDEX IF NOT EXISTS idx_stories_category ON stories(story_category);

-- Update existing stories to have the default category
UPDATE stories 
SET story_category = 'ficcion' 
WHERE story_category IS NULL OR story_category = '';

-- Add constraint to ensure valid categories (optional - can be enforced at application level)
-- ALTER TABLE stories 
-- ADD CONSTRAINT chk_story_category 
-- CHECK (story_category IN ('ficcion', 'romance', 'fantastico', 'terror', 'misterio', 'historico', 'aventuras', 'humor', 'realista', 'no-ficcion', 'experimental'));

-- Comments for documentation
COMMENT ON COLUMN stories.story_category IS 'Literary category/genre of the story (ficcion, romance, fantastico, etc.)';
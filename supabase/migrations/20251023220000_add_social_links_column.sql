-- Add social_links column to user_profiles table
-- This column stores social media links as JSON to replace the old 'website' field

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.social_links IS 'Social media links stored as JSON (Instagram, Twitter, LinkedIn, YouTube, TikTok, Website)';

-- Create GIN index for better JSON query performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_social_links ON user_profiles USING GIN (social_links);

-- Optional: Migrate existing website data to social_links
-- Uncomment if you want to preserve old website links:
-- UPDATE user_profiles
-- SET social_links = jsonb_build_object('website', website)
-- WHERE website IS NOT NULL AND website != '' AND social_links = '{}'::jsonb;

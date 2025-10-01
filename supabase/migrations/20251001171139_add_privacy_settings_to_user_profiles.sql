-- Add privacy settings columns to user_profiles table
-- These columns control what information is visible in public author profiles

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS public_profile BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_bio BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_location BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_website BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_stats BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN user_profiles.public_profile IS 'Whether the user profile is publicly viewable';
COMMENT ON COLUMN user_profiles.show_bio IS 'Whether to show biography in public profile';
COMMENT ON COLUMN user_profiles.show_location IS 'Whether to show location in public profile';
COMMENT ON COLUMN user_profiles.show_website IS 'Whether to show website in public profile';
COMMENT ON COLUMN user_profiles.show_stats IS 'Whether to show statistics (story count, likes) in public profile';

-- Create an index on public_profile for efficient filtering
CREATE INDEX IF NOT EXISTS idx_user_profiles_public_profile ON user_profiles(public_profile);
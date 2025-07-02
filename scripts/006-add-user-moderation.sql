-- Add moderation fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ban_reason TEXT,
ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE;

-- Create index for banned users
CREATE INDEX IF NOT EXISTS idx_profiles_banned ON profiles(banned);

-- Update RLS policies to prevent banned users from posting
DROP POLICY IF EXISTS "Users can insert their own posts" ON posts;
CREATE POLICY "Users can insert their own posts" ON posts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND banned = true
    )
  );

-- Prevent banned users from commenting
DROP POLICY IF EXISTS "Users can insert their own comments" ON comments;
CREATE POLICY "Users can insert their own comments" ON comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND banned = true
    )
  );

-- Prevent banned users from liking
DROP POLICY IF EXISTS "Users can insert their own likes" ON likes;
CREATE POLICY "Users can insert their own likes" ON likes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND banned = true
    )
  );

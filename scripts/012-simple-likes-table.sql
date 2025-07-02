-- Simple approach - just create the likes table with minimal setup
-- Run this if the previous script still has issues

-- Drop and recreate likes table
DROP TABLE IF EXISTS likes;

CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraints after table creation
ALTER TABLE likes ADD CONSTRAINT fk_likes_post_id 
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE;

ALTER TABLE likes ADD CONSTRAINT fk_likes_user_id 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add unique constraint
ALTER TABLE likes ADD CONSTRAINT unique_post_user_like 
  UNIQUE(post_id, user_id);

-- Create indexes
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);

-- Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Create very simple policies
CREATE POLICY "likes_all_access" ON likes FOR ALL USING (true) WITH CHECK (true);

-- Grant permissions
GRANT ALL ON likes TO authenticated;
GRANT ALL ON likes TO anon;
GRANT ALL ON likes TO service_role;

-- Test the table
SELECT 'Likes table created successfully!' as message;
SELECT COUNT(*) as likes_count FROM likes;

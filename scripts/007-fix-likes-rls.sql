-- Drop existing likes policies
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;

-- Create new, more permissive policies for likes
CREATE POLICY "Anyone can view likes" ON likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert likes" ON likes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND 
    NOT EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND banned = true
    )
  );

CREATE POLICY "Users can delete their own likes" ON likes
  FOR DELETE USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
      SELECT id FROM profiles WHERE id = auth.uid()
    )
  );

-- Also ensure service role can access everything
CREATE POLICY "Service role full access to likes" ON likes
  FOR ALL USING (true)
  WITH CHECK (true);

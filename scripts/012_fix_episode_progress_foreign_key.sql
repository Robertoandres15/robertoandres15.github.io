-- Fix episode_progress table to reference public.users instead of auth.users
-- This ensures consistency with other tables and enables proper joins

-- Drop the existing foreign key constraint
ALTER TABLE episode_progress DROP CONSTRAINT IF EXISTS episode_progress_user_id_fkey;

-- Add the correct foreign key constraint to reference public.users
ALTER TABLE episode_progress ADD CONSTRAINT episode_progress_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Update the RLS policy to be more explicit about the relationship
DROP POLICY IF EXISTS "Users can track their own episode progress" ON episode_progress;

CREATE POLICY "Users can track their own episode progress" ON episode_progress
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    watch_party_id IN (
      SELECT watch_party_id FROM watch_party_participants 
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

-- Add an upsert policy for updating progress
CREATE POLICY "Users can update their own episode progress" ON episode_progress
  FOR UPDATE USING (user_id = auth.uid());

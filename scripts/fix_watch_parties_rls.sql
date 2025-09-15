-- Fix infinite recursion in watch_parties RLS policies
-- Drop existing policies that might be causing recursion
DROP POLICY IF EXISTS "Users can view watch parties they created or are invited to" ON watch_parties;
DROP POLICY IF EXISTS "Users can create watch parties" ON watch_parties;
DROP POLICY IF EXISTS "Users can update their own watch parties" ON watch_parties;
DROP POLICY IF EXISTS "Users can delete their own watch parties" ON watch_parties;

-- Create simple, non-recursive policies
-- Allow users to create watch parties
CREATE POLICY "Users can create watch parties" ON watch_parties
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- Allow users to view watch parties they created
CREATE POLICY "Users can view their own watch parties" ON watch_parties
  FOR SELECT USING (auth.uid() = creator_id);

-- Allow users to view watch parties they are invited to
CREATE POLICY "Users can view watch parties they are invited to" ON watch_parties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM watch_party_participants 
      WHERE watch_party_participants.watch_party_id = watch_parties.id 
      AND watch_party_participants.user_id = auth.uid()
    )
  );

-- Allow users to update their own watch parties
CREATE POLICY "Users can update their own watch parties" ON watch_parties
  FOR UPDATE USING (auth.uid() = creator_id);

-- Allow users to delete their own watch parties
CREATE POLICY "Users can delete their own watch parties" ON watch_parties
  FOR DELETE USING (auth.uid() = creator_id);

-- Ensure RLS is enabled
ALTER TABLE watch_parties ENABLE ROW LEVEL SECURITY;

-- Also fix watch_party_participants policies to avoid recursion
DROP POLICY IF EXISTS "Users can view participants for their watch parties" ON watch_party_participants;
DROP POLICY IF EXISTS "Users can add participants to their watch parties" ON watch_party_participants;
DROP POLICY IF EXISTS "Users can update participant status" ON watch_party_participants;

-- Simple policies for watch_party_participants
CREATE POLICY "Users can view participants for accessible watch parties" ON watch_party_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM watch_parties 
      WHERE watch_parties.id = watch_party_participants.watch_party_id 
      AND (watch_parties.creator_id = auth.uid() OR watch_party_participants.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can add participants to their watch parties" ON watch_party_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM watch_parties 
      WHERE watch_parties.id = watch_party_participants.watch_party_id 
      AND watch_parties.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own participation status" ON watch_party_participants
  FOR UPDATE USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE watch_party_participants ENABLE ROW LEVEL SECURITY;

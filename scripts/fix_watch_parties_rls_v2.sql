-- Fix infinite recursion in watch_parties RLS policies - Version 2
-- This version uses the simplest possible policies to avoid any recursion

-- Drop all existing policies completely
DROP POLICY IF EXISTS "Users can view watch parties they created or are invited to" ON watch_parties;
DROP POLICY IF EXISTS "Users can create watch parties" ON watch_parties;
DROP POLICY IF EXISTS "Users can update their own watch parties" ON watch_parties;
DROP POLICY IF EXISTS "Users can delete their own watch parties" ON watch_parties;
DROP POLICY IF EXISTS "Users can view their own watch parties" ON watch_parties;
DROP POLICY IF EXISTS "Users can view watch parties they are invited to" ON watch_parties;

-- Drop all existing participant policies
DROP POLICY IF EXISTS "Users can view participants for their watch parties" ON watch_party_participants;
DROP POLICY IF EXISTS "Users can add participants to their watch parties" ON watch_party_participants;
DROP POLICY IF EXISTS "Users can update participant status" ON watch_party_participants;
DROP POLICY IF EXISTS "Users can view participants for accessible watch parties" ON watch_party_participants;
DROP POLICY IF EXISTS "Users can update their own participation status" ON watch_party_participants;

-- Create the simplest possible policies for watch_parties
-- Only allow creators to do everything with their watch parties
CREATE POLICY "watch_parties_creator_all" ON watch_parties
  FOR ALL USING (auth.uid() = creator_id);

-- Create the simplest possible policies for watch_party_participants  
-- Allow users to see and manage their own participation records
CREATE POLICY "participants_own_records" ON watch_party_participants
  FOR ALL USING (auth.uid() = user_id);

-- Allow watch party creators to manage participants
CREATE POLICY "participants_creator_manage" ON watch_party_participants
  FOR ALL USING (
    auth.uid() IN (
      SELECT creator_id FROM watch_parties 
      WHERE id = watch_party_participants.watch_party_id
    )
  );

-- Ensure RLS is enabled
ALTER TABLE watch_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_party_participants ENABLE ROW LEVEL SECURITY;

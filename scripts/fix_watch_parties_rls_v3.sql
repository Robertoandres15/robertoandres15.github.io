-- Fix infinite recursion in watch_parties RLS policies - Version 3
-- This version completely removes all problematic policies and creates the simplest possible ones

-- Disable RLS temporarily to avoid issues during policy changes
ALTER TABLE watch_parties DISABLE ROW LEVEL SECURITY;
ALTER TABLE watch_party_participants DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies completely to start fresh
DROP POLICY IF EXISTS "Users can view watch parties they're involved in" ON watch_parties;
DROP POLICY IF EXISTS "Users can view watch parties they created or are invited to" ON watch_parties;
DROP POLICY IF EXISTS "Users can create watch parties" ON watch_parties;
DROP POLICY IF EXISTS "Users can update their own watch parties" ON watch_parties;
DROP POLICY IF EXISTS "Users can delete their own watch parties" ON watch_parties;
DROP POLICY IF EXISTS "Users can view their own watch parties" ON watch_parties;
DROP POLICY IF EXISTS "Users can view watch parties they are invited to" ON watch_parties;
DROP POLICY IF EXISTS "Creators can update their watch parties" ON watch_parties;
DROP POLICY IF EXISTS "watch_parties_creator_all" ON watch_parties;

-- Drop ALL existing participant policies
DROP POLICY IF EXISTS "Users can view participants of their watch parties" ON watch_party_participants;
DROP POLICY IF EXISTS "Users can view participants for their watch parties" ON watch_party_participants;
DROP POLICY IF EXISTS "Users can add participants to their watch parties" ON watch_party_participants;
DROP POLICY IF EXISTS "Users can update participant status" ON watch_party_participants;
DROP POLICY IF EXISTS "Users can view participants for accessible watch parties" ON watch_party_participants;
DROP POLICY IF EXISTS "Users can update their own participation status" ON watch_party_participants;
DROP POLICY IF EXISTS "Creators can add participants" ON watch_party_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON watch_party_participants;
DROP POLICY IF EXISTS "participants_own_records" ON watch_party_participants;
DROP POLICY IF EXISTS "participants_creator_manage" ON watch_party_participants;

-- Create the absolute simplest policies that cannot cause recursion
-- For watch_parties: Only creators can do everything
CREATE POLICY "simple_watch_parties_creator" ON watch_parties
  FOR ALL USING (auth.uid() = creator_id);

-- For watch_party_participants: Allow basic operations without cross-table queries
CREATE POLICY "simple_participants_insert" ON watch_party_participants
  FOR INSERT WITH CHECK (true); -- Allow any authenticated user to insert

CREATE POLICY "simple_participants_select" ON watch_party_participants
  FOR SELECT USING (auth.uid() = user_id); -- Users can only see their own participation

CREATE POLICY "simple_participants_update" ON watch_party_participants
  FOR UPDATE USING (auth.uid() = user_id); -- Users can only update their own participation

-- Re-enable RLS
ALTER TABLE watch_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_party_participants ENABLE ROW LEVEL SECURITY;

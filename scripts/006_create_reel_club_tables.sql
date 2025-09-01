-- Create watch parties table
CREATE TABLE IF NOT EXISTS watch_parties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title TEXT NOT NULL,
  poster_path TEXT,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scheduled_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'scheduled', 'watching', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create watch party participants table
CREATE TABLE IF NOT EXISTS watch_party_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  watch_party_id UUID NOT NULL REFERENCES watch_parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(watch_party_id, user_id)
);

-- Create episode progress table for series
CREATE TABLE IF NOT EXISTS episode_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  watch_party_id UUID NOT NULL REFERENCES watch_parties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(watch_party_id, user_id, season_number, episode_number)
);

-- Enable RLS
ALTER TABLE watch_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_party_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE episode_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for watch_parties
CREATE POLICY "Users can view watch parties they're involved in" ON watch_parties
  FOR SELECT USING (
    creator_id = auth.uid() OR 
    id IN (SELECT watch_party_id FROM watch_party_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create watch parties" ON watch_parties
  FOR INSERT WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Creators can update their watch parties" ON watch_parties
  FOR UPDATE USING (creator_id = auth.uid());

-- RLS Policies for watch_party_participants
CREATE POLICY "Users can view participants of their watch parties" ON watch_party_participants
  FOR SELECT USING (
    user_id = auth.uid() OR 
    watch_party_id IN (SELECT id FROM watch_parties WHERE creator_id = auth.uid())
  );

CREATE POLICY "Creators can add participants" ON watch_party_participants
  FOR INSERT WITH CHECK (
    watch_party_id IN (SELECT id FROM watch_parties WHERE creator_id = auth.uid())
  );

CREATE POLICY "Users can update their own participation" ON watch_party_participants
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for episode_progress
CREATE POLICY "Users can view episode progress for their watch parties" ON episode_progress
  FOR SELECT USING (
    user_id = auth.uid() OR 
    watch_party_id IN (SELECT id FROM watch_parties WHERE creator_id = auth.uid()) OR
    watch_party_id IN (SELECT watch_party_id FROM watch_party_participants WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can track their own episode progress" ON episode_progress
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    watch_party_id IN (
      SELECT watch_party_id FROM watch_party_participants 
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

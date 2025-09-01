-- Create tables for friend recommendations system

-- Table to track movies/series that users have marked as "not interested"
CREATE TABLE IF NOT EXISTS user_not_interested (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('movie', 'tv')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tmdb_id, media_type)
);

-- Table to track movies/series that users have marked as "seen"
CREATE TABLE IF NOT EXISTS user_seen (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type VARCHAR(10) NOT NULL CHECK (media_type IN ('movie', 'tv')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tmdb_id, media_type)
);

-- Add RLS policies
ALTER TABLE user_not_interested ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_seen ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_not_interested
CREATE POLICY "Users can manage their own not interested items" ON user_not_interested
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for user_seen
CREATE POLICY "Users can manage their own seen items" ON user_seen
  FOR ALL USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_not_interested_user_id ON user_not_interested(user_id);
CREATE INDEX IF NOT EXISTS idx_user_not_interested_tmdb_id ON user_not_interested(tmdb_id, media_type);
CREATE INDEX IF NOT EXISTS idx_user_seen_user_id ON user_seen(user_id);
CREATE INDEX IF NOT EXISTS idx_user_seen_tmdb_id ON user_seen(tmdb_id, media_type);

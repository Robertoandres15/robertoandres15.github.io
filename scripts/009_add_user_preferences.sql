-- Add user preference fields to the users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS streaming_services TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS likes_theaters TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS theater_companion TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS likes_series TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_series_genres TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_movie_genres TEXT[];

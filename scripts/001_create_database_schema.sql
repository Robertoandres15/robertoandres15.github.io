-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create friends table for friend relationships
CREATE TABLE IF NOT EXISTS public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Create lists table for wishlists and recommendations
CREATE TABLE IF NOT EXISTS public.lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('wishlist', 'recommendations')),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create list_items table for movies/series in lists
CREATE TABLE IF NOT EXISTS public.list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  title TEXT NOT NULL,
  poster_path TEXT,
  overview TEXT,
  release_date DATE,
  rating DECIMAL(3,1),
  note TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(list_id, tmdb_id, media_type)
);

-- Create social_signals table for likes, comments, etc.
CREATE TABLE IF NOT EXISTS public.social_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('list', 'list_item')),
  target_id UUID NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('like', 'comment', 'share')),
  content TEXT, -- for comments
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create feed_activities table for activity feed
CREATE TABLE IF NOT EXISTS public.feed_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('added_to_list', 'created_list', 'liked_list', 'commented_on_list', 'became_friends')),
  target_type TEXT NOT NULL CHECK (target_type IN ('list', 'list_item', 'user')),
  target_id UUID NOT NULL,
  metadata JSONB, -- flexible data for different activity types
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_activities ENABLE ROW LEVEL SECURITY;

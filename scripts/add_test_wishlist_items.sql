-- Add test items to Ana's wishlist to verify match detection works
-- First, let's add Severance to Ana's wishlist (user_id: 8ba6becd-93aa-4c29-ad46-33fba53b5d14)

INSERT INTO list_items (
  list_id,
  tmdb_id,
  title,
  media_type,
  poster_path,
  overview,
  release_date,
  added_at
) VALUES (
  '8ca4331e-3926-4206-86dc-478d8449c493', -- Ana's wishlist ID from debug logs
  95396, -- Severance tmdb_id
  'Severance',
  'tv',
  '/lFf6LLrQjYldcZItzOkGmMMigP7.jpg',
  'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.',
  '2022-02-18',
  NOW()
);

-- Add The Social Network to Ana's wishlist (another item the user has)
INSERT INTO list_items (
  list_id,
  tmdb_id,
  title,
  media_type,
  poster_path,
  overview,
  release_date,
  added_at
) VALUES (
  '8ca4331e-3926-4206-86dc-478d8449c493', -- Ana's wishlist ID
  37799, -- The Social Network tmdb_id
  'The Social Network',
  'movie',
  '/n0ybibhJtQ5icDqTp8eRytcIHJx.jpg',
  'The story of how Harvard student Mark Zuckerberg created the social networking site that would become known as Facebook.',
  '2010-10-01',
  NOW()
);

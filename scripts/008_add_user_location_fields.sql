-- Add location and phone fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Create index on location fields for potential friend discovery features
CREATE INDEX IF NOT EXISTS idx_users_location ON public.users(city, state, zip_code);

-- Make display_name nullable and default to username
ALTER TABLE public.users ALTER COLUMN display_name DROP NOT NULL;

-- Make location fields nullable (if not already)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Update existing records to use username as display_name if display_name is empty
UPDATE public.users SET display_name = username WHERE display_name IS NULL OR display_name = '';

-- Create index for location-based queries
CREATE INDEX IF NOT EXISTS idx_users_location ON public.users(city, state, zip_code) WHERE city IS NOT NULL;

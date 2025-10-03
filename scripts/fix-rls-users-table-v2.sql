-- CRITICAL SECURITY FIX: Enable Row Level Security on users table
-- This prevents users from seeing other users' profile data

-- Step 1: Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Public profiles viewable by friends" ON users;

-- Step 3: Create policy for viewing own profile
-- Users can ONLY view their own profile data
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
USING (auth.uid() = id);

-- Step 4: Create policy for updating own profile
-- Users can ONLY update their own profile data
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Step 5: Create policy for inserting own profile during signup
-- Users can ONLY insert their own profile (id must match auth.uid())
CREATE POLICY "Users can insert own profile"
ON users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Step 6: Verify RLS is enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'users' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✅ RLS is now ENABLED on users table';
  ELSE
    RAISE EXCEPTION '❌ RLS is NOT enabled on users table';
  END IF;
END $$;

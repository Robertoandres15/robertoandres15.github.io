-- Enable Row Level Security on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Policy: Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can only update their own profile  
CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
USING (auth.uid() = id);

-- Policy: Users can insert their own profile during signup
CREATE POLICY "Users can insert own profile"
ON users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

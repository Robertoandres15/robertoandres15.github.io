-- Check current constraint and fix it to allow proper status values
-- First, let's see what the current constraint allows
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'watch_parties_status_check';

-- Drop the existing constraint if it exists
ALTER TABLE watch_parties DROP CONSTRAINT IF EXISTS watch_parties_status_check;

-- Add a new constraint that allows the status values we need
ALTER TABLE watch_parties 
ADD CONSTRAINT watch_parties_status_check 
CHECK (status IN ('pending', 'accepted', 'active', 'completed', 'cancelled'));

-- Also fix the watch_party_participants status constraint if needed
ALTER TABLE watch_party_participants DROP CONSTRAINT IF EXISTS watch_party_participants_status_check;

ALTER TABLE watch_party_participants 
ADD CONSTRAINT watch_party_participants_status_check 
CHECK (status IN ('pending', 'accepted', 'declined'));

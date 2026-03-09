-- Student Management Migration
-- Run this in Supabase Dashboard → SQL Editor

-- Add student profile columns to the users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS year TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS batch TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Verify columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

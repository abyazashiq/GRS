-- Migration: Category Routing & Section Advisors
-- Run this in Supabase Dashboard → SQL Editor → New Query

-- 1. Add assigned teacher to categories (NULL = "general", routes to class advisor)
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS assigned_teacher_email TEXT REFERENCES users(email) ON DELETE SET NULL;

-- 2. Add year and section to users (for students)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS year TEXT,
  ADD COLUMN IF NOT EXISTS section TEXT;

-- 3. Create section_advisors table
--    Maps (year, section) → class advisor teacher
CREATE TABLE IF NOT EXISTS section_advisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year TEXT NOT NULL,
  section TEXT NOT NULL,
  teacher_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  assigned_by_email TEXT REFERENCES users(email),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(year, section)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_section_advisors_year_section ON section_advisors(year, section);
CREATE INDEX IF NOT EXISTS idx_section_advisors_teacher ON section_advisors(teacher_email);
CREATE INDEX IF NOT EXISTS idx_users_year_section ON users(year, section);

-- Enable RLS
ALTER TABLE section_advisors ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read section advisors (needed to resolve routing)
CREATE POLICY "Allow public read section_advisors"
  ON section_advisors FOR SELECT USING (true);

-- Migration: Escalation logic with category-based TTL and admin-defined escalation path
-- Run this in Supabase Dashboard -> SQL Editor

-- 1) Ensure categories support direct teacher routing (idempotent)
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS assigned_teacher_email TEXT REFERENCES users(email) ON DELETE SET NULL;

-- 2) Escalation policies configurable by admins per category
CREATE TABLE IF NOT EXISTS escalation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL UNIQUE REFERENCES categories(name) ON DELETE CASCADE,
  warning_after_hours INTEGER NOT NULL DEFAULT 24 CHECK (warning_after_hours > 0),
  escalate_after_hours INTEGER NOT NULL DEFAULT 48 CHECK (escalate_after_hours > 0),
  critical_after_hours INTEGER NOT NULL DEFAULT 72 CHECK (critical_after_hours > 0),
  inactivity_after_hours INTEGER NOT NULL DEFAULT 24 CHECK (inactivity_after_hours > 0),
  escalation_path TEXT[] NOT NULL DEFAULT ARRAY['teacher', 'admin'],
  auto_escalate BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CHECK (warning_after_hours <= escalate_after_hours),
  CHECK (escalate_after_hours <= critical_after_hours)
);

-- 3) History of escalation transitions
CREATE TABLE IF NOT EXISTS grievance_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES escalation_policies(id) ON DELETE SET NULL,
  from_level INTEGER NOT NULL DEFAULT 0,
  to_level INTEGER NOT NULL,
  escalated_to_role TEXT,
  urgency_score NUMERIC(10,2) NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (to_level >= 1 AND to_level <= 3),
  CHECK (from_level >= 0 AND from_level < to_level)
);

-- 4) Indexes
CREATE INDEX IF NOT EXISTS idx_escalation_policies_category ON escalation_policies(category);
CREATE INDEX IF NOT EXISTS idx_escalations_grievance_created ON grievance_escalations(grievance_id, created_at DESC);

-- 5) Seed one policy per existing category
INSERT INTO escalation_policies (category)
SELECT name FROM categories
ON CONFLICT (category) DO NOTHING;

-- 6) RLS
ALTER TABLE escalation_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievance_escalations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'escalation_policies'
      AND policyname = 'Allow public read escalation policies'
  ) THEN
    CREATE POLICY "Allow public read escalation policies"
      ON escalation_policies FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'grievance_escalations'
      AND policyname = 'Allow public read grievance escalations'
  ) THEN
    CREATE POLICY "Allow public read grievance escalations"
      ON grievance_escalations FOR SELECT
      USING (true);
  END IF;
END $$;

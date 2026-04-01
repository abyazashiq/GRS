-- Migration: add category priority ranking and notification settings for daily email digests
-- Run this in Supabase Dashboard -> SQL Editor

ALTER TABLE escalation_policies
  ADD COLUMN IF NOT EXISTS category_priority INTEGER NOT NULL DEFAULT 3 CHECK (category_priority >= 1 AND category_priority <= 5);

CREATE INDEX IF NOT EXISTS idx_escalation_policies_priority ON escalation_policies(category_priority);

CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton_key TEXT NOT NULL UNIQUE DEFAULT 'default',
  daily_digest_hour_utc INTEGER NOT NULL DEFAULT 4 CHECK (daily_digest_hour_utc >= 0 AND daily_digest_hour_utc <= 23),
  professor_digest_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  hod_digest_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  hod_email TEXT,
  last_professor_digest_date DATE,
  last_hod_digest_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO notification_settings (singleton_key, hod_email)
VALUES ('default', NULL)
ON CONFLICT (singleton_key) DO NOTHING;

ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notification_settings'
      AND policyname = 'Allow public read notification settings'
  ) THEN
    CREATE POLICY "Allow public read notification settings"
      ON notification_settings FOR SELECT USING (true);
  END IF;
END $$;
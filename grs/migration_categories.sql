-- 1. Drop existing constraints
ALTER TABLE grievances DROP CONSTRAINT IF EXISTS grievances_category_fkey;
ALTER TABLE escalation_policies DROP CONSTRAINT IF EXISTS escalation_policies_category_fkey;

-- 2. Add them back with ON UPDATE CASCADE
ALTER TABLE grievances ADD CONSTRAINT grievances_category_fkey FOREIGN KEY (category) REFERENCES categories(name) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE escalation_policies ADD CONSTRAINT escalation_policies_category_fkey FOREIGN KEY (category) REFERENCES categories(name) ON UPDATE CASCADE ON DELETE CASCADE;

-- 3. Add the new stages column using JSONB
ALTER TABLE escalation_policies ADD COLUMN IF NOT EXISTS stages JSONB DEFAULT '[]'::jsonb;

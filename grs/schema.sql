-- Grievance Redressal System Database Schema

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Grievances table
CREATE TABLE grievances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL REFERENCES categories(name) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved')),
  author_id TEXT,
  author_email TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Upvotes table
CREATE TABLE upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
  user_id TEXT,
  user_email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(grievance_id, user_email)
);

-- Comments table
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grievance_id UUID NOT NULL REFERENCES grievances(id) ON DELETE CASCADE,
  author_id TEXT,
  author_email TEXT,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_grievances_category ON grievances(category);
CREATE INDEX idx_grievances_status ON grievances(status);
CREATE INDEX idx_grievances_created ON grievances(created_at DESC);
CREATE INDEX idx_upvotes_grievance ON upvotes(grievance_id);
CREATE INDEX idx_comments_grievance ON comments(grievance_id);

-- Insert default categories
INSERT INTO categories (name, description) VALUES
  ('Hostel', 'Hostel-related grievances'),
  ('Club', 'Club-related grievances'),
  ('Department', 'Department-related grievances'),
  ('CDC', 'Career Development Cell grievances'),
  ('Mentor', 'Mentor/Academic guidance grievances'),
  ('Facilities', 'Campus facilities/infrastructure'),
  ('Other', 'Other grievances');

-- Enable Row Level Security (optional but recommended for security)
ALTER TABLE grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public read, authenticated write
CREATE POLICY "Allow public read grievances" 
  ON grievances FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated insert grievances" 
  ON grievances FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public read upvotes" 
  ON upvotes FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated insert upvotes" 
  ON upvotes FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated delete upvotes" 
  ON upvotes FOR DELETE 
  USING (true);

CREATE POLICY "Allow public read comments" 
  ON comments FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated insert comments" 
  ON comments FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public read categories" 
  ON categories FOR SELECT 
  USING (true);

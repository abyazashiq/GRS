-- Insert or update users with specific roles
INSERT INTO users (email, role, full_name, created_at, updated_at)
VALUES 
  ('abyazashiq@gmail.com', 'admin', 'Admin User', NOW(), NOW()),
  ('yaa281440@gmail.com', 'teacher', 'Teacher User', NOW(), NOW())
ON CONFLICT(email) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = NOW();

-- Verify the changes
SELECT email, role FROM users WHERE email IN ('abyazashiq@gmail.com', 'yaa281440@gmail.com');

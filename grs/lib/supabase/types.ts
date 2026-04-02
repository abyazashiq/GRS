export interface Grievance {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'in-progress' | 'resolved';
  author_id: string | null;
  author_email: string | null;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
  upvotes?: Array<{ count: number }>;
  comments?: Array<{ count: number }>;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  assigned_teacher_email: string | null;
  created_at: string;
}

export interface EscalationPolicy {
  id: string;
  category: string;
  category_priority: number;
  warning_after_hours: number;
  escalate_after_hours: number;
  critical_after_hours: number;
  inactivity_after_hours: number;
  escalation_path: string[];
  auto_escalate: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationSettings {
  id: string;
  singleton_key: string;
  daily_digest_hour_utc: number;
  professor_digest_enabled: boolean;
  hod_digest_enabled: boolean;
  hod_email: string | null;
  last_professor_digest_date: string | null;
  last_hod_digest_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface GrievanceEscalation {
  id: string;
  grievance_id: string;
  policy_id: string | null;
  from_level: number;
  to_level: number;
  escalated_to_role: string | null;
  urgency_score: number;
  reason: string | null;
  created_at: string;
}

export interface SectionAdvisor {
  id: string;
  year: string;
  section: string;
  teacher_email: string;
  assigned_by_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Upvote {
  id: string;
  grievance_id: string;
  user_id: string | null;
  user_email: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  grievance_id: string;
  author_id: string | null;
  author_email: string | null;
  content: string;
  is_anonymous: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  full_name: string | null;
  phone: string | null;
  department: string | null;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  grievance_id: string;
  teacher_email: string;
  assigned_at: string;
  assigned_by_email: string;
  grievance: Grievance;
}

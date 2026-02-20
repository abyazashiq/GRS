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
  upvote_count: number;
  comment_count: number;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
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

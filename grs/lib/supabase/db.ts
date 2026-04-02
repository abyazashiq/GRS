import { supabase } from './client';
import {
  Comment,
  Category,
  Upvote,
  SectionAdvisor,
  EscalationPolicy,
  GrievanceEscalation,
  NotificationSettings,
} from './types';

// ============ GRIEVANCES ============

export async function getGrievances(
  category?: string,
  status?: string,
  sortBy: 'recent' | 'upvotes' = 'recent',
  userEmail?: string,
  userRole?: 'student' | 'teacher' | 'admin'
) {
  let query = supabase
    .from('grievances')
    .select(
      `
      id,
      title,
      description,
      category,
      status,
      author_id,
      author_email,
      is_anonymous,
      visibility,
      created_at,
      updated_at,
      upvotes:upvotes(count),
      comments:comments(count)
    `
    );

  if (category) {
    query = query.eq('category', category);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query.order(
    sortBy === 'upvotes' ? 'created_at' : 'created_at',
    { ascending: false }
  );

  if (error) {
    console.error('Supabase getGrievances error:', error);
    throw new Error(`Failed to fetch grievances: ${error.message}`);
  }

  // Filter based on visibility and user role
  return (data || []).filter((grievance: { author_email: string | null; visibility: 'private' | 'public' }) => {
    // Admins and teachers can see all grievances
    if (userRole === 'admin' || userRole === 'teacher') {
      return true;
    }

    // Students can see:
    // 1. Their own grievances (regardless of visibility)
    // 2. Public grievances from others
    if (grievance.author_email === userEmail) {
      return true;
    }

    return grievance.visibility === 'public';
  });
}

export async function getGrievanceById(id: string) {
  const { data, error } = await supabase
    .from('grievances')
    .select(
      `
      id,
      title,
      description,
      category,
      status,
      author_id,
      author_email,
      is_anonymous,
      created_at,
      updated_at
    `
    )
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createGrievance(
  title: string,
  description: string,
  category: string,
  authorEmail: string | null,
  isAnonymous: boolean,
  visibility: 'private' | 'public' = 'private',
  authorId?: string | null
) {
  const { data, error } = await supabase
    .from('grievances')
    .insert({
      title,
      description,
      category,
      status: 'open',
      author_id: authorId || null,
      author_email: isAnonymous ? null : authorEmail,
      is_anonymous: isAnonymous,
      visibility,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateGrievanceStatus(id: string, status: 'open' | 'in-progress' | 'resolved') {
  // Use UTC ISO timestamp for consistency with database timezone storage
  const updated_at = new Date().toISOString();
  const { data, error } = await supabase
    .from('grievances')
    .update({ status, updated_at })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============ UPVOTES ============

export async function getUpvotes(grievanceId: string) {
  const { data, error } = await supabase
    .from('upvotes')
    .select('*')
    .eq('grievance_id', grievanceId);

  if (error) throw error;
  return data as Upvote[];
}

export async function addUpvote(
  grievanceId: string,
  userEmail: string,
  userId?: string | null
) {
  // Check if already upvoted
  const { data: existing } = await supabase
    .from('upvotes')
    .select('id')
    .eq('grievance_id', grievanceId)
    .eq('user_email', userEmail)
    .single();

  if (existing) {
    throw new Error('Already upvoted this grievance');
  }

  const { data, error } = await supabase
    .from('upvotes')
    .insert({
      grievance_id: grievanceId,
      user_id: userId || null,
      user_email: userEmail,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeUpvote(grievanceId: string, userEmail: string) {
  const { error } = await supabase
    .from('upvotes')
    .delete()
    .eq('grievance_id', grievanceId)
    .eq('user_email', userEmail);

  if (error) throw error;
}

export async function getUpvoteCount(grievanceId: string) {
  const { count, error } = await supabase
    .from('upvotes')
    .select('*', { count: 'exact', head: true })
    .eq('grievance_id', grievanceId);

  if (error) throw error;
  return count || 0;
}

// ============ COMMENTS ============

export async function getComments(grievanceId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('grievance_id', grievanceId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Comment[];
}

export async function addComment(
  grievanceId: string,
  content: string,
  authorEmail: string | null,
  isAnonymous: boolean,
  authorId?: string | null
) {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      grievance_id: grievanceId,
      author_id: authorId || null,
      author_email: isAnonymous ? null : authorEmail,
      content,
      is_anonymous: isAnonymous,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============ CATEGORIES ============

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Supabase getCategories error:', error);
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }
  return data as Category[];
}

export async function addCategory(name: string, description?: string) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, description: description || null })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(id: string, newName: string, description?: string) {
  const { data, error } = await supabase
    .from('categories')
    .update({ name: newName, description: description || null })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============ ESCALATION POLICIES ============

export async function getEscalationPolicies() {
  const { data, error } = await supabase
    .from('escalation_policies')
    .select('*')
    .order('category', { ascending: true });

  if (error) throw error;
  return (data || []) as EscalationPolicy[];
}

export async function getEscalationPolicyForCategory(categoryName: string) {
  const { data, error } = await supabase
    .from('escalation_policies')
    .select('*')
    .eq('category', categoryName)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return (data || null) as EscalationPolicy | null;
}

export async function getNotificationSettings() {
  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('singleton_key', 'default')
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return (data || null) as NotificationSettings | null;
}

export async function getGrievanceEscalationHistory(grievanceId: string) {
  const { data, error } = await supabase
    .from('grievance_escalations')
    .select('*')
    .eq('grievance_id', grievanceId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as GrievanceEscalation[];
}

// ============ USERS ============

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found, which is okay
    throw error;
  }
  return data || null;
}

export async function createUser(email: string, fullName?: string, role: 'student' | 'teacher' | 'admin' = 'student') {
  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      full_name: fullName || null,
      role,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateUserRole(email: string, role: 'student' | 'teacher' | 'admin') {
  const { data, error } = await supabase
    .from('users')
    .update({ role })
    .eq('email', email)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getAllUsers(role?: 'student' | 'teacher' | 'admin') {
  let query = supabase.from('users').select('*');

  if (role) {
    query = query.eq('role', role);
  }

  const { data, error } = await query.order('email', { ascending: true });

  if (error) throw error;
  return data;
}

// ============ GRIEVANCE ASSIGNMENTS ============

export async function assignGrievanceToTeacher(
  grievanceId: string,
  teacherEmail: string,
  assignedByEmail: string
) {
  const { data, error } = await supabase
    .from('grievance_assignments')
    .insert({
      grievance_id: grievanceId,
      teacher_email: teacherEmail,
      assigned_by_email: assignedByEmail,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTeacherAssignments(teacherEmail: string) {
  const { data, error } = await supabase
    .from('grievance_assignments')
    .select('id, grievance_id, teacher_email, assigned_at')
    .eq('teacher_email', teacherEmail)
    .order('assigned_at', { ascending: false });

  if (error) throw error;

  // Fetch grievances separately to avoid Supabase foreign key issues
  if (data && data.length > 0) {
    const grievanceIds = data.map((a: { grievance_id: string }) => a.grievance_id);
    const { data: grievances, error: grievError } = await supabase
      .from('grievances')
      .select('*')
      .in('id', grievanceIds);

    if (grievError) throw grievError;

    // Map grievances back to assignments
    return data.map((a: { grievance_id: string }) => ({
      ...a,
      grievance: grievances?.find((g: { id: string }) => g.id === a.grievance_id),
    }));
  }

  return [];
}

export async function unassignGrievance(grievanceId: string, teacherEmail: string) {
  const { error } = await supabase
    .from('grievance_assignments')
    .delete()
    .eq('grievance_id', grievanceId)
    .eq('teacher_email', teacherEmail);

  if (error) throw error;
}

// ============ TEACHER RESPONSES ============

export async function addTeacherResponse(
  grievanceId: string,
  teacherEmail: string,
  responseText: string,
  isOfficial: boolean = true
) {
  const { data, error } = await supabase
    .from('teacher_responses')
    .insert({
      grievance_id: grievanceId,
      teacher_email: teacherEmail,
      response_text: responseText,
      is_official: isOfficial,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getTeacherResponsesForGrievance(grievanceId: string) {
  const { data, error } = await supabase
    .from('teacher_responses')
    .select('*')
    .eq('grievance_id', grievanceId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ============ ADMIN STATISTICS ============

export async function getGrirvanceStatistics() {
  const { data, error } = await supabase.from('grievances').select('*', { count: 'exact' });

  if (error) throw error;

  const byStatus = {
    open: 0,
    'in-progress': 0,
    resolved: 0,
  };

  data?.forEach((g: { status: 'open' | 'in-progress' | 'resolved' }) => {
    byStatus[g.status as keyof typeof byStatus]++;
  });

  return {
    total: data?.length || 0,
    byStatus,
  };
}

// ============ SECTION ADVISORS ============

export async function getSectionAdvisors() {
  const { data, error } = await supabase
    .from('section_advisors')
    .select('*')
    .order('year', { ascending: true });

  if (error) throw error;
  return data as SectionAdvisor[];
}

export async function getSectionAdvisorForStudent(studentEmail: string) {
  // Look up the student's year and section first
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('year, section')
    .eq('email', studentEmail)
    .single();

  if (userError || !user || !user.year || !user.section) return null;

  const { data, error } = await supabase
    .from('section_advisors')
    .select('*')
    .eq('year', user.year)
    .eq('section', user.section)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data as SectionAdvisor | null;
}

export async function resolveGrievanceTeacher(
  categoryName: string,
  authorEmail: string | null
): Promise<string | null> {
  // 1. Look up the category's directly assigned teacher
  const { data: category } = await supabase
    .from('categories')
    .select('assigned_teacher_email')
    .eq('name', categoryName)
    .single();

  if (category?.assigned_teacher_email) {
    return category.assigned_teacher_email as string;
  }

  // 2. Category is "general" — fall back to the student's class advisor
  if (!authorEmail) return null;

  const advisor = await getSectionAdvisorForStudent(authorEmail);
  return advisor?.teacher_email ?? null;
}

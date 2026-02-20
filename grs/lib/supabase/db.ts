import { supabase } from './client';
import { Grievance, Comment, Category, Upvote } from './types';

// ============ GRIEVANCES ============

export async function getGrievances(
  category?: string,
  status?: string,
  sortBy: 'recent' | 'upvotes' = 'recent'
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

  if (error) throw error;

  return data as any[];
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
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateGrievanceStatus(id: string, status: 'open' | 'in-progress' | 'resolved') {
  const { data, error } = await supabase
    .from('grievances')
    .update({ status, updated_at: new Date().toISOString() })
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

  if (error) throw error;
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

export async function deleteCategory(id: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role key — bypasses RLS
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, serviceKey);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, full_name')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching user:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({ user: data || null });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, fullName } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate domain
    if (!email.endsWith('@ssn.edu.in')) {
      return NextResponse.json(
        { error: 'invalid_domain', message: 'Only @ssn.edu.in email addresses are allowed.' },
        { status: 403 }
      );
    }

    const supabase = getAdminClient();

    // Try to get existing user first
    const { data: existing, error: fetchError } = await supabase
      .from('users')
      .select('id, email, role, full_name')
      .eq('email', email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ user: existing });
    }

    // Auto-create user with role 'student' for valid domain
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert([
        {
          email,
          full_name: fullName || '',
          role: 'student',
        },
      ])
      .select('id, email, role, full_name')
      .single();

    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }

    return NextResponse.json({ user: newUser });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Students can update their own profile picture, bio, and phone.
// Name, email, roll number and other admin-set fields are NOT updatable here.
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, profilePicture, bio, phone } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Build update object — only student-editable fields allowed
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (profilePicture !== undefined) updateData.profile_picture = profilePicture;
    if (bio !== undefined) updateData.bio = bio;
    if (phone !== undefined) updateData.phone = phone;

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('email', email)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({ user: data });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

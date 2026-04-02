import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { grievanceId, priority, callerEmail } = body;

    if (!grievanceId || !priority || !callerEmail) {
      return NextResponse.json({ error: 'grievanceId, priority, and callerEmail are required' }, { status: 400 });
    }

    const validPriorities = ['Urgent', 'High', 'Medium', 'Low'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ error: `priority must be one of: ${validPriorities.join(', ')}` }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Verify the caller is a teacher or admin
    const { data: userRow } = await supabase
      .from('users')
      .select('role')
      .eq('email', callerEmail)
      .single();

    if (!userRow || !['teacher', 'admin'].includes(userRow.role)) {
      return NextResponse.json({ error: 'Forbidden: only teachers and admins can change priority' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('grievances')
      .update({ priority, updated_at: new Date().toISOString() })
      .eq('id', grievanceId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ grievance: data });
  } catch (err) {
    console.error('Priority update error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

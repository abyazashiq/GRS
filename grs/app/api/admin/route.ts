import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

/** Verify the caller is an admin via the users table */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function requireAdmin(supabase: any, callerEmail: string) {
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('email', callerEmail)
    .single();
  const row = data as { role: string } | null;
  if (!row || row.role !== 'admin') throw new Error('Forbidden');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, callerEmail } = body;

    if (!callerEmail) {
      return NextResponse.json({ error: 'callerEmail required' }, { status: 400 });
    }

    const supabase = getAdminClient();
    await requireAdmin(supabase, callerEmail);

    // ── Assign a teacher to a category ───────────────────────────────────────
    if (action === 'setCategoryTeacher') {
      const { categoryName, teacherEmail } = body;
      if (!categoryName) {
        return NextResponse.json({ error: 'categoryName required' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('categories')
        .update({ assigned_teacher_email: teacherEmail ?? null })
        .eq('name', categoryName)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ category: data });
    }

    // ── Upsert a section advisor ──────────────────────────────────────────────
    if (action === 'setSectionAdvisor') {
      const { year, section, teacherEmail } = body;
      if (!year || !section || !teacherEmail) {
        return NextResponse.json({ error: 'year, section, teacherEmail required' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('section_advisors')
        .upsert(
          { year, section, teacher_email: teacherEmail, assigned_by_email: callerEmail, updated_at: new Date().toISOString() },
          { onConflict: 'year,section' }
        )
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ advisor: data });
    }

    // ── Delete a section advisor ──────────────────────────────────────────────
    if (action === 'deleteSectionAdvisor') {
      const { year, section } = body;
      if (!year || !section) {
        return NextResponse.json({ error: 'year and section required' }, { status: 400 });
      }

      const { error } = await supabase
        .from('section_advisors')
        .delete()
        .eq('year', year)
        .eq('section', section);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // ── Update a student's year/section ──────────────────────────────────────
    if (action === 'setStudentSection') {
      const { studentEmail, year, section } = body;
      if (!studentEmail) {
        return NextResponse.json({ error: 'studentEmail required' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('users')
        .update({ year: year ?? null, section: section ?? null })
        .eq('email', studentEmail)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ user: data });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    if (err.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Admin API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    // ── Upsert escalation policy for a category ─────────────────────────────
    if (action === 'setEscalationPolicy') {
      const {
        categoryName,
        warningAfterHours,
        escalateAfterHours,
        criticalAfterHours,
        inactivityAfterHours,
        escalationPath,
        autoEscalate,
      } = body;

      if (!categoryName) {
        return NextResponse.json({ error: 'categoryName required' }, { status: 400 });
      }

      const warning = Number(warningAfterHours);
      const escalate = Number(escalateAfterHours);
      const critical = Number(criticalAfterHours);
      const inactivity = Number(inactivityAfterHours);

      if ([warning, escalate, critical, inactivity].some((n) => !Number.isFinite(n) || n <= 0)) {
        return NextResponse.json({ error: 'Escalation times must be positive numbers' }, { status: 400 });
      }

      if (!(warning <= escalate && escalate <= critical)) {
        return NextResponse.json(
          { error: 'Expected warning <= escalate <= critical' },
          { status: 400 }
        );
      }

      const sanitizedPath = Array.isArray(escalationPath)
        ? escalationPath
            .map((s: unknown) => (typeof s === 'string' ? s.trim().toLowerCase() : ''))
            .filter(Boolean)
        : ['teacher', 'admin'];

      const { data, error } = await supabase
        .from('escalation_policies')
        .upsert(
          {
            category: categoryName,
            warning_after_hours: warning,
            escalate_after_hours: escalate,
            critical_after_hours: critical,
            inactivity_after_hours: inactivity,
            escalation_path: sanitizedPath.length > 0 ? sanitizedPath : ['teacher', 'admin'],
            auto_escalate: autoEscalate !== false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'category' }
        )
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ policy: data });
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

    // ── Add a student (whitelist) ─────────────────────────────────────────────
    if (action === 'addStudent') {
      const { email, fullName, rollNumber, age, year, section, batch, department, phone } = body;
      if (!email || !fullName) {
        return NextResponse.json({ error: 'email and fullName are required' }, { status: 400 });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('users')
        .insert({
          email: (email as string).trim().toLowerCase(),
          full_name: fullName,
          role: 'student',
          roll_number: rollNumber || null,
          age: age ? Number(age) : null,
          year: year || null,
          section: section || null,
          batch: batch || null,
          department: department || null,
          phone: phone || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ user: data });
    }

    // ── Remove a student ──────────────────────────────────────────────────────
    if (action === 'removeStudent') {
      const { studentEmail } = body;
      if (!studentEmail) {
        return NextResponse.json({ error: 'studentEmail required' }, { status: 400 });
      }

      // Guard: only delete role=student rows, never admins or teachers
      const { data: target } = await supabase
        .from('users')
        .select('role')
        .eq('email', studentEmail)
        .single();

      if (!target || target.role !== 'student') {
        return NextResponse.json({ error: 'User not found or is not a student' }, { status: 404 });
      }

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('email', studentEmail)
        .eq('role', 'student');

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // ── Update admin-controlled fields of a student ───────────────────────────
    if (action === 'updateStudentAdminFields') {
      const { studentEmail, fullName, rollNumber, age, year, section, batch, department } = body;
      if (!studentEmail) {
        return NextResponse.json({ error: 'studentEmail required' }, { status: 400 });
      }

      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (fullName !== undefined) updateData.full_name = fullName;
      if (rollNumber !== undefined) updateData.roll_number = rollNumber;
      if (age !== undefined) updateData.age = age ? Number(age) : null;
      if (year !== undefined) updateData.year = year;
      if (section !== undefined) updateData.section = section;
      if (batch !== undefined) updateData.batch = batch;
      if (department !== undefined) updateData.department = department;

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('email', studentEmail)
        .eq('role', 'student')
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ user: data });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Admin API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

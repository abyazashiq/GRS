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

    // ── Add a category ───────────────────────────────────────
    if (action === 'addCategory') {
      const { name, description } = body;
      if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

      const { data, error } = await supabase
        .from('categories')
        .insert({ name, description: description || null })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ category: data });
    }

    // ── Update a category ───────────────────────────────────────
    if (action === 'updateCategory') {
      const { id, newName, description } = body;
      if (!id || !newName) return NextResponse.json({ error: 'id and newName required' }, { status: 400 });

      const { data, error } = await supabase
        .from('categories')
        .update({ name: newName, description: description || null })
        .eq('id', id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ category: data });
    }

    // ── Delete a category ───────────────────────────────────────
    if (action === 'deleteCategory') {
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
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
        stages,
        autoEscalate,
      } = body;

      if (!categoryName) {
        return NextResponse.json({ error: 'categoryName required' }, { status: 400 });
      }

      // Fetch the exact category name from DB to avoid FK case-mismatch failures
      const { data: catRow, error: catErr } = await supabase
        .from('categories')
        .select('name')
        .ilike('name', categoryName.trim())
        .single();

      if (catErr || !catRow) {
        return NextResponse.json({ error: `Category "${categoryName}" not found` }, { status: 404 });
      }

      const exactCategoryName = catRow.name;

      const warning = Number(warningAfterHours ?? 24);
      const escalate = Number(escalateAfterHours ?? 48);
      const critical = Number(criticalAfterHours ?? 72);
      const inactivity = Number(inactivityAfterHours ?? 24);

      const sanitizedPath = Array.isArray(escalationPath)
        ? escalationPath
            .map((s: unknown) => (typeof s === 'string' ? s.trim().toLowerCase() : ''))
            .filter(Boolean)
        : ['teacher', 'admin'];

      const sanitizedStages = Array.isArray(stages)
        ? stages.filter((s: { name?: string; email?: string; duration_hours?: number }) =>
            s && (s.name || s.email)
          )
        : [];

      const { data, error } = await supabase
        .from('escalation_policies')
        .upsert(
          {
            category: exactCategoryName,
            warning_after_hours: warning > 0 ? warning : 24,
            escalate_after_hours: escalate > 0 ? escalate : 48,
            critical_after_hours: critical > 0 ? critical : 72,
            inactivity_after_hours: inactivity > 0 ? inactivity : 24,
            escalation_path: sanitizedPath.length > 0 ? sanitizedPath : ['teacher', 'admin'],
            stages: sanitizedStages,
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

    // ── Update daily reminder / analytics email settings ─────────────────────
    if (action === 'setNotificationSettings') {
      const {
        dailyDigestHourUtc,
        professorDigestEnabled,
        hodDigestEnabled,
        hodEmail,
      } = body;

      const digestHour = Number(dailyDigestHourUtc);
      if (!Number.isFinite(digestHour) || digestHour < 0 || digestHour > 23) {
        return NextResponse.json(
          { error: 'dailyDigestHourUtc must be an integer between 0 and 23' },
          { status: 400 }
        );
      }

      const normalizedHodEmail = typeof hodEmail === 'string' ? hodEmail.trim().toLowerCase() : '';
      if (normalizedHodEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedHodEmail)) {
        return NextResponse.json({ error: 'Invalid HOD email format' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('notification_settings')
        .upsert(
          {
            singleton_key: 'default',
            daily_digest_hour_utc: Math.trunc(digestHour),
            professor_digest_enabled: professorDigestEnabled !== false,
            hod_digest_enabled: hodDigestEnabled !== false,
            hod_email: normalizedHodEmail || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'singleton_key' }
        )
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ settings: data });
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

    // ── Update priority-based SLA thresholds ─────────────────────────────────
    if (action === 'updatePriorityConfigs') {
      const { configs } = body;
      if (!Array.isArray(configs)) {
        return NextResponse.json({ error: 'configs array required' }, { status: 400 });
      }

      for (const config of configs) {
        const { error } = await supabase
          .from('priority_configs')
          .upsert({
            priority: config.priority,
            warning_hours: Number(config.warning_hours),
            escalate_hours: Number(config.escalate_hours),
            critical_hours: Number(config.critical_hours),
            inactivity_hours: Number(config.inactivity_hours),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'priority' });

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // ── Get priority-based SLA thresholds ─────────────────────────────────────
    if (action === 'getPriorityConfigs') {
      const { data, error } = await supabase
        .from('priority_configs')
        .select('*')
        .order('priority', { ascending: false });

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ configs: data });
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

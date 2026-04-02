import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, buildNewGrievanceEmail } from '@/lib/email';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

/**
 * Resolve which teacher email should handle this grievance.
 * 1. If the category has an assigned_teacher_email → use that.
 * 2. Otherwise (general) → look up the student's section advisor.
 */
 
async function resolveTeacher(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  categoryName: string,
  authorEmail: string | null
): Promise<string | null> {
  // Look up category assignment
  const { data: categoryRaw } = await supabase
    .from('categories')
    .select('assigned_teacher_email')
    .eq('name', categoryName)
    .single();

  const category = categoryRaw as { assigned_teacher_email: string | null } | null;

  if (category?.assigned_teacher_email) {
    return category.assigned_teacher_email;
  }

  // Fall back to class advisor
  if (!authorEmail) return null;

  const { data: studentRaw } = await supabase
    .from('users')
    .select('year, section')
    .eq('email', authorEmail)
    .single();

  const student = studentRaw as { year: string | null; section: string | null } | null;

  if (!student?.year || !student?.section) return null;

  const { data: advisorRaw } = await supabase
    .from('section_advisors')
    .select('teacher_email')
    .eq('year', student.year)
    .eq('section', student.section)
    .single();

  const advisor = advisorRaw as { teacher_email: string } | null;
  return advisor?.teacher_email ?? null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, category, priority, authorEmail, isAnonymous, visibility } = body;

    if (!title || !description || !category) {
      return NextResponse.json({ error: 'title, description, category required' }, { status: 400 });
    }

    const supabase = getAdminClient();

    // Create the grievance
    const { data: grievance, error: gError } = await supabase
      .from('grievances')
      .insert({
        title,
        description,
        category,
        status: 'open',
        priority: priority || 'Medium',
        author_email: isAnonymous ? null : (authorEmail ?? null),
        is_anonymous: isAnonymous ?? false,
        visibility: visibility ?? 'private',
      })
      .select()
      .single();

    if (gError) {
      console.error('Error creating grievance:', gError);
      return NextResponse.json({ error: gError.message }, { status: 500 });
    }

    // Auto-assign to the right teacher
    const teacherEmail = await resolveTeacher(supabase, category, isAnonymous ? null : authorEmail);

    if (teacherEmail) {
      const { error: aError } = await supabase
        .from('grievance_assignments')
        .insert({
          grievance_id: grievance.id,
          teacher_email: teacherEmail,
          // assigned_by_email must reference a valid user — use authorEmail if non-anonymous,
          // otherwise use teacherEmail as self-assign placeholder
          assigned_by_email: (!isAnonymous && authorEmail) ? authorEmail : teacherEmail,
        });

      if (aError) {
        // Non-fatal: log but don't fail the request
        console.warn('Auto-assign failed:', aError.message);
      }
    }

    // ── Send notification email to Stage 1 of the escalation track ──────────
    try {
      const { data: policyRaw } = await supabase
        .from('escalation_policies')
        .select('stages')
        .ilike('category', category)
        .single();

      const stages = (policyRaw?.stages ?? []) as Array<{ name: string; email: string; duration_hours: number }>;

      if (stages.length > 0 && stages[0].email) {
        const stage1 = stages[0];
        const emailContent = buildNewGrievanceEmail({
          stageName: stage1.name || 'Faculty',
          grievanceTitle: title,
          grievanceDescription: description,
          grievanceCategory: category,
          grievanceId: grievance.id,
          filedAt: grievance.created_at,
          isAnonymous: isAnonymous ?? false,
          authorEmail: isAnonymous ? null : (authorEmail ?? null),
        });

        await sendEmail({
          to: stage1.email,
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        });

        console.log(`Notification sent to Stage 1: ${stage1.email}`);
      } else {
        console.log('No escalation stages configured for category — skipping email.');
      }
    } catch (emailErr) {
      // Non-fatal: grievance is already saved
      console.error('Failed to send escalation notification email:', emailErr);
    }

    return NextResponse.json({ grievance, assignedTo: teacherEmail ?? null });
  } catch (err) {
    console.error('Grievance API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface EscalationPolicyRow {
  id: string;
  category: string;
  warning_after_hours: number;
  escalate_after_hours: number;
  critical_after_hours: number;
  inactivity_after_hours: number;
  escalation_path: string[];
  auto_escalate: boolean;
}

interface GrievanceRow {
  id: string;
  category: string;
  status: 'open' | 'in-progress' | 'resolved';
  created_at: string;
  updated_at: string;
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase service credentials');
  }

  return createClient(url, key);
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const authHeader = request.headers.get('authorization');
  const bearer = authHeader?.replace('Bearer ', '').trim();
  const querySecret = request.nextUrl.searchParams.get('secret');

  return bearer === secret || querySecret === secret;
}

function hoursBetween(now: Date, from: string) {
  const diffMs = now.getTime() - new Date(from).getTime();
  return diffMs / (1000 * 60 * 60);
}

function calculateUrgencyScore(ageHours: number, inactivityHours: number, upvoteCount: number, policy: EscalationPolicyRow) {
  const ageWeight = ageHours / policy.critical_after_hours;
  const inactivityWeight = inactivityHours / policy.inactivity_after_hours;
  const supportWeight = upvoteCount / 10;

  return Number((ageWeight + inactivityWeight * 0.6 + supportWeight * 0.4).toFixed(2));
}

function decideEscalationLevel(
  ageHours: number,
  inactivityHours: number,
  urgencyScore: number,
  policy: EscalationPolicyRow
): { targetLevel: number; reason: string } {
  if (ageHours >= policy.critical_after_hours || urgencyScore >= 2.5) {
    return {
      targetLevel: 3,
      reason: 'critical threshold reached (age/urgency)',
    };
  }

  if (ageHours >= policy.escalate_after_hours || inactivityHours >= policy.inactivity_after_hours) {
    return {
      targetLevel: 2,
      reason: 'escalation threshold reached (age/inactivity)',
    };
  }

  if (ageHours >= policy.warning_after_hours) {
    return {
      targetLevel: 1,
      reason: 'warning threshold reached (age)',
    };
  }

  return {
    targetLevel: 0,
    reason: 'below threshold',
  };
}

function roleForLevel(level: number, path: string[]) {
  if (level <= 0) return null;
  if (!path.length) return null;
  const index = Math.min(level - 1, path.length - 1);
  return path[index] || null;
}

async function runEscalationSweep() {
  const supabase = getAdminClient();
  const now = new Date();

  const { data: policiesRaw, error: policiesError } = await supabase
    .from('escalation_policies')
    .select('*');

  if (policiesError) {
    throw new Error(`Failed to fetch escalation policies: ${policiesError.message}`);
  }

  const policies = (policiesRaw || []) as EscalationPolicyRow[];
  const defaultPolicy: EscalationPolicyRow = {
    id: 'default',
    category: '*',
    warning_after_hours: 24,
    escalate_after_hours: 48,
    critical_after_hours: 72,
    inactivity_after_hours: 24,
    escalation_path: ['teacher', 'admin'],
    auto_escalate: true,
  };

  const policyByCategory = new Map<string, EscalationPolicyRow>();
  policies.forEach((p) => policyByCategory.set(p.category, p));

  const { data: grievancesRaw, error: grievancesError } = await supabase
    .from('grievances')
    .select('id, category, status, created_at, updated_at')
    .neq('status', 'resolved');

  if (grievancesError) {
    throw new Error(`Failed to fetch grievances: ${grievancesError.message}`);
  }

  const grievances = (grievancesRaw || []) as GrievanceRow[];
  if (grievances.length === 0) {
    return { processed: 0, escalated: 0, warnings: 0, critical: 0 };
  }

  const grievanceIds = grievances.map((g) => g.id);

  const { data: escalationRows, error: escalationError } = await supabase
    .from('grievance_escalations')
    .select('grievance_id, to_level, created_at')
    .in('grievance_id', grievanceIds)
    .order('created_at', { ascending: false });

  if (escalationError) {
    throw new Error(`Failed to fetch escalation history: ${escalationError.message}`);
  }

  const latestEscalationByGrievance = new Map<string, number>();
  (escalationRows || []).forEach((row: { grievance_id: string; to_level: number }) => {
    if (!latestEscalationByGrievance.has(row.grievance_id)) {
      latestEscalationByGrievance.set(row.grievance_id, row.to_level);
    }
  });

  const { data: upvoteRows, error: upvoteError } = await supabase
    .from('upvotes')
    .select('grievance_id')
    .in('grievance_id', grievanceIds);

  if (upvoteError) {
    throw new Error(`Failed to fetch upvotes: ${upvoteError.message}`);
  }

  const upvoteCountByGrievance = new Map<string, number>();
  (upvoteRows || []).forEach((row: { grievance_id: string }) => {
    const prev = upvoteCountByGrievance.get(row.grievance_id) || 0;
    upvoteCountByGrievance.set(row.grievance_id, prev + 1);
  });

  let escalated = 0;
  let warnings = 0;
  let critical = 0;

  for (const grievance of grievances) {
    const policy = policyByCategory.get(grievance.category) || defaultPolicy;
    if (!policy.auto_escalate) continue;

    const ageHours = hoursBetween(now, grievance.created_at);
    const inactivityHours = hoursBetween(now, grievance.updated_at);
    const upvoteCount = upvoteCountByGrievance.get(grievance.id) || 0;

    const urgencyScore = calculateUrgencyScore(ageHours, inactivityHours, upvoteCount, policy);
    const { targetLevel, reason } = decideEscalationLevel(ageHours, inactivityHours, urgencyScore, policy);
    const currentLevel = latestEscalationByGrievance.get(grievance.id) || 0;

    if (targetLevel <= currentLevel || targetLevel === 0) {
      continue;
    }

    const escalatedToRole = roleForLevel(targetLevel, policy.escalation_path);

    const { error: insertEscalationError } = await supabase
      .from('grievance_escalations')
      .insert({
        grievance_id: grievance.id,
        policy_id: policy.id === 'default' ? null : policy.id,
        from_level: currentLevel,
        to_level: targetLevel,
        escalated_to_role: escalatedToRole,
        urgency_score: urgencyScore,
        reason: `${reason}; age=${ageHours.toFixed(1)}h, inactivity=${inactivityHours.toFixed(1)}h, upvotes=${upvoteCount}`,
      });

    if (insertEscalationError) {
      console.error(`Failed escalating grievance ${grievance.id}:`, insertEscalationError.message);
      continue;
    }

    // If escalation has started and the grievance is still open, move it to in-progress.
    if (targetLevel >= 2 && grievance.status === 'open') {
      await supabase
        .from('grievances')
        .update({ status: 'in-progress', updated_at: now.toISOString() })
        .eq('id', grievance.id);
    }

    escalated++;
    if (targetLevel === 1) warnings++;
    if (targetLevel === 3) critical++;
  }

  return {
    processed: grievances.length,
    escalated,
    warnings,
    critical,
  };
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }

    const result = await runEscalationSweep();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Escalation cron error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

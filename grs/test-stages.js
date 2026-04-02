const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  // Find the EXACT category name using ilike (case-insensitive)
  const { data: catRow, error: catErr } = await supabase
    .from('categories')
    .select('name')
    .ilike('name', 'cdc')
    .single();

  console.log('Category lookup:', catRow, catErr);

  if (!catRow) return;

  const exactName = catRow.name;
  console.log('Exact name from DB:', exactName);

  // Upsert using the EXACT name
  const { data, error } = await supabase
    .from('escalation_policies')
    .upsert(
      {
        category: exactName,
        warning_after_hours: 24,
        escalate_after_hours: 48,
        critical_after_hours: 72,
        inactivity_after_hours: 24,
        escalation_path: ['teacher', 'admin'],
        stages: [
          { name: 'Prof Smith', email: 'smith@ssn.edu.in', duration_hours: 24 },
          { name: 'HOD', email: 'hod@ssn.edu.in', duration_hours: 48 },
        ],
        auto_escalate: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'category' }
    )
    .select()
    .single();

  console.log('\nUpsert error:', error);
  console.log('Saved stages:', JSON.stringify(data?.stages, null, 2));
}

test();

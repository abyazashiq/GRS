const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase.from('escalation_policies').select('*').limit(1);
  if (data) {
    console.log(Object.keys(data[0] || {}));
  }
  console.log('Error:', error);
}

test();

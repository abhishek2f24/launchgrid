const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function test() {
  const { data: users } = await serviceSupabase.auth.admin.listUsers()
  console.log('Total users:', users.users.length)
  
  if (users.users.length > 0) {
    const user = users.users[0]
    console.log('Testing with user:', user.email, user.id)
    
    const { data: tenant, error } = await serviceSupabase
      .from('tenants')
      .select('id, subdomain, business_name')
      .eq('owner_id', user.id)
      
    console.log('Tenant query result:', tenant, error)
  }
}

test()

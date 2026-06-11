import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }
  
  return createSupabaseClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}

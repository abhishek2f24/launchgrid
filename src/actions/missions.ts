'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markStoreShared(tenantId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tenant_missions')
    .update({ step_5_shared: true })
    .eq('tenant_id', tenantId)

  if (error) {
    console.error('Error marking store as shared:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

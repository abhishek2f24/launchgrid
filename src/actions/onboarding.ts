'use server'

import { createServiceClient } from '@/utils/supabase/service'

/**
 * Check if a subdomain is available in either tenants or active subdomain locks
 */
export async function checkSubdomainAvailability(subdomain: string): Promise<{ available: boolean }> {
  const supabase = createServiceClient()
  const cleanSubdomain = subdomain.trim().toLowerCase()

  try {
    // 1. Check if already registered in active tenants
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', cleanSubdomain)
      .eq('is_active', true)
      .maybeSingle()

    if (tenantError) throw tenantError
    if (tenant) return { available: false }

    // 2. Check if locked in subdomain_locks (not expired)
    const now = new Date().toISOString()
    const { data: lock, error: lockError } = await supabase
      .from('subdomain_locks')
      .select('id')
      .eq('subdomain', cleanSubdomain)
      .gt('expires_at', now)
      .maybeSingle()

    if (lockError) throw lockError
    if (lock) return { available: false }

    return { available: true }
  } catch (error) {
    console.error('[CHECK_SUBDOMAIN_ERROR]', error)
    return { available: false } // Safety fallback: assume taken if query fails
  }
}

/**
 * Reserve a subdomain for 15 minutes
 */
export async function reserveSubdomain(subdomain: string, sessionId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createServiceClient()
  const cleanSubdomain = subdomain.trim().toLowerCase()

  try {
    // Check availability first
    const { available } = await checkSubdomainAvailability(cleanSubdomain)
    if (!available) {
      return { success: false, error: 'Subdomain is already reserved or taken.' }
    }

    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 15)

    // Insert lock (or update if session matches)
    const { error: lockError } = await supabase
      .from('subdomain_locks')
      .insert({
        subdomain: cleanSubdomain,
        session_id: sessionId,
        expires_at: expiresAt.toISOString()
      })

    if (lockError) {
      // If code is 23505, it means unique constraint violation (subdomain taken concurrently)
      if (lockError.code === '23505') {
        return { success: false, error: 'Subdomain was just reserved by another user.' }
      }
      throw lockError
    }

    return { success: true }
  } catch (error: unknown) {
    console.error('[RESERVE_SUBDOMAIN_ERROR]', error)
    return { success: false, error: 'An unexpected error occurred during reservation.' }
  }
}

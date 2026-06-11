import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'

/**
 * "Notify, then refetch": realtime events only invalidate caches —
 * the refetch goes through the API/RLS layer, so business logic
 * stays single-sourced. One channel per tenant.
 */
export function useTenantRealtime(tenantId: string | null | undefined) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!tenantId) return

    const channel = supabase
      .channel(`tenant:${tenantId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenantId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders'] })
          queryClient.invalidateQueries({ queryKey: ['dashboard'] })
        })
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'products', filter: `tenant_id=eq.${tenantId}` },
        () => queryClient.invalidateQueries({ queryKey: ['products'] }))
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions', filter: `tenant_id=eq.${tenantId}` },
        () => queryClient.invalidateQueries({ queryKey: ['entitlements'] }))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tenantId, queryClient])
}

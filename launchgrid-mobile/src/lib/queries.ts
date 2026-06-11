import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { api } from './api'

export interface Order {
  id: string
  total_amount: number
  payment_status: string
  fulfillment_status: string
  customer_name: string | null
  customer_phone: string | null
  created_at: string
  payment_method: string | null
}

export interface Product {
  id: string
  title: string
  retail_price: number
  stock: number
  image_urls: string[] | null
  is_active: boolean
}

export interface Entitlements {
  tenant_id: string
  store_name: string
  subdomain: string
  plan: { tier: string; public_name: string; status: string; current_period_end: string | null }
  features: Record<string, boolean | number>
  limits_used: { products: number }
}

export function useEntitlements() {
  return useQuery({
    queryKey: ['entitlements'],
    queryFn: async () => {
      const { data, error } = await api<Entitlements>('/api/v1/entitlements')
      if (error) throw new Error(error.message)
      return data!
    },
    staleTime: 5 * 60 * 1000,
  })
}

/** Reads go direct to Supabase under RLS — fast, realtime-invalidated. */
export function useOrders(tenantId?: string) {
  return useQuery({
    queryKey: ['orders', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, payment_status, fulfillment_status, customer_name, customer_phone, created_at, payment_method')
        .eq('tenant_id', tenantId!)
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return (data || []) as Order[]
    },
  })
}

export function useOrder(orderId?: string) {
  return useQuery({
    queryKey: ['orders', 'detail', orderId],
    enabled: !!orderId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(quantity, price_at_purchase, variant_title, products(title, image_urls))')
        .eq('id', orderId!)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useProducts(tenantId?: string) {
  return useQuery({
    queryKey: ['products', tenantId],
    enabled: !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, title, retail_price, stock, image_urls, is_active')
        .eq('tenant_id', tenantId!)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return (data || []) as Product[]
    },
  })
}

/** Today's funnel numbers for the dashboard strip. */
export function useTodayStats(tenantId?: string) {
  return useQuery({
    queryKey: ['dashboard', 'today', tenantId],
    enabled: !!tenantId,
    refetchInterval: 60_000,
    queryFn: async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0)
      const iso = start.toISOString()
      const [views, orders] = await Promise.all([
        supabase.from('store_events').select('id', { count: 'exact', head: true })
          .eq('store_id', tenantId!).eq('event_type', 'page_view').gte('created_at', iso),
        supabase.from('orders').select('total_amount').eq('tenant_id', tenantId!).gte('created_at', iso),
      ])
      const todayOrders = (orders.data || []) as Array<{ total_amount: number }>
      return {
        visitors: views.count ?? 0,
        orders: todayOrders.length,
        revenue: todayOrders.reduce((s, o) => s + Number(o.total_amount || 0), 0),
      }
    },
  })
}

/** Order status changes go through the API — business rules stay server-side. */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (vars: { orderId: string; fulfillmentStatus?: string; paymentStatus?: string; trackingInfo?: string }) => {
      const { data, error } = await api('/api/orders/update-status', {
        method: 'POST',
        body: vars,
        idempotencyKey: `${vars.orderId}:${vars.fulfillmentStatus || vars.paymentStatus}`,
      })
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

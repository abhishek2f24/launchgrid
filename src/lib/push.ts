import { createServiceClient } from '@/utils/supabase/service'

/**
 * Server-side push via Expo Push API (wraps FCM + APNs).
 * Fire-and-forget: never throw into the calling request path.
 */
export async function sendPushToTenant(
  tenantId: string,
  notification: { title: string; body: string; data?: Record<string, unknown> }
) {
  try {
    const service = createServiceClient()
    const { data: devices } = await service
      .from('devices')
      .select('push_token')
      .eq('tenant_id', tenantId)

    const tokens = (devices || [])
      .map(d => d.push_token)
      .filter(t => typeof t === 'string' && t.startsWith('ExponentPushToken'))

    if (tokens.length === 0) return

    const messages = tokens.map(to => ({
      to,
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      sound: 'default',
      priority: 'high',
      channelId: 'orders',
    }))

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    })

    // Prune dead tokens (DeviceNotRegistered)
    const json = await res.json().catch(() => null)
    const tickets: Array<{ status: string; details?: { error?: string } }> = json?.data || []
    for (let i = 0; i < tickets.length; i++) {
      if (tickets[i]?.details?.error === 'DeviceNotRegistered') {
        await service.from('devices').delete().eq('push_token', tokens[i])
      }
    }
  } catch (err) {
    console.error('Push send failed (suppressed):', err)
  }
}

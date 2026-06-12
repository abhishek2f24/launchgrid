import { createServiceClient } from '@/utils/supabase/service'
import { SignJWT, importPKCS8 } from 'jose'

/**
 * Server-side push, fire-and-forget: never throw into the calling request path.
 * Two transports:
 *  - Expo Push API for legacy `ExponentPushToken…` tokens (old RN app)
 *  - FCM HTTP v1 for native Android tokens (current app), authenticated with a
 *    Firebase service account in env `FIREBASE_SERVICE_ACCOUNT` (the JSON, verbatim)
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

    const all = (devices || [])
      .map(d => d.push_token)
      .filter((t): t is string => typeof t === 'string' && t.length > 0)

    const expoTokens = all.filter(t => t.startsWith('ExponentPushToken'))
    const fcmTokens = all.filter(t => !t.startsWith('ExponentPushToken'))

    await Promise.all([
      expoTokens.length ? sendViaExpo(expoTokens, notification) : null,
      fcmTokens.length ? sendViaFcm(fcmTokens, notification) : null,
    ])
  } catch (err) {
    console.error('Push send failed (suppressed):', err)
  }
}

// ---------------------------------------------------------------- Expo legacy

async function sendViaExpo(
  tokens: string[],
  notification: { title: string; body: string; data?: Record<string, unknown> }
) {
  const service = createServiceClient()
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
}

// ---------------------------------------------------------------- FCM HTTP v1

interface ServiceAccount {
  project_id: string
  client_email: string
  private_key: string
}

let cachedToken: { value: string; expiresAt: number } | null = null

function getServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) return null
  try {
    return JSON.parse(raw) as ServiceAccount
  } catch {
    console.error('FIREBASE_SERVICE_ACCOUNT is not valid JSON')
    return null
  }
}

/** OAuth2 access token via service-account JWT bearer grant, cached until expiry. */
async function getFcmAccessToken(sa: ServiceAccount): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value

  const key = await importPKCS8(sa.private_key, 'RS256')
  const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/firebase.messaging' })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key)

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  if (!res.ok) {
    console.error('FCM token exchange failed:', res.status, await res.text().catch(() => ''))
    return null
  }
  const json = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 }
  return json.access_token
}

async function sendViaFcm(
  tokens: string[],
  notification: { title: string; body: string; data?: Record<string, unknown> }
) {
  const sa = getServiceAccount()
  if (!sa) {
    console.error('FCM tokens present but FIREBASE_SERVICE_ACCOUNT is not set — skipping')
    return
  }
  const accessToken = await getFcmAccessToken(sa)
  if (!accessToken) return

  const service = createServiceClient()
  // FCM data payload values must be strings
  const data = Object.fromEntries(
    Object.entries(notification.data || {}).map(([k, v]) => [k, String(v)])
  )

  await Promise.all(
    tokens.map(async token => {
      const res = await fetch(
        `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: {
              token,
              notification: { title: notification.title, body: notification.body },
              data,
              android: {
                priority: 'HIGH',
                notification: { channel_id: 'orders', sound: 'default' },
              },
            },
          }),
        }
      )

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        // Prune dead registrations so we stop paying for them
        if (res.status === 404 || text.includes('UNREGISTERED') || text.includes('INVALID_ARGUMENT')) {
          await service.from('devices').delete().eq('push_token', token)
        } else {
          console.error('FCM send failed:', res.status, text)
        }
      }
    })
  )
}

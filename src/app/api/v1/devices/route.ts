import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'

async function getUser(req: Request) {
  const supabase = await createClient()
  let user = (await supabase.auth.getUser()).data.user
  if (!user) {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (token) user = (await supabase.auth.getUser(token)).data.user
  }
  return user
}

/** POST /api/v1/devices — register/refresh a push token */
export async function POST(req: Request) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Login required' } }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { push_token, platform, device_name, app_version } = body
  if (!push_token || !['ios', 'android'].includes(platform)) {
    return NextResponse.json({ data: null, error: { code: 'BAD_REQUEST', message: 'push_token and platform required' } }, { status: 400 })
  }

  const service = createServiceClient()
  const { data: tenant } = await service.from('tenants').select('id').eq('owner_id', user.id).limit(1).single()

  const { error } = await service.from('devices').upsert({
    user_id: user.id,
    tenant_id: tenant?.id || null,
    platform,
    push_token: String(push_token).slice(0, 256),
    device_name: device_name ? String(device_name).slice(0, 80) : null,
    app_version: app_version ? String(app_version).slice(0, 20) : null,
    last_seen: new Date().toISOString(),
  }, { onConflict: 'user_id,push_token' })

  if (error) return NextResponse.json({ data: null, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 })
  return NextResponse.json({ data: { ok: true }, error: null })
}

/** DELETE /api/v1/devices — unregister on logout */
export async function DELETE(req: Request) {
  const user = await getUser(req)
  if (!user) return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Login required' } }, { status: 401 })

  const { push_token } = await req.json().catch(() => ({}))
  if (!push_token) return NextResponse.json({ data: null, error: { code: 'BAD_REQUEST', message: 'push_token required' } }, { status: 400 })

  const service = createServiceClient()
  await service.from('devices').delete().eq('user_id', user.id).eq('push_token', push_token)
  return NextResponse.json({ data: { ok: true }, error: null })
}

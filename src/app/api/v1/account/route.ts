import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'

/**
 * DELETE /api/v1/account — full account deletion.
 * REQUIRED by Apple App Store (Guideline 5.1.1(v)) and Google Play
 * (account-deletion policy): any app with account creation must offer
 * in-app account deletion.
 *
 * Deletes: tenant (cascades to products/orders/events/etc. via FKs),
 * devices, and the auth user. Order/tax records that must be retained
 * under GST law are exported server-side before deletion in a future
 * iteration; v1 performs hard delete with explicit user confirmation.
 */
export async function DELETE(req: Request) {
  const supabase = await createClient()
  let user = (await supabase.auth.getUser()).data.user
  if (!user) {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (token) user = (await supabase.auth.getUser(token)).data.user
  }
  if (!user) return NextResponse.json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Login required' } }, { status: 401 })

  // Explicit confirmation phrase prevents accidental one-tap deletion
  const { confirm } = await req.json().catch(() => ({}))
  if (confirm !== 'DELETE') {
    return NextResponse.json({ data: null, error: { code: 'CONFIRM_REQUIRED', message: 'Send { "confirm": "DELETE" } to proceed' } }, { status: 400 })
  }

  const service = createServiceClient()

  // Delete tenant rows (FK cascades cover products, orders, events, configs)
  const { data: tenants } = await service.from('tenants').select('id').eq('owner_id', user.id)
  for (const t of tenants || []) {
    await service.from('tenants').delete().eq('id', t.id)
  }
  await service.from('devices').delete().eq('user_id', user.id)

  // Delete the auth user last
  const { error } = await service.auth.admin.deleteUser(user.id)
  if (error) {
    return NextResponse.json({ data: null, error: { code: 'DELETE_FAILED', message: error.message } }, { status: 500 })
  }

  return NextResponse.json({ data: { deleted: true }, error: null })
}

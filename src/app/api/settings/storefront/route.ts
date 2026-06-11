import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { revalidatePath } from 'next/cache'

const service = createServiceClient()

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { template_style, theme_color, tagline, hero_subtitle } = await req.json()

    const { data: tenant } = await service
      .from('tenants')
      .select('id, subdomain')
      .eq('owner_id', user.id)
      .single()

    if (!tenant) return NextResponse.json({ error: 'No tenant' }, { status: 404 })

    const { error } = await service
      .from('business_configs')
      .update({
        ...(template_style && { template_style }),
        ...(theme_color    && { theme_color }),
        ...(typeof tagline === 'string'      && { tagline }),
        ...(typeof hero_subtitle === 'string' && { hero_subtitle }),
      })
      .eq('tenant_id', tenant.id)

    if (error) throw error

    revalidatePath(`/store/${tenant.subdomain}`)
    revalidatePath('/dashboard/settings/storefront')

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

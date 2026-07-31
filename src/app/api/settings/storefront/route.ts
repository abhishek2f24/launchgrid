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

    const {
      template_style, theme_color, tagline, hero_subtitle,
      instagram_url, facebook_url, x_url,
      announcement_enabled, announcement_text, announcement_countdown_at,
      slider_enabled, slider_images,
    } = await req.json()

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
        ...(typeof instagram_url === 'string' && { instagram_url: instagram_url.trim() || null }),
        ...(typeof facebook_url === 'string'  && { facebook_url: facebook_url.trim() || null }),
        ...(typeof x_url === 'string'          && { x_url: x_url.trim() || null }),
        ...(typeof announcement_enabled === 'boolean' && { announcement_enabled }),
        ...(typeof announcement_text === 'string' && { announcement_text: announcement_text.trim() || null }),
        announcement_countdown_at: announcement_countdown_at ? new Date(announcement_countdown_at).toISOString() : null,
        ...(typeof slider_enabled === 'boolean' && { slider_enabled }),
        ...(Array.isArray(slider_images) && { slider_images: slider_images.slice(0, 5) }),
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

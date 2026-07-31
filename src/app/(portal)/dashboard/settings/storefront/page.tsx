import { tenantConfig } from '@/utils/storefront'
import { getActiveTenant } from '@/utils/supabase/queries'
import { StorefrontDesigner } from './StorefrontDesigner'

export default async function StorefrontPage() {
  const result = await getActiveTenant()
  if (!result) return <div className="p-8">No tenant found.</div>

  const { tenant } = result
  const config = tenantConfig(tenant)

  return (
    <StorefrontDesigner
      subdomain={tenant.subdomain}
      initialTemplate={config.template_style || 'minimal'}
      initialColor={config.theme_color || 'purple'}
      initialTagline={config.tagline || ''}
      initialSubtitle={config.hero_subtitle || ''}
      initialInstagramUrl={config.instagram_url || ''}
      initialFacebookUrl={config.facebook_url || ''}
      initialXUrl={config.x_url || ''}
      initialAnnouncementEnabled={config.announcement_enabled || false}
      initialAnnouncementText={config.announcement_text || ''}
      initialAnnouncementCountdownAt={config.announcement_countdown_at || ''}
      initialSliderEnabled={config.slider_enabled || false}
      initialSliderImages={config.slider_images || []}
    />
  )
}

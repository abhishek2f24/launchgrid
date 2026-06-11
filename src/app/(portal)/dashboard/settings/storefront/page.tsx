import { getActiveTenant } from '@/utils/supabase/queries'
import { StorefrontDesigner } from './StorefrontDesigner'

export default async function StorefrontPage() {
  const result = await getActiveTenant()
  if (!result) return <div className="p-8">No tenant found.</div>

  const { tenant } = result
  const config = tenant.business_configs?.[0] || {}

  return (
    <StorefrontDesigner
      subdomain={tenant.subdomain}
      initialTemplate={config.template_style || 'minimal'}
      initialColor={config.theme_color || 'purple'}
      initialTagline={config.tagline || ''}
      initialSubtitle={config.hero_subtitle || ''}
    />
  )
}

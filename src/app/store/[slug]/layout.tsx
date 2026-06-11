import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { notFound } from 'next/navigation'
import { WhatsAppWidget } from '@/components/store/WhatsAppWidget'
import { CartProvider } from '@/contexts/CartContext'
import { StoreHeader } from '@/components/store/StoreHeader'
import { COLOR_MAP, getTemplateConfig } from '@/utils/storefront'
import { TrackPageView } from '@/components/store/TrackPageView'

// Service role client to fetch subscription plan (bypasses RLS on public store pages)
const service = createServiceClient()

export default async function StoreLayout(props: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const params = await props.params
  const { children } = props
  const supabase = await createClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*, business_configs(*)')
    .eq('subdomain', params.slug)
    .single()

  if (!tenant) notFound()

  const config = tenant.business_configs?.[0] || {}
  const primaryColor = COLOR_MAP[config.theme_color || 'purple'] || '#8b5cf6'
  const templateConfig = getTemplateConfig(config.template_style || 'minimal', config.theme_color || 'purple')

  // Fetch subscription plan to gate the powered-by footer
  const { data: sub } = await service
    .from('subscriptions')
    .select('plan_tier')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const plan = sub?.plan_tier || 'starter'
  // Hide footer for pro and premium plans
  const hidePoweredBy = plan === 'pro' || plan === 'premium'

  const metaPixelId = config.meta_pixel_id || null
  const ga4Id = config.ga4_measurement_id || null

  return (
    <CartProvider slug={params.slug}>
      {/* ── Analytics: GA4 ─────────────────────────────────────────────── */}
      {ga4Id && (
        <>
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}');`,
            }}
          />
        </>
      )}

      {/* ── Analytics: Meta Pixel ──────────────────────────────────────── */}
      {metaPixelId && (
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`,
          }}
        />
      )}

      <TrackPageView storeId={tenant.id} />
      <div
        className={`min-h-screen flex flex-col ${templateConfig.baseClass}`}
        style={{ ...templateConfig.accentStyle, '--accent-primary': primaryColor } as React.CSSProperties}
      >
        {/* Noise Overlay */}
        <div className="absolute inset-0 noise-overlay pointer-events-none" />

        <StoreHeader businessName={tenant.business_name} logoUrl={tenant.logo_url} />

        <main className="flex-1 relative z-10">
          {children}
        </main>

        {/* Store copyright footer - Theme adaptive */}
        <footer className="border-t mt-auto py-6" style={{ borderColor: 'var(--color-mark-default)', backgroundColor: 'var(--color-mark-surface)' }}>
          <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm font-medium text-[var(--color-mark-secondary)]">
            <p>&copy; {new Date().getFullYear()} {tenant.business_name}. All rights reserved.</p>
            <div className="flex gap-4 items-center">
              <a href={`/store/${params.slug}/policies/privacy`} className="hover:text-[var(--color-mark-ink)] transition-colors">Privacy Policy</a>
              <a href={`/store/${params.slug}/policies/terms`} className="hover:text-[var(--color-mark-ink)] transition-colors">Terms of Service</a>
              <a href={`/store/${params.slug}/policies/refund`} className="hover:text-[var(--color-mark-ink)] transition-colors">Refund Policy</a>
              <a href={`/store/${params.slug}/policies/shipping`} className="hover:text-[var(--color-mark-ink)] transition-colors">Shipping Policy</a>
            </div>
          </div>
        </footer>

        {/* Powered-by footer — hidden on premium & enterprise plans */}
        {!hidePoweredBy && (
          <div className="w-full border-t py-2.5 text-center bg-black/80" style={{ borderColor: 'var(--color-mark-default)' }}>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide">
              Made with{' '}
              <span className="text-rose-400/50">♥</span>
              {' '}by{' '}
              <a
                href="https://launchgrid.in/join"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
              >
                LaunchGrid
              </a>
            </p>
          </div>
        )}

        <WhatsAppWidget number={config.whatsapp_number} />
      </div>
    </CartProvider>
  )
}

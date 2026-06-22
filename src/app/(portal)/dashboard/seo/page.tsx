import { getActiveTenant } from '@/utils/supabase/queries'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Search, CheckCircle2, XCircle, ExternalLink, TrendingUp } from 'lucide-react'
import { SeoCopyButton } from '@/components/dashboard/SeoCopyButton'

// ─── Score Ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 70 ? 'text-emerald-600' :
    score >= 40 ? 'text-amber-500' :
    'text-red-500'

  const ringColor =
    score >= 70 ? 'stroke-emerald-500' :
    score >= 40 ? 'stroke-amber-400' :
    'stroke-red-400'

  const bgColor =
    score >= 70 ? 'bg-emerald-50 border-emerald-100' :
    score >= 40 ? 'bg-amber-50 border-amber-100' :
    'bg-red-50 border-red-100'

  const label =
    score >= 70 ? 'Great' :
    score >= 40 ? 'Getting there' :
    'Needs attention'

  // SVG circle: r=40, circumference=251.2, offset=251.2*(1 - score/100)
  const r = 40
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - score / 100)

  return (
    <div className={`flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border ${bgColor}`}>
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" className="text-black/5" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            className={ringColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-black ${color}`}>{score}</span>
          <span className="text-[10px] font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest">/100</span>
        </div>
      </div>
      <div className="text-center">
        <p className={`text-sm font-bold ${color}`}>{label}</p>
        <p className="text-xs text-[var(--color-mark-secondary)] mt-0.5">Store Discovery Score</p>
      </div>
    </div>
  )
}

// ─── Checklist Item ───────────────────────────────────────────────────────────
function CheckItem({
  done,
  label,
  action,
  actionHref,
}: {
  done: boolean
  label: string
  action?: string
  actionHref?: string
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-black/5 last:border-0">
      <div className="mt-0.5 shrink-0">
        {done ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${done ? 'text-[var(--color-mark-ink)]' : 'text-[var(--color-mark-secondary)]'}`}>
          {label}
        </p>
        {!done && action && (
          actionHref ? (
            <Link href={actionHref} className="text-xs font-bold text-blue-600 hover:underline mt-0.5 block">
              {action} →
            </Link>
          ) : (
            <p className="text-xs text-[var(--color-mark-secondary)] mt-0.5">{action}</p>
          )
        )}
      </div>
      {done && (
        <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Done</span>
      )}
    </div>
  )
}

// ─── Tip Card ─────────────────────────────────────────────────────────────────
function TipCard({ tip }: { tip: string }) {
  return (
    <div className="flex items-start gap-3 p-5 bg-amber-50 border border-amber-100 rounded-2xl">
      <TrendingUp className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-900/90 leading-relaxed font-medium">{tip}</p>
    </div>
  )
}

// ─── Feed URL Card ────────────────────────────────────────────────────────────
function FeedCard({ title, url, description, linkText, linkHref }: {
  title: string
  url: string
  description: string
  linkText?: string
  linkHref?: string
}) {
  return (
    <div className="bg-white border border-black/5 rounded-[2rem] p-8 shadow-sm">
      <h3 className="text-sm font-bold text-[var(--color-mark-ink)] mb-3">{title}</h3>
      <div className="flex items-center gap-3 mb-4 p-3 bg-black/[0.02] border border-black/5 rounded-xl overflow-hidden">
        <code className="text-xs font-mono text-[var(--color-mark-secondary)] flex-1 truncate">{url}</code>
        <SeoCopyButton text={url} />
      </div>
      <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed mb-4">{description}</p>
      {linkText && linkHref && (
        <a
          href={linkHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          {linkText}
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function SeoPage() {
  const result = await getActiveTenant()

  if (!result) {
    return <div className="p-8">No tenant found.</div>
  }

  const { tenant } = result
  const config = tenant.business_configs?.[0] || {}
  const subdomain = tenant.subdomain

  // Product count via server client
  const supabase = await createClient()
  const { count: productCount } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)

  const hasProducts = (productCount ?? 0) > 0

  // ── Score ─────────────────────────────────────────────────────────────────
  let score = 0
  if (config.meta_title)         score += 20
  if (config.meta_description)   score += 20
  if (config.ga4_measurement_id) score += 20
  if (config.meta_pixel_id)      score += 20
  if (hasProducts)               score += 20

  const feedUrl = `https://launchgrid.in/api/shopping/feed?slug=${subdomain}`
  const sitemapUrl = `https://launchgrid.in/sitemap.xml`

  return (
    <div className="p-8 max-w-4xl mx-auto font-inter space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-playfair font-bold text-[var(--color-mark-ink)] mb-2 flex items-center gap-2">
          <Search className="w-8 h-8 text-[var(--color-mark-ink)]" /> Visibility &amp; SEO.
        </h1>
        <p className="text-sm text-[var(--color-mark-secondary)]">Help customers find your store on Google.</p>
      </div>

      {/* Section A — Score + Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Score Card */}
        <div className="md:col-span-1">
          <ScoreRing score={score} />
        </div>

        {/* Checklist */}
        <div className="md:col-span-2 bg-white border border-black/5 rounded-[2rem] p-8 shadow-sm">
          <h2 className="text-xs font-black uppercase tracking-widest text-[var(--color-mark-secondary)] mb-4">SEO Checklist</h2>
          <div>
            <CheckItem
              done={!!config.meta_title}
              label="Meta title set"
              action="Add a meta title in Settings → Store Details"
              actionHref="/dashboard/settings"
            />
            <CheckItem
              done={!!config.meta_description}
              label="Meta description set"
              action="Add a meta description in Settings → Store Details"
              actionHref="/dashboard/settings"
            />
            <CheckItem
              done={!!config.ga4_measurement_id}
              label="Google Analytics connected"
              action="Enter GA4 Measurement ID in Settings → Tracking & Ads"
              actionHref="/dashboard/settings"
            />
            <CheckItem
              done={!!config.meta_pixel_id}
              label="Meta Pixel connected"
              action="Enter Meta Pixel ID in Settings → Tracking & Ads"
              actionHref="/dashboard/settings"
            />
            <CheckItem
              done={hasProducts}
              label="Products listed (for Google Shopping)"
              action="Add products to your store"
              actionHref="/dashboard/products"
            />
            <CheckItem
              done={!!config.gstin}
              label="GST / Business verified (GSTIN set)"
              action="Add your GSTIN in Settings → GST & Invoice"
              actionHref="/dashboard/settings"
            />
          </div>
        </div>
      </div>

      {/* Section C — Google Shopping Feed */}
      <FeedCard
        title="Google Shopping Feed"
        url={feedUrl}
        description="Submit this URL to Google Merchant Center to list your products on Google Shopping for free. Products update automatically whenever you add or edit items."
        linkText="Open Google Merchant Center"
        linkHref="https://merchants.google.com"
      />

      {/* Section D — Sitemap */}
      <FeedCard
        title="Your Sitemap"
        url={sitemapUrl}
        description="Google automatically crawls this sitemap to discover your store and products. You can also submit it manually in Google Search Console for faster indexing."
        linkText="Open Google Search Console"
        linkHref="https://search.google.com/search-console"
      />

      {/* Section E — SEO Tips */}
      <div className="bg-white border border-black/5 rounded-[2rem] p-8 shadow-sm">
        <h2 className="text-xs font-black uppercase tracking-widest text-[var(--color-mark-secondary)] mb-5">SEO Tips to Rank Faster</h2>
        <div className="space-y-3">
          <TipCard tip='Use product names with keywords customers search — e.g. "Cotton Kurti for Women" not just "Kurti". Specific names rank better on Google.' />
          <TipCard tip={'Add a meta description that mentions your city and product category (e.g. "Handmade jewellery store in Jaipur") to capture local searches.'} />
          <TipCard tip="Link your Google Analytics to see which keywords bring visitors. Set up your GA4 Measurement ID in Settings → Tracking & Ads." />
        </div>
      </div>

    </div>
  )
}

import { createServiceClient } from '@/utils/supabase/service'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const service = createServiceClient()

export default async function PolicyPage(props: {
  params: Promise<{ slug: string; policy: string }>
}) {
  const params = await props.params
  
  const validPolicies = ['privacy', 'terms', 'refund', 'shipping']
  if (!validPolicies.includes(params.policy)) {
    notFound()
  }

  // Get tenant id
  const { data: tenant } = await service
    .from('tenants')
    .select('id, business_name')
    .eq('subdomain', params.slug)
    .single()

  if (!tenant) notFound()

  // Get policy
  const { data: config } = await service
    .from('business_configs')
    .select('privacy_policy, terms_of_service, refund_policy, shipping_scope')
    .eq('tenant_id', tenant.id)
    .single()

  if (!config) notFound()

  let title = ''
  let content = ''

  if (params.policy === 'privacy') {
    title = 'Privacy Policy'
    content = config.privacy_policy || 'No privacy policy provided.'
  } else if (params.policy === 'terms') {
    title = 'Terms of Service'
    content = config.terms_of_service || 'No terms of service provided.'
  } else if (params.policy === 'refund') {
    title = 'Refund Policy'
    content = config.refund_policy || 'No refund policy provided.'
  } else if (params.policy === 'shipping') {
    title = 'Shipping Policy'
    const scopeText = config.shipping_scope === 'national' ? 'domestic shipping within India' : 'worldwide international shipping'
    content = `All orders from ${tenant.business_name} are processed and shipped within 2-4 business days. We provide standard ${scopeText} for all collections.\n\nEstimated delivery times range between 5-10 business days depending on customer location. Shipping charges are calculated and displayed at checkout. Once your package has shipped, a confirmation notice will be sent with trackable details.\n\nFor any shipping inquiries, please contact us via our support channels.`
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl min-h-[60vh]">
      <div className="mb-8">
        <Link href={`/store/${params.slug}`} className="inline-flex items-center text-sm text-slate-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Store
        </Link>
        <h1 className="text-3xl md:text-4xl font-playfair font-bold text-white mb-2">{title}</h1>
        <p className="text-slate-400 text-sm">Last updated: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="prose prose-invert prose-slate max-w-none">
        {content.split('\n').map((paragraph, idx) => (
          <p key={idx} className="mb-4 text-slate-300 leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  )
}

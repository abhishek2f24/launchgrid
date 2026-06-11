import { createServiceClient } from '@/utils/supabase/service'
import { redirect } from 'next/navigation'

export const dynamicParams = true

export default async function ReferralLandingPage(props: {
  params: Promise<{ code: string }>
  searchParams: Promise<{ next?: string }>
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  const supabase = createServiceClient()

  // Resolve the referral code — the subdomain IS the code
  const { data: referrer } = await supabase
    .from('tenants')
    .select('id, subdomain')
    .eq('subdomain', params.code)
    .single()

  if (referrer) {
    // Record the referral click (fire-and-forget)
    try {
      await supabase.from('referral_clicks').insert({
        referrer_tenant_id: referrer.id,
        referrer_code: params.code,
        user_agent: null,
      });
    } catch (e) {
      // ignore
    }
  }

  // Redirect to signup with referral code as URL param for attribution
  // Cookie attribution is handled server-side via /api/referrals/record after signup
  const destination = searchParams.next || '/signup'
  const redirectUrl = referrer
    ? `${destination}?ref=${params.code}`
    : destination

  redirect(redirectUrl)
}

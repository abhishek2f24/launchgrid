import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getActiveTenant } from '@/utils/supabase/queries'
import { headers } from 'next/headers'

export default async function ExtensionAuthPage(props: {
  searchParams: Promise<{ ext_id?: string }>
}) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect(`/login?next=/dashboard/extension-auth&ext_id=${searchParams.ext_id}`)
  }

  const result = await getActiveTenant()
  if (!result || !result.tenant) {
    return <div className="p-8 text-center text-red-500">No store found. Please create a store first.</div>
  }

  const headersList = await headers()
  const host        = headersList.get('host') || 'localhost:3000'
  const protocol    = host.startsWith('localhost') ? 'http' : 'https'
  const backendUrl  = `${protocol}://${host}`

  const { tenant } = result
  const token      = session.access_token
  const extId      = searchParams.ext_id
  const store      = tenant.subdomain
  const name       = encodeURIComponent(tenant.business_name || '')
  const callbackUrl = `chrome-extension://${extId}/auth-callback.html#token=${token}&store=${store}&name=${name}&backend_url=${encodeURIComponent(backendUrl)}`

  redirect(callbackUrl)
}

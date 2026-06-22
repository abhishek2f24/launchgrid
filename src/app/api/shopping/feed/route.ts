import { createServiceClient } from '@/utils/supabase/service'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')?.trim().toLowerCase()

  if (!slug) {
    return new Response('Store not found', { status: 404, headers: { 'Content-Type': 'text/plain' } })
  }

  const supabase = createServiceClient()

  // Fetch tenant by subdomain
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, subdomain, business_name')
    .eq('subdomain', slug)
    .single()

  if (tenantError || !tenant) {
    return new Response('Store not found', { status: 404, headers: { 'Content-Type': 'text/plain' } })
  }

  // Fetch all active products for this tenant
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, description, price, images')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)

  if (productsError) {
    return new Response('Store not found', { status: 404, headers: { 'Content-Type': 'text/plain' } })
  }

  const storeName = escapeXml(tenant.business_name || slug)
  const storeUrl = `https://${slug}.launchgrid.in`

  const items = (products ?? []).map((product) => {
    const title = escapeXml(product.name || '')
    const rawDescription = product.description ? stripHtml(product.description) : ''
    const description = escapeXml(rawDescription)
    const link = `${storeUrl}/store/${slug}/product/${product.id}`
    const imageLink = Array.isArray(product.images) && product.images.length > 0
      ? product.images[0]
      : ''
    const price = typeof product.price === 'number'
      ? product.price.toFixed(2)
      : parseFloat(String(product.price || 0)).toFixed(2)
    const brand = storeName

    return `    <item>
      <g:id>${escapeXml(String(product.id))}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${escapeXml(link)}</g:link>
      <g:image_link>${escapeXml(imageLink)}</g:image_link>
      <g:price>${price} INR</g:price>
      <g:availability>in stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>${brand}</g:brand>
    </item>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${storeName}</title>
    <link>${escapeXml(storeUrl)}</link>
    <description>${storeName} Product Catalog</description>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  })
}

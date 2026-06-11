import { createServiceClient } from '@/utils/supabase/service'
import { NextResponse } from 'next/server'

const serviceSupabase = createServiceClient()

export async function GET(
  request: Request,
  props: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await props.params

    // Fetch tenant
    const { data: tenant } = await serviceSupabase
      .from('tenants')
      .select('id, subdomain')
      .eq('subdomain', slug)
      .single()

    if (!tenant) {
      return new NextResponse('Store not found', { status: 404 })
    }

    // Fetch active products
    const { data: products } = await serviceSupabase
      .from('products')
      .select('slug, updated_at')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)

    const baseUrl = `https://${tenant.subdomain}.launchgrid.in`
    const currentDate = new Date().toISOString()

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Store Homepage -->
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`

    if (products && products.length > 0) {
      products.forEach((product) => {
        const lastMod = product.updated_at ? new Date(product.updated_at).toISOString() : currentDate
        xml += `  <url>
    <loc>${baseUrl}/product/${product.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`
      })
    }

    xml += `</urlset>`

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (err: any) {
    console.error('[SITEMAP_ERROR]', err)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'
import { getPlan } from '@/lib/plans'

const serviceSupabase = createServiceClient()

export async function POST(req: Request) {
  try {
    // Auth check — must be logged in via session cookie or Bearer token
    const supabase = await createClient()
    let user = (await supabase.auth.getUser()).data.user

    // If no session cookie, try Bearer token
    if (!user) {
      const authHeader = req.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7)
        const { data } = await supabase.auth.getUser(token)
        user = data.user
      }
    }

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get tenant
    const { data: tenant } = await serviceSupabase
      .from('tenants')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1)
      .single()
    if (!tenant) return NextResponse.json({ error: 'No tenant found' }, { status: 404 })

    const body = await req.json()
    let { title, description, retail_price, cost_price, image_url, image_urls, category, source_url } = body

    if (!title || !retail_price) {
      return NextResponse.json({ error: 'title and retail_price are required' }, { status: 400 })
    }

    // Enforce the plan's catalogue cap. This is checked server-side (not just in the UI)
    // because the extension and URL-import paths post here directly.
    const { data: subscription } = await serviceSupabase
      .from('subscriptions')
      .select('plan_tier')
      .eq('tenant_id', tenant.id)
      .eq('status', 'active')
      .maybeSingle()

    const plan = getPlan(subscription?.plan_tier)
    const { count: existingProducts } = await serviceSupabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)

    if ((existingProducts ?? 0) >= plan.features.max_products) {
      return NextResponse.json(
        {
          error: `Your ${plan.publicName} plan includes up to ${plan.features.max_products} products. Upgrade to add more.`,
          code: 'PRODUCT_LIMIT_REACHED',
          limit: plan.features.max_products,
          current: existingProducts ?? 0,
        },
        { status: 403 },
      )
    }

    // AI Rewrite using Gemini Flash
    if (process.env.GEMINI_API_KEY && description) {
      try {
        const { GoogleGenAI } = await import('@google/genai')
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
        
        const prompt = `You are a world-class ecommerce copywriter. 
Rewrite the following product description to be highly persuasive, SEO-optimized, and cleanly formatted in markdown.
Use short paragraphs, bullet points for features, and focus on the emotional benefits to the customer.
Do not invent facts, only use the provided information. Keep it under 200 words.

Product Title: ${title}
Original Description: ${description}`

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt
        })
        
        const rewritten = response.text
        if (rewritten && rewritten.length > 20) {
          description = rewritten
        }
      } catch (aiError) {
        console.error('[GEMINI_REWRITE_ERROR]', aiError)
        // Fallback to original description silently
      }
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      + '-' + Math.random().toString(36).slice(2, 7)

    const { data: product, error } = await serviceSupabase
      .from('products')
      .insert({
        tenant_id: tenant.id,
        title: title.trim(),
        description: description?.trim() || null,
        retail_price: Number(retail_price),
        cost_price: cost_price ? Number(cost_price) : null,
        image_urls: image_urls?.length ? image_urls : image_url ? [image_url] : [],
        slug,
        is_active: true,
        source: source_url ? 'url_import' : 'manual',
        ...(source_url && { source_url }),
      })
      .select()
      .single()

    if (error) throw error

    // Without this, a store cached from an earlier visit (revalidate=false
    // in src/app/store/[slug]/page.tsx) would never show a product added
    // via the extension/URL-import path in production.
    revalidatePath('/store/[slug]', 'page')

    return NextResponse.json({ success: true, product })
  } catch (err: any) {
    console.error('[PRODUCT_ADD_ERROR]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createServiceClient } from '@/utils/supabase/service'

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

    return NextResponse.json({ success: true, product })
  } catch (err: any) {
    console.error('[PRODUCT_ADD_ERROR]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

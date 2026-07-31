import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { GoogleGenAI, Modality } from '@google/genai'

type Platform = 'facebook' | 'instagram' | 'x'

interface Product {
  name: string
  description?: string
  price?: number | string
}

const DAILY_IMAGE_LIMIT = 3

function buildCaptionPrompt(product: Product, platform: Platform): string {
  const wantsHashtags = platform === 'instagram' || platform === 'x'
  const lengthNote = platform === 'x'
    ? 'Keep the caption under 250 characters total (X has a character limit).'
    : platform === 'instagram'
    ? 'Caption can be 2-4 short lines, casual and visual.'
    : 'Caption can be a couple of sentences, friendly and informative — no hashtags.'

  return `You are an expert Indian e-commerce social media copywriter. Write ONE social media post caption for this product, for ${platform}.

PRODUCT:
Name: ${product.name}
${product.description ? `Description: ${product.description}` : ''}
${product.price ? `Price: ₹${product.price}` : ''}

${lengthNote}
${wantsHashtags ? 'Also generate 5-8 relevant, specific hashtags (no generic spam tags like #love #instagood).' : 'Do NOT generate hashtags for this platform.'}

Return ONLY valid JSON, no markdown, no code fences:
{"caption": "...", "hashtags": ${wantsHashtags ? '["tag1", "tag2"]' : '[]'}}`
}

function hardcodedCaption(product: Product, platform: Platform): { caption: string; hashtags: string[] } {
  const name = product.name
  const price = product.price ? `₹${product.price}` : ''

  if (platform === 'instagram') {
    return {
      caption: `${name} just landed ✨${price ? ` ${price}` : ''}\nGrab yours before stock runs out!`,
      hashtags: ['newarrival', 'shopindia', 'onlineshopping', name.toLowerCase().replace(/[^a-z0-9]+/g, ''), 'musthave'],
    }
  }
  if (platform === 'x') {
    return {
      caption: `${name} is here${price ? ` — ${price}` : ''}. Link in bio to order.`,
      hashtags: ['newdrop', 'shopnow', name.toLowerCase().replace(/[^a-z0-9]+/g, '')],
    }
  }
  return {
    caption: `We're excited to introduce ${name}${price ? ` at ${price}` : ''}. Quality you can trust, delivered to your door. Order today!`,
    hashtags: [],
  }
}

async function getTenantId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: tenant } = await supabase.from('tenants').select('id').eq('owner_id', userId).maybeSingle()
  return tenant?.id ?? null
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = await getTenantId(supabase, user.id)
    if (!tenantId) {
      return NextResponse.json({ error: 'No store found for this account' }, { status: 400 })
    }

    const { product, platform } = await req.json() as { product: Product; platform: Platform }

    if (!product?.name) {
      return NextResponse.json({ error: 'Product with name is required' }, { status: 400 })
    }

    const validPlatforms: Platform[] = ['facebook', 'instagram', 'x']
    if (!platform || !validPlatforms.includes(platform)) {
      return NextResponse.json({ error: 'Valid platform is required' }, { status: 400 })
    }

    const dayStart = new Date()
    dayStart.setUTCHours(0, 0, 0, 0)
    const { count: usedToday } = await supabase
      .from('social_post_image_generations')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', dayStart.toISOString())

    const imagesUsedToday = usedToday ?? 0
    const imagesRemainingToday = Math.max(0, DAILY_IMAGE_LIMIT - imagesUsedToday)

    const apiKey = process.env.GOOGLE_GENAI_API_KEY

    let caption: string
    let hashtags: string[]

    if (!apiKey) {
      console.warn('[SOCIAL_POST] GOOGLE_GENAI_API_KEY not set, returning hardcoded caption')
      const fallback = hardcodedCaption(product, platform)
      caption = fallback.caption
      hashtags = fallback.hashtags
    } else {
      const ai = new GoogleGenAI({ apiKey })
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: buildCaptionPrompt(product, platform),
      })
      const text = response.text
      if (!text) throw new Error('Empty response from Gemini')
      const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
      const parsed = JSON.parse(cleaned)
      caption = parsed.caption
      hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags : []
    }

    let imageDataUrl: string | null = null
    let imageMessage: string | null = null

    if (!apiKey) {
      imageMessage = 'Image generation is not configured yet (no Gemini API key set).'
    } else if (imagesRemainingToday <= 0) {
      imageMessage = 'Daily limit of 3 AI-generated images reached. Try again tomorrow.'
    } else {
      const ai = new GoogleGenAI({ apiKey })
      const imagePrompt = `Professional e-commerce product photo for social media: ${product.name}${product.description ? `, ${product.description}` : ''}. Clean background, well-lit, high quality, suitable for ${platform === 'instagram' ? 'an Instagram post' : platform === 'x' ? 'an X post' : 'a Facebook post'}.`

      const imageResponse = await ai.models.generateContent({
        model: 'gemini-2.0-flash-preview-image-generation',
        contents: imagePrompt,
        config: {
          responseModalities: [Modality.TEXT, Modality.IMAGE],
        },
      })

      const parts = imageResponse.candidates?.[0]?.content?.parts ?? []
      const imagePart = parts.find((p) => p.inlineData?.data)

      if (imagePart?.inlineData?.data) {
        const mimeType = imagePart.inlineData.mimeType || 'image/png'
        imageDataUrl = `data:${mimeType};base64,${imagePart.inlineData.data}`
        await supabase.from('social_post_image_generations').insert({ tenant_id: tenantId, platform })
      } else {
        imageMessage = 'Image generation did not return an image this time. Try again.'
      }
    }

    return NextResponse.json({
      caption,
      hashtags,
      imageDataUrl,
      imageMessage,
      imagesRemainingToday: imageDataUrl ? imagesRemainingToday - 1 : imagesRemainingToday,
    })
  } catch (err: any) {
    console.error('[SOCIAL_POST_ERROR]', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

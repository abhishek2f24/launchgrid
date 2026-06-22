import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { GoogleGenAI } from '@google/genai'

type AdFormat = 'meta_feed' | 'meta_story' | 'whatsapp_status' | 'google_display'

interface AdVariant {
  headline: string
  body: string
  cta: string
}

interface Product {
  name: string
  description?: string
  price?: number | string
  image_url?: string
}

function buildPrompt(product: Product, format: AdFormat, targetAge?: string, targetCities?: string): string {
  const formatInstructions: Record<AdFormat, string> = {
    meta_feed: `Meta Feed Ad (square image + text):
- headline: max 40 characters, punchy and attention-grabbing
- body: max 125 characters, benefit-focused, includes urgency or social proof
- cta: exactly one of "Shop Now", "Order Now", or "Get Offer"`,
    meta_story: `Meta Story / Reel Ad (vertical, 9:16 format):
- headline: short, max 30 characters, bold and urgent
- body: single powerful line, max 60 characters, very casual and urgent
- cta: exactly one of "Shop Now", "Order Now", or "Get Offer"`,
    whatsapp_status: `WhatsApp Status Ad:
- headline: casual opener, max 40 characters, like a friend texting
- body: max 120 characters, very casual, emoji-friendly, sounds conversational like a friend recommending
- cta: casual CTA phrase like "Check it out!" or "Grab yours now!" or "Limited stock!"`,
    google_display: `Google Display Ad:
- headline: max 30 characters, clear and descriptive
- body: max 90 characters, factual and benefit-driven
- cta: exactly one of "Shop Now", "Learn More", or "Get Offer"`,
  }

  const targeting = [
    targetAge ? `Target age group: ${targetAge}` : null,
    targetCities ? `Target cities: ${targetCities}` : null,
  ].filter(Boolean).join('\n')

  return `You are an expert Indian e-commerce ad copywriter. Generate 3 distinct ad copy variants for the following product and ad format.

PRODUCT DETAILS:
Name: ${product.name}
${product.description ? `Description: ${product.description}` : ''}
${product.price ? `Price: ₹${product.price}` : ''}
${targeting ? `\nTARGETING:\n${targeting}` : ''}

AD FORMAT: ${formatInstructions[format]}

REQUIREMENTS:
- Write for Indian consumers; you may use Hindi words naturally (e.g. "dhamaka", "seedha", "ekdum")
- Make each variant meaningfully different in tone (e.g. one urgency-focused, one benefit-focused, one social proof-focused)
- Be scroll-stopping and culturally relevant
- Do NOT include any placeholder text like [product] or [link]
- All three variants must strictly respect the character limits above

Return ONLY a valid JSON array with exactly 3 objects, no markdown, no code fences, no explanation. Each object must have keys: "headline", "body", "cta".

Example format:
[
  {"headline": "...", "body": "...", "cta": "..."},
  {"headline": "...", "body": "...", "cta": "..."},
  {"headline": "...", "body": "...", "cta": "..."}
]`
}

function hardcodedVariants(product: Product, format: AdFormat): AdVariant[] {
  const name = product.name
  const price = product.price ? `₹${product.price}` : ''

  if (format === 'whatsapp_status') {
    return [
      { headline: `Bhai, check this out! 👀`, body: `${name} is here and it's absolutely amazing ${price ? `at ${price}` : ''}! Don't miss out 🔥`, cta: 'Grab yours now!' },
      { headline: `OMG you need this! 😍`, body: `Everyone's talking about ${name}. Get yours before it sells out! ${price}`, cta: 'Check it out!' },
      { headline: `Limited stock alert! ⚡`, body: `${name} selling fast! ${price ? `Only at ${price}` : 'Super affordable'}. Order now!`, cta: 'Order karo!' },
    ]
  }

  if (format === 'meta_story') {
    return [
      { headline: `${name} is HERE 🔥`, body: `Don't scroll past this deal!`, cta: 'Shop Now' },
      { headline: `Everyone's buying it!`, body: `Get ${name} before it's gone 👀`, cta: 'Order Now' },
      { headline: `Limited time offer ⚡`, body: `${name} ${price ? `at ${price}` : '— grab it now'}!`, cta: 'Get Offer' },
    ]
  }

  if (format === 'google_display') {
    return [
      { headline: `Shop ${name}`, body: `Premium quality ${name}${price ? ` at ${price}` : ''}. Free delivery available. Order today.`, cta: 'Shop Now' },
      { headline: `${name} — Best Price`, body: `Discover our ${name} collection. Trusted by thousands of Indian shoppers.`, cta: 'Learn More' },
      { headline: `Get ${name} Today`, body: `${price ? `Starting at ${price}. ` : ''}Quality guaranteed. Fast shipping across India.`, cta: 'Get Offer' },
    ]
  }

  // meta_feed default
  return [
    { headline: `Introducing ${name}!`, body: `Premium quality at the best price${price ? ` — just ${price}` : ''}. Order now and get fast delivery! 🚀`, cta: 'Shop Now' },
    { headline: `${name} — Must Have!`, body: `Loved by thousands. ${name} is the #1 choice for smart shoppers${price ? ` at ${price}` : ''}!`, cta: 'Order Now' },
    { headline: `Don't Miss Out!`, body: `Exclusive offer on ${name}. Limited stock available${price ? ` at ${price}` : ''}. Grab yours today!`, cta: 'Get Offer' },
  ]
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { product, format, targetAge, targetCities } = await req.json() as {
      product: Product
      format: AdFormat
      targetAge?: string
      targetCities?: string
    }

    if (!product || !product.name) {
      return NextResponse.json({ error: 'Product with name is required' }, { status: 400 })
    }

    const validFormats: AdFormat[] = ['meta_feed', 'meta_story', 'whatsapp_status', 'google_display']
    if (!format || !validFormats.includes(format)) {
      return NextResponse.json({ error: 'Valid format is required' }, { status: 400 })
    }

    if (!process.env.GOOGLE_GENAI_API_KEY) {
      console.warn('[ADS_GENERATE] GOOGLE_GENAI_API_KEY not set, returning hardcoded variants')
      const variants = hardcodedVariants(product, format)
      return NextResponse.json({ variants })
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY! })
    const prompt = buildPrompt(product, format, targetAge, targetCities)

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    })

    const text = response.text

    if (!text) {
      throw new Error('Empty response from Gemini')
    }

    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    const variants: AdVariant[] = JSON.parse(cleaned)

    if (!Array.isArray(variants) || variants.length === 0) {
      throw new Error('Invalid response format from Gemini')
    }

    return NextResponse.json({ variants })
  } catch (err: any) {
    console.error('[ADS_GENERATE_ERROR]', err)

    // If JSON parse failed or AI error, try fallback
    if (err.message?.includes('JSON') || err.message?.includes('Gemini') || err.message?.includes('parse')) {
      return NextResponse.json({ error: 'AI generation failed. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}

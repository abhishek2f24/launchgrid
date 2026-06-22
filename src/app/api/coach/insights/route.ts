import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

function getFallback(orders: number): { title: string; insight: string } {
  if (orders === 0) {
    return {
      title: 'Drive First Sale',
      insight:
        'Your store is live but has no orders yet. Share your store link in 3 WhatsApp groups today — warm audiences convert at 8–15% vs cold traffic at 1–2%.',
    }
  }
  if (orders <= 5) {
    return {
      title: 'Build Repeat Orders',
      insight: `You have early traction. Message your ${orders} buyer${orders > 1 ? 's' : ''} personally on WhatsApp to ask what else they need — repeat customers cost 5x less to convert than new ones.`,
    }
  }
  return {
    title: 'Scale With Ads',
    insight: `With ${orders} orders and social proof, you're ready to run a Meta retargeting campaign. Install Meta Pixel in Settings and target lookalike audiences from your buyers.`,
  }
}

export async function POST(req: Request) {
  // Parse body first so it's available in the catch fallback
  let parsedOrders = 0
  let body: any = {}
  try {
    body = await req.json()
    parsedOrders = body?.orders ?? 0
  } catch {
    // proceed with defaults
  }

  try {
    // Auth check
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const {
      revenue = 0,
      orders = 0,
      productCount = 0,
      visitorCount = 0,
      trafficSources,
      shippingScope,
      plan,
    } = body

    const apiKey = process.env.GOOGLE_GENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(getFallback(orders))
    }

    const trafficDesc = trafficSources
      ? Object.entries(trafficSources as Record<string, number>)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')
      : 'unknown'

    const prompt = `You are a helpful Indian e-commerce business coach for a small business merchant. Given these metrics: revenue ₹${revenue}, ${orders} orders, ${productCount} products, ${visitorCount} visitors, traffic sources ${trafficDesc}. Give ONE specific actionable insight in 2-3 sentences. Be specific to Indian e-commerce context. Focus on the most impactful next action. Do not say hello or sign off. Just the insight.`

    // Race AI call against a 4-second timeout
    const aiPromise = (async () => {
      const { GoogleGenAI } = await import('@google/genai')
      const ai = new GoogleGenAI({ apiKey })
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      })
      const text = response.text
      if (!text || text.trim().length < 10) throw new Error('Empty response')
      return text.trim()
    })()

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 4000)
    )

    const result = await Promise.race([aiPromise, timeoutPromise])

    if (!result) {
      return NextResponse.json(getFallback(orders))
    }

    // Derive a short title from context
    let title: string
    if (orders === 0) {
      title = 'Drive First Sale'
    } else if (orders <= 5) {
      title = 'Build Repeat Orders'
    } else if (revenue >= 100000) {
      title = 'Scale Your Business'
    } else {
      title = 'Grow With Ads'
    }

    return NextResponse.json({ title, insight: result })
  } catch (err) {
    console.error('[COACH_INSIGHT_ERROR]', err)
    return NextResponse.json(getFallback(parsedOrders))
  }
}

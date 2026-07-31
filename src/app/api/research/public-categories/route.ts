import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'

/**
 * Distinct categories among published demo research, with a live count per
 * category — powers the category chips on /research. Genuinely queried on
 * every request (no cache, no hardcoded list): as more products get
 * published, new categories/counts appear automatically.
 */
export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('product_ideas')
    .select('category')
    .eq('is_demo', true)
    .eq('is_public', true)
    .not('category', 'is', null)

  if (error) {
    console.error('[PUBLIC_RESEARCH_CATEGORIES]', error)
    return NextResponse.json({ error: 'Unable to load categories right now.' }, { status: 500 })
  }

  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    const category = row.category as string
    counts.set(category, (counts.get(category) ?? 0) + 1)
  }

  const categories = [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json({ categories })
}

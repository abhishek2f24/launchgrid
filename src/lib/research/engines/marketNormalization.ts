// Per-unit market normalization — PRD ask: "₹5.30 per wipe for a 15×18cm
// wipe versus ₹7.60 per wipe for an 18×20cm wipe" is the real comparison,
// not raw listing price, since pack size varies wildly across listings.
// Pure, deterministic, and degrades honestly (null, not a guess) when a
// listing has no pack size recorded.

export interface NormalizableListing {
  channel: string;
  price: number | null;
  discounted_price: number | null;
  pack_size: number | null;
  rating: number | null;
  review_count: number | null;
  sponsored: number | boolean | null;
}

export interface NormalizedListing extends NormalizableListing {
  effectivePrice: number | null;
  pricePerUnit: number | null; // null when pack_size is unknown — never estimated
}

export function normalizeListing(listing: NormalizableListing): NormalizedListing {
  const effectivePrice = listing.discounted_price ?? listing.price ?? null;
  const pricePerUnit = effectivePrice != null && listing.pack_size ? Math.round((effectivePrice / listing.pack_size) * 100) / 100 : null;
  return { ...listing, effectivePrice, pricePerUnit };
}

export interface PerUnitStats {
  count: number;
  countWithPackSize: number;
  minPerUnit: number | null;
  medianPerUnit: number | null;
  maxPerUnit: number | null;
  avgPerUnit: number | null;
}

export function computePerUnitStats(listings: NormalizableListing[]): PerUnitStats {
  const normalized = listings.map(normalizeListing);
  const perUnitValues = normalized.map((l) => l.pricePerUnit).filter((v): v is number => v != null).sort((a, b) => a - b);

  if (perUnitValues.length === 0) {
    return { count: listings.length, countWithPackSize: 0, minPerUnit: null, medianPerUnit: null, maxPerUnit: null, avgPerUnit: null };
  }

  return {
    count: listings.length,
    countWithPackSize: perUnitValues.length,
    minPerUnit: perUnitValues[0],
    medianPerUnit: perUnitValues[Math.floor(perUnitValues.length / 2)],
    maxPerUnit: perUnitValues[perUnitValues.length - 1],
    avgPerUnit: Math.round((perUnitValues.reduce((s, v) => s + v, 0) / perUnitValues.length) * 100) / 100,
  };
}

const NAMED_CHANNELS = ['amazon_in', 'flipkart', 'meesho', 'nykaa'];

export function channelCounts(listings: { channel: string }[]): { channel: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const l of listings) counts.set(l.channel, (counts.get(l.channel) ?? 0) + 1);

  const named = NAMED_CHANNELS.filter((c) => counts.has(c)).map((c) => ({ channel: c, label: c, count: counts.get(c)! }));
  const otherCount = [...counts.entries()].filter(([c]) => !NAMED_CHANNELS.includes(c)).reduce((s, [, n]) => s + n, 0);

  return otherCount > 0 ? [...named, { channel: 'other', label: 'Other', count: otherCount }] : named;
}

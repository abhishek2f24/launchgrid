// Rule-based review intelligence — PRD §11/§35.
// Deterministic keyword-cluster classification, not an LLM call, so it runs
// fully offline and its output is reproducible. §11 requires the system to
// "distinguish between review evidence and AI inference" — every theme here
// carries `isInference: false` because it is a direct keyword match against
// the review text, not a generative summary.

export type Sentiment = 'positive' | 'negative' | 'neutral';

export interface ComplaintClusterDef {
  key: string;
  label: string;
  keywords: string[];
  suggestedSpecImprovement?: string;
  suggestedPackagingImprovement?: string;
  suggestedListingClarification?: string;
  suggestedQcTest?: string;
  suggestedSupplierQuestion?: string;
}

// §11 complaint clusters — seeded with the eight examples the PRD lists, in a
// small, extensible table rather than hardcoded branching logic.
export const COMPLAINT_CLUSTERS: ComplaintClusterDef[] = [
  {
    key: 'zipper_breaks',
    label: 'Zipper breaks',
    keywords: ['zipper broke', 'zip broke', 'zipper stuck', 'zip stuck', 'zipper tore', 'broken zip'],
    suggestedSpecImprovement: 'Upgrade to a reinforced/branded zipper (e.g. YKK) with a wider gauge',
    suggestedQcTest: 'Zipper cycle-pull test (min. 500 open/close cycles) before shipment',
    suggestedSupplierQuestion: 'What zipper brand/gauge is used, and is it QC-tested for cycle durability?',
  },
  {
    key: 'material_too_thin',
    label: 'Material too thin',
    keywords: ['too thin', 'flimsy', 'cheap material', 'feels cheap', 'low quality material'],
    suggestedSpecImprovement: 'Increase fabric GSM / material thickness tier',
    suggestedSupplierQuestion: 'What GSM is the current material, and what would a higher-GSM tier cost per unit?',
  },
  {
    key: 'smaller_than_shown',
    label: 'Smaller than shown',
    keywords: ['smaller than expected', 'smaller than shown', 'size is small', 'not as big', 'tiny compared'],
    suggestedListingClarification: 'Add exact dimensions and a size-reference photo (e.g. next to a common object) to the listing',
    suggestedQcTest: 'Random-sample dimension check against the listed spec before shipment',
  },
  {
    key: 'product_leaks',
    label: 'Product leaks',
    keywords: ['leaks', 'leaking', 'leaked', 'spilled'],
    suggestedSpecImprovement: 'Add/upgrade sealed seams or a leak-proof liner',
    suggestedQcTest: 'Leak test under standard fill conditions before shipment',
  },
  {
    key: 'unpleasant_smell',
    label: 'Unpleasant smell',
    keywords: ['bad smell', 'smells bad', 'chemical smell', 'strong odor', 'smells strange'],
    suggestedSpecImprovement: 'Request a lower-VOC material or an additional airing/curing step before packing',
    suggestedSupplierQuestion: 'What material/adhesive is used, and can it be tested for odor/VOC emission?',
  },
  {
    key: 'weak_adhesive',
    label: 'Weak adhesive',
    keywords: ['adhesive fails', 'doesn’t stick', 'stopped sticking', 'glue weak', 'falls off'],
    suggestedSpecImprovement: 'Upgrade adhesive grade or increase adhesive-contact surface area',
    suggestedQcTest: 'Adhesion strength test (peel test) on a sample batch',
  },
  {
    key: 'colour_differs',
    label: 'Colour differs',
    keywords: ['different color', 'different colour', 'color is off', 'not the color shown', "doesn't match picture"],
    suggestedListingClarification: 'Add a colour-accuracy disclaimer and photograph under neutral lighting',
    suggestedQcTest: 'Colour-match check against a reference swatch before shipment',
  },
  {
    key: 'missing_components',
    label: 'Missing components',
    keywords: ['missing parts', 'missing piece', 'incomplete set', 'item missing', 'not all included'],
    suggestedQcTest: 'Pre-shipment count/completeness check per unit',
    suggestedSupplierQuestion: 'What is the packing-line completeness-check process?',
  },
  {
    key: 'poor_packaging',
    label: 'Poor packaging',
    keywords: ['packaging damaged', 'poorly packaged', 'box was crushed', 'arrived damaged', 'flimsy packaging'],
    suggestedPackagingImprovement: 'Upgrade to double-wall carton or add corner protectors',
  },
  {
    key: 'received_used',
    label: 'Received used product',
    keywords: ['looked used', 'used product', 'not new', 'opened before', 'someone else’s'],
    suggestedSupplierQuestion: 'What is the returns-handling process — are returned units re-packaged and resold as new?',
  },
  // Wet-wipes / skin-care category clusters — §9 and §11 explicitly call out
  // skin irritation and fragrance as required review-output dimensions for
  // this category; the eight clusters above only cover the PRD's laundry-bag
  // worked example, so a category like facial wipes needs its own entries.
  {
    key: 'skin_irritation',
    label: 'Skin irritation',
    keywords: ['irritat', 'rash', 'broke out', 'breakout', 'allergic reaction', 'burning sensation', 'stung my skin', 'redness'],
    suggestedSpecImprovement: 'Reformulate with a milder preservative system and request a dermatological test report',
    suggestedQcTest: 'Dermatological/patch test on a representative batch before shipment',
    suggestedSupplierQuestion: 'Is there a current dermatological test report, and what preservative system is used?',
  },
  {
    key: 'dries_out_fast',
    label: 'Dries out fast',
    keywords: ['dries out', 'dried out', 'dry out', 'dry wipes', 'not moist', 'lost moisture'],
    suggestedSpecImprovement: 'Increase liquid loading percentage and/or improve pack resealability',
    suggestedQcTest: 'Moisture-retention test after a simulated 30-day open/reseal cycle',
    suggestedSupplierQuestion: 'What is the liquid loading %, and how is resealability tested?',
  },
  {
    key: 'fragrance_too_strong',
    label: 'Fragrance too strong / unpleasant',
    keywords: ['fragrance too strong', 'smells too strong', 'chemical smell', 'artificial smell', 'perfume smell', 'strong scent'],
    suggestedSpecImprovement: 'Offer a fragrance-free or lower-fragrance-load variant',
    suggestedSupplierQuestion: 'Is a fragrance-free formulation available, and what is the current fragrance load %?',
  },
  {
    key: 'wipes_tear_easily',
    label: 'Wipes tear easily',
    keywords: ['tears easily', 'tore apart', 'ripped', 'falls apart when wet', 'disintegrates'],
    suggestedSpecImprovement: 'Increase nonwoven fabric GSM or switch to a higher wet-strength substrate',
    suggestedQcTest: 'Wet-tensile-strength test on a representative batch',
  },
];

const POSITIVE_WORDS = ['great', 'excellent', 'love', 'perfect', 'amazing', 'good quality', 'sturdy', 'durable', 'worth it', 'happy'];
const NEGATIVE_WORDS = ['bad', 'poor', 'terrible', 'disappointed', 'waste', 'broke', 'defective', 'return', 'refund', 'awful'];

export function classifySentiment(text: string, rating?: number): Sentiment {
  const lower = text.toLowerCase();
  const posHits = POSITIVE_WORDS.filter((w) => lower.includes(w)).length;
  const negHits = NEGATIVE_WORDS.filter((w) => lower.includes(w)).length;

  if (rating != null) {
    if (rating >= 4 && negHits === 0) return 'positive';
    if (rating <= 2) return 'negative';
  }
  if (posHits > negHits) return 'positive';
  if (negHits > posHits) return 'negative';
  return 'neutral';
}

export interface ThemeMatch {
  complaintKey: string;
  label: string;
  matchedKeyword: string;
}

export function findComplaintThemes(text: string): ThemeMatch[] {
  const lower = text.toLowerCase();
  const matches: ThemeMatch[] = [];
  for (const cluster of COMPLAINT_CLUSTERS) {
    const hit = cluster.keywords.find((kw) => lower.includes(kw));
    if (hit) matches.push({ complaintKey: cluster.key, label: cluster.label, matchedKeyword: hit });
  }
  return matches;
}

// Naive duplicate/spam heuristic: near-identical text repeated across
// reviews within the same product is treated as suspected fake-review risk.
export function suspectedFakeReviewRate(texts: string[]): number {
  if (texts.length < 3) return 0;
  const normalised = texts.map((t) => t.toLowerCase().replace(/\s+/g, ' ').trim());
  const counts = new Map<string, number>();
  for (const t of normalised) counts.set(t, (counts.get(t) ?? 0) + 1);
  const duplicates = [...counts.values()].filter((c) => c > 1).reduce((sum, c) => sum + c, 0);
  return Math.round((duplicates / texts.length) * 100) / 100;
}

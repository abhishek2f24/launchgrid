// Bulk catalogue + research seeder.
//
//   node scripts/seed-bulk-catalog-research.mjs [--products=300] [--public]
//
// Creates a large, realistic product catalogue on a dedicated demo account AND a genuine
// research report for every single product.
//
// WHAT IS REAL vs WHAT IS ASSUMED — read this before quoting any number from here:
//
//   • Every OUTPUT is computed live by the real deterministic engines in
//     src/lib/research/engines/ (landed cost, profitability, manufacturer confidence,
//     quality, opportunity score, readiness matrix, verdict). Nothing hardcodes a result,
//     and no score is invented.
//   • Every INPUT is a realistic STARTING ASSUMPTION for that product category — the kind
//     of figure a seller types in on day one from a sourcing-platform listing, before they
//     have a confirmed factory quote. Price bands, MOQs and cost ratios are plausible for
//     the Indian D2C market; they are NOT quotes from any specific supplier.
//   • Product IMAGES are generic stock photos keyed to the product slug. They do NOT depict
//     the actual product. This is demo catalogue filler, not real product photography.
//
// Deterministic: all ids and all "random" inputs derive from a hash of the product name, so
// re-running produces identical rows (upsert, not duplicate) and identical scores.

import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { calculateManufacturerConfidence } from '../src/lib/research/engines/manufacturerConfidence.ts';
import { calculateQualityScore } from '../src/lib/research/engines/quality.ts';
import { calculateLandedCost } from '../src/lib/research/engines/landedCost.ts';
import { calculateAllScenarios, DEFAULT_FEE_PROFILES } from '../src/lib/research/engines/profitability.ts';
import { calculateOpportunityScore } from '../src/lib/research/engines/opportunityScore.ts';
import { buildReadinessMatrix, buildVerdict, buildBlockers, computeRecommendedOrder } from '../src/lib/research/engines/decisionCockpit.ts';

// ── env / client ─────────────────────────────────────────────────────────────
const env = {};
readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').forEach((line) => {
  const m = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
  if (m) { let v = m[2] || ''; if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); env[m[1]] = v; }
});
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
const die = (label, error) => { if (error) { console.error(`✗ ${label}:`, error.message || error); process.exit(1); } };

const args = process.argv.slice(2);
const TARGET = Number((args.find((a) => a.startsWith('--products=')) || '--products=300').split('=')[1]);
// Publishing makes these appear in the public /research category browser (is_demo + is_public
// double-gate from migration 0028). On by default so the public browser has real content.
const PUBLISH = !args.includes('--no-public');

const OWNER_EMAIL = 'bulk-demo@launchgrid.in';
const OWNER_PASSWORD = 'BulkDemo123!';
const SUBDOMAIN = 'bulk-demo';
const BUSINESS_NAME = 'BulkDemo Bazaar';
const FX_USD_INR = 83;
const BUDGET = 150000; // max first-order budget this demo seller is working with

// ── deterministic helpers ────────────────────────────────────────────────────
const sha = (s) => createHash('sha256').update(s).digest('hex');

function fixedUuid(seed) {
  const hex = sha(seed);
  return [
    hex.slice(0, 8), hex.slice(8, 12), '4' + hex.slice(13, 16),
    ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16) + hex.slice(17, 20),
    hex.slice(20, 32),
  ].join('-');
}

/** Seeded PRNG so each product gets distinct-but-stable inputs instead of clones. */
function rng(seed) {
  let a = parseInt(sha(seed).slice(0, 8), 16) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
const between = (r, lo, hi) => lo + r() * (hi - lo);
const intBetween = (r, lo, hi) => Math.round(between(r, lo, hi));

const slugify = (name) => name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

// ── catalogue archetypes ─────────────────────────────────────────────────────
// retail: realistic Indian D2C selling-price band (₹)
// costRatio: landed unit cost as a fraction of retail, typical for the category
// moq: typical minimum order quantities offered on sourcing platforms
// India-sourced categories quote in INR; imported ones quote in USD.
const CATEGORIES = [
  { category: 'Mobile Accessories',      country: 'China', retail: [299, 1799],  costRatio: [0.18, 0.32], moq: [500, 1000, 2000], returnRisk: [55, 75], shipping: [62, 80], demand: [48, 68], competition: [15, 40], diff: [20, 45],
    names: ['Magnetic Car Phone Mount', '3-in-1 Wireless Charging Dock', 'GaN 65W Travel Adapter', 'Braided USB-C Fast Cable', 'Pop-Up Ring Grip Stand', 'Anti-Glare Screen Guard', 'Retractable Car Charger', 'Foldable Phone Stand', 'MagSafe Card Wallet', '10000mAh Slim Power Bank', 'Bluetooth Selfie Remote', 'Cable Organizer Set'] },
  { category: 'Audio & Wearables',       country: 'China', retail: [899, 3999],  costRatio: [0.22, 0.36], moq: [200, 300, 500],   returnRisk: [50, 68], shipping: [55, 70], demand: [58, 78], competition: [30, 58], diff: [35, 60],
    names: ['ENC Wireless Earbuds', 'Neckband Bluetooth Earphone', 'Smart Fitness Ring', 'Bluetooth Calling Smartwatch', 'Open-Ear Clip Earbuds', 'Bone Conduction Headphones', 'Mini Bluetooth Speaker', 'Kids Bluetooth Headphones', 'Sleep Earbuds', 'Gaming Headset RGB', 'TWS Charging Case', 'Sports Armband Tracker'] },
  { category: 'Beauty & Skincare',       country: 'China', retail: [399, 2499],  costRatio: [0.15, 0.30], moq: [500, 1000, 2000], returnRisk: [58, 78], shipping: [64, 82], demand: [55, 76], competition: [20, 52], diff: [30, 58],
    names: ['LED Red Light Therapy Mask', 'Jade Roller & Gua Sha Set', 'Ice Roller for Face', 'Blackhead Vacuum Remover', 'Silicone Face Cleansing Brush', 'Heated Eyelash Curler', 'Derma Roller 0.5mm', 'Vitamin C Serum Kit', 'Lip Plumping Device', 'Facial Steamer Mini', 'Makeup Brush Cleaner', 'Under-Eye Cooling Patches'] },
  { category: 'Grooming',                country: 'India', retail: [349, 1499],  costRatio: [0.28, 0.44], moq: [500, 1000],       returnRisk: [62, 80], shipping: [66, 84], demand: [48, 66], competition: [25, 48], diff: [28, 50],
    names: ['Beard Shaping Kit', 'Cordless Nose Trimmer', 'Body Hair Trimmer', 'Beard Growth Oil Set', 'Manicure Grooming Kit', 'Electric Callus Remover', 'Travel Shaving Set', 'Hair Styling Comb Set'] },
  { category: 'Kitchen',                 country: 'India', retail: [299, 1999],  costRatio: [0.30, 0.48], moq: [300, 500, 1000],  returnRisk: [60, 78], shipping: [54, 72], demand: [46, 68], competition: [28, 55], diff: [30, 52],
    names: ['Magnetic Spice Rack Organizer', 'Multi-Function Vegetable Chopper', 'Stainless Steel Lunch Box', 'Manual Coffee Hand Grinder', 'Silicone Baking Mat Set', 'Collapsible Dish Rack', 'Insulated Casserole Set', 'Chapati Roller Press', 'Kitchen Sink Organizer', 'Airtight Cereal Dispenser', 'Reusable Silicone Food Bags', 'Knife Sharpener Block'] },
  { category: 'Home & Decor',            country: 'India', retail: [399, 2999],  costRatio: [0.28, 0.46], moq: [200, 500, 1000],  returnRisk: [55, 74], shipping: [45, 66], demand: [44, 66], competition: [30, 56], diff: [34, 58],
    names: ['Macrame Wall Hanging', 'LED Neon Sign Custom', 'Ceramic Planter Set', 'Aroma Diffuser Wood Grain', 'Cotton Handloom Cushion Cover', 'Terracotta Table Lamp', 'Floating Wall Shelf Set', 'Jute Storage Basket', 'Brass Pooja Thali Set', 'Blackout Door Curtain', 'Photo Frame Collage Set', 'Scented Soy Candle Trio'] },
  { category: 'Wellness',                country: 'China', retail: [699, 3499],  costRatio: [0.20, 0.34], moq: [200, 300, 500],   returnRisk: [52, 70], shipping: [52, 68], demand: [56, 76], competition: [28, 52], diff: [36, 60],
    names: ['Portable Massage Gun', 'Shiatsu Neck Massager', 'Acupressure Foot Mat', 'Posture Corrector Brace', 'Cervical Traction Pillow', 'Heated Knee Wrap', 'Eye Massager Bluetooth', 'Cupping Therapy Set', 'TENS Pain Relief Unit', 'Adjustable Lumbar Cushion'] },
  { category: 'Fitness & Sports',        country: 'India', retail: [499, 3499],  costRatio: [0.30, 0.48], moq: [200, 500],        returnRisk: [50, 68], shipping: [42, 62], demand: [52, 72], competition: [30, 55], diff: [30, 52],
    names: ['Resistance Band Set', 'Adjustable Skipping Rope', 'Yoga Mat 6mm TPE', 'Push-Up Board System', 'Ab Roller Wheel Kit', 'Adjustable Dumbbell Pair', 'Foam Roller Textured', 'Gym Gloves Wrist Wrap', 'Speed Agility Ladder', 'Boxing Hand Wraps'] },
  { category: 'Pet Supplies',            country: 'China', retail: [399, 2999],  costRatio: [0.20, 0.36], moq: [200, 500, 1000],  returnRisk: [50, 68], shipping: [50, 70], demand: [54, 74], competition: [24, 48], diff: [38, 62],
    names: ['AI Pet Camera Treat Tosser', 'Slow Feeder Dog Bowl', 'Self-Cleaning Cat Brush', 'Retractable Dog Leash', 'Pet Water Fountain', 'Cat Interactive Laser Toy', 'Dog Cooling Mat', 'Pet Grooming Vacuum Kit', 'No-Pull Dog Harness', 'Litter Mat Trapper'] },
  { category: 'Baby & Kids',             country: 'India', retail: [399, 2499],  costRatio: [0.30, 0.46], moq: [300, 500, 1000],  returnRisk: [58, 76], shipping: [52, 70], demand: [50, 70], competition: [26, 50], diff: [30, 54],
    names: ['Silicone Baby Bib Set', 'Convertible Baby Carrier', 'Wooden Montessori Puzzle', 'Baby Food Masher Set', 'Anti-Spill Sippy Cup', 'Musical Crib Mobile', 'Kids Height Growth Chart', 'Toddler Step Stool', 'Baby Bath Thermometer Duck', 'Stackable Learning Blocks'] },
  { category: 'Fashion Accessories',     country: 'India', retail: [299, 1999],  costRatio: [0.24, 0.42], moq: [300, 500, 1000],  returnRisk: [62, 82], shipping: [62, 80], demand: [48, 70], competition: [22, 50], diff: [26, 50],
    names: ['Oxidised Silver Jhumka', 'Kundan Choker Set', 'Minimalist Steel Watch', 'Leather Card Holder', 'Layered Chain Necklace', 'Handcrafted Juttis', 'Silk Scrunchie Pack', 'Polarised Aviator Sunglasses', 'Beaded Anklet Pair', 'Embroidered Potli Bag'] },
  { category: 'Bags & Luggage',          country: 'India', retail: [699, 3999],  costRatio: [0.30, 0.48], moq: [200, 300, 500],   returnRisk: [52, 70], shipping: [40, 60], demand: [50, 70], competition: [30, 54], diff: [30, 52],
    names: ['Anti-Theft Laptop Backpack', 'Canvas Duffle Weekender', 'Cabin Trolley Hard Case', 'Sling Crossbody Bag', 'Jute Tote Shopper', 'Travel Organizer Cube Set', 'Waterproof Dry Bag', 'Laptop Sleeve Felt'] },
  { category: 'Eco-Friendly Household',  country: 'India', retail: [249, 1499],  costRatio: [0.30, 0.48], moq: [500, 1000, 2000], returnRisk: [58, 76], shipping: [60, 80], demand: [46, 66], competition: [34, 58], diff: [40, 64],
    names: ['Bamboo Cutlery Travel Set', 'Bamboo Toothbrush Pack', 'Beeswax Food Wraps', 'Steel Straw Set with Brush', 'Coconut Coir Scrubber Pack', 'Cloth Grocery Bag Set', 'Compostable Bin Liners', 'Refillable Glass Spray Bottle', 'Wooden Soap Dish', 'Loofah Kitchen Sponge'] },
  { category: 'Auto Accessories',        country: 'China', retail: [349, 2499],  costRatio: [0.20, 0.36], moq: [500, 1000],       returnRisk: [50, 70], shipping: [52, 72], demand: [46, 66], competition: [22, 46], diff: [26, 48],
    names: ['Mini Car Vacuum Cleaner', 'Car Seat Gap Organizer', 'Dashboard Anti-Slip Mat', 'Tyre Inflator Digital', 'Car Headrest Hook Pair', 'Windshield Sun Shade', 'Car Air Purifier Vent', 'Steering Wheel Cover', 'Boot Organizer Foldable', 'Car Phone Holder Vent'] },
  { category: 'Stationery & Office',     country: 'India', retail: [199, 1499],  costRatio: [0.28, 0.46], moq: [500, 1000, 2000], returnRisk: [55, 72], shipping: [60, 80], demand: [44, 64], competition: [26, 50], diff: [28, 50],
    names: ['Undated Productivity Planner', 'Desk Cable Management Tray', 'Fountain Pen Gift Set', 'Sticky Note Dispenser Cube', 'Laptop Riser Stand Aluminium', 'A5 Dotted Bullet Journal', 'Mesh Desk Organizer', 'Whiteboard Fridge Magnet', 'Ergonomic Wrist Rest Pad', 'Document Zip Folder A4'] },
  { category: 'Smart Home',              country: 'China', retail: [599, 3999],  costRatio: [0.22, 0.38], moq: [200, 500],        returnRisk: [50, 70], shipping: [54, 72], demand: [54, 74], competition: [28, 52], diff: [36, 60],
    names: ['WiFi Smart Plug 16A', 'Motion Sensor LED Strip', 'Smart Door Lock Fingerprint', 'WiFi Video Doorbell', 'Smart LED Bulb RGB', 'Wireless Water Leak Sensor', 'Smart IR Remote Hub', 'Digital Weighing Scale Bluetooth'] },
  { category: 'Wellness Tech',           country: 'China', retail: [799, 3499],  costRatio: [0.22, 0.36], moq: [200, 500],        returnRisk: [54, 72], shipping: [56, 74], demand: [52, 74], competition: [30, 54], diff: [38, 62],
    names: ['Smart Water Bottle Reminder', 'Portable Blender Bottle', 'UV Toothbrush Sanitiser', 'Digital Pulse Oximeter', 'Infrared Forehead Thermometer', 'Electric Salt Nasal Rinser', 'Sunrise Alarm Wake Light', 'White Noise Sleep Machine'] },
  { category: 'Festive & Gifting',       country: 'India', retail: [399, 2999],  costRatio: [0.28, 0.46], moq: [200, 500, 1000],  returnRisk: [52, 70], shipping: [50, 70], demand: [48, 72], competition: [30, 56], diff: [36, 60],
    names: ['Diwali Diya Gift Hamper', 'Personalised Photo Mug', 'Dry Fruit Gift Box Brass', 'Rakhi Set with Roli Chawal', 'Engraved Wooden Keychain Pair', 'Scented Candle Gift Set', 'Customised Name Necklace', 'Corporate Desk Gift Kit'] },
  { category: 'Ethnic Wear',             country: 'India', retail: [799, 4999],  costRatio: [0.32, 0.50], moq: [100, 200, 300],   returnRisk: [70, 88], shipping: [48, 68], demand: [54, 76], competition: [34, 60], diff: [30, 54],
    names: ['Cotton Anarkali Kurti', 'Chanderi Silk Saree', 'Block Print Palazzo Set', 'Kalamkari Dupatta', 'Men Khadi Nehru Jacket', 'Bandhani Cotton Suit', 'Chikankari Kurta', 'Banarasi Blouse Piece'] },
];

// ── build the catalogue ──────────────────────────────────────────────────────
function buildCatalogue(target) {
  const out = [];
  // True round-robin: take ONE product from each category per pass, so any --products value
  // yields a balanced mix instead of exhausting the first category first. Once base names run
  // out, append a variant suffix (a real catalogue carries variants too).
  const variants = ['', ' — Classic', ' — Premium', ' — Combo Pack', ' — Pro', ' — Value Pack', ' — Gift Edition', ' — Travel Size'];
  const maxNames = Math.max(...CATEGORIES.map((c) => c.names.length));

  for (let pass = 0; out.length < target; pass++) {
    const nameIdx = pass % maxNames;
    const suffix = variants[Math.floor(pass / maxNames)] ?? ` — Pack of ${Math.floor(pass / maxNames)}`;
    let placedThisPass = 0;

    for (const cat of CATEGORIES) {
      if (out.length >= target) break;
      const base = cat.names[nameIdx];
      if (!base) continue;
      placedThisPass++;
      {
        const name = base + suffix;
        const r = rng(name);
        const retail = Math.round(between(r, cat.retail[0], cat.retail[1]) / 10) * 10 - 1; // ends in 9
        const costRatio = between(r, cat.costRatio[0], cat.costRatio[1]);
        const inrUnitCost = Math.max(20, Math.round(retail * costRatio));
        const isIndia = cat.country === 'India';
        out.push({
          name,
          category: cat.category,
          country: cat.country,
          retail,
          // Suppliers quote in their own currency: INR domestically, USD for imports.
          unitPrice: isIndia ? inrUnitCost : Math.round((inrUnitCost / FX_USD_INR) * 100) / 100,
          currency: isIndia ? 'INR' : 'USD',
          moq: pick(r, cat.moq),
          // Supplier evidence: better evidence correlates with higher-value categories,
          // and a minority of suppliers show classic trading-house red flags.
          licence: r() > 0.12,
          audit: r() > 0.45,
          factoryAddr: r() > 0.25,
          custom: r() > 0.6,
          exportHist: r() > 0.5,
          broadCatalogue: r() < 0.12,
          identicalPhotos: r() < 0.1,
          tradingOnly: r() < 0.08,
          demand: intBetween(r, cat.demand[0], cat.demand[1]),
          competition: intBetween(r, cat.competition[0], cat.competition[1]),
          differentiation: intBetween(r, cat.diff[0], cat.diff[1]),
          returnRisk: intBetween(r, cat.returnRisk[0], cat.returnRisk[1]),
          shipping: intBetween(r, cat.shipping[0], cat.shipping[1]),
          // Roughly a third of sellers have actually collected compliance/test evidence for
          // the product. Leaving this uniformly false pinned every compliance sub-score to
          // the same low value and flattened the whole verdict distribution.
          complianceEvidence: r() > 0.66,
        });
      }
    }
    if (!placedThisPass) break; // safety valve — nothing left to place
  }
  return out;
}

// ── account bootstrap ────────────────────────────────────────────────────────
async function ensureOwner() {
  const existing = await sb.from('users').select('id').eq('email', OWNER_EMAIL).maybeSingle();
  if (existing.data?.id) { console.log(`• owner reused (${OWNER_EMAIL})`); return existing.data.id; }
  const created = await sb.auth.admin.createUser({ email: OWNER_EMAIL, password: OWNER_PASSWORD, email_confirm: true, user_metadata: { full_name: BUSINESS_NAME } });
  if (created.data?.user) { console.log(`• owner created (${OWNER_EMAIL})`); return created.data.user.id; }
  if (/already|registered|exist/i.test(created.error?.message || '')) {
    for (let page = 1; page <= 20; page++) {
      const { data } = await sb.auth.admin.listUsers({ page, perPage: 200 });
      const hit = data?.users?.find((u) => u.email?.toLowerCase() === OWNER_EMAIL.toLowerCase());
      if (hit) return hit.id;
      if (!data?.users?.length || data.users.length < 200) break;
    }
  }
  die('create owner', created.error || new Error('could not resolve owner'));
}

const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

async function bulkUpsert(table, rows, label) {
  for (const part of chunk(rows, 200)) {
    die(`${label} (${table})`, (await sb.from(table).upsert(part)).error);
  }
}

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  const catalogue = buildCatalogue(TARGET);
  console.log(`\nBuilding ${catalogue.length} products across ${CATEGORIES.length} categories…\n`);

  const userId = await ensureOwner();
  die('upsert users', (await sb.from('users').upsert({ id: userId, email: OWNER_EMAIL, full_name: BUSINESS_NAME })).error);

  const tenantId = fixedUuid('tenant-' + SUBDOMAIN);
  die('upsert tenant', (await sb.from('tenants').upsert({
    id: tenantId, owner_id: userId, business_name: BUSINESS_NAME, subdomain: SUBDOMAIN, niche: 'General Store',
  })).error);
  die('upsert business_configs', (await sb.from('business_configs').upsert({
    tenant_id: tenantId, shipping_scope: 'inter_state', theme_color: 'purple', template_style: 'minimal',
    cod_enabled: true, whatsapp_number: '919999999999',
  })).error);
  // Premium: 500-product cap and 500 research reports/month, so this dataset stays WITHIN
  // the entitlements the app enforces rather than contradicting them.
  die('upsert subscription', (await sb.from('subscriptions').upsert({
    id: fixedUuid('sub-' + SUBDOMAIN), tenant_id: tenantId, plan_tier: 'premium', status: 'active', billing_cycle: 'monthly',
  }, { onConflict: 'id' })).error);

  const projectId = fixedUuid('project-bulk-' + SUBDOMAIN);
  die('upsert research project', (await sb.from('research_projects').upsert({
    id: projectId, user_id: userId, name: `Bulk Catalogue Research — ${catalogue.length} products`,
  })).error);

  // ── products ───────────────────────────────────────────────────────────────
  const productRows = catalogue.map((p) => {
    const slug = slugify(p.name);
    const inrCost = p.currency === 'INR' ? p.unitPrice : Math.round(p.unitPrice * FX_USD_INR);
    return {
      id: fixedUuid('product-' + p.name),
      tenant_id: tenantId,
      title: p.name,
      slug: `${slug}-${sha(p.name).slice(0, 5)}`,
      description: `${p.name} — ${p.category}. Sourced from a vetted ${p.country} supplier. Demo catalogue item.`,
      retail_price: p.retail,
      cost_price: inrCost,
      // Generic stock photo keyed to the slug — stable across runs, but NOT a photo of the
      // actual product. Replace with real photography before selling anything.
      image_urls: [`https://picsum.photos/seed/${slug}/800/1000`],
      is_active: true,
      source: 'manual',
      stock: 50,
      metadata: { seeded: true, demo: true, seed_script: 'seed-bulk-catalog-research' },
    };
  });
  await bulkUpsert('products', productRows, 'upsert products');
  console.log(`✓ ${productRows.length} products in store "${BUSINESS_NAME}"`);

  // ── research: run the REAL engines for every product ───────────────────────
  const ideaRows = [], supplierRows = [], tierRows = [], scoreRows = [];
  const lcRows = [], profitRows = [], oppRows = [];
  const statusByIdea = new Map();
  const tally = {};

  for (const p of catalogue) {
    const ideaId = fixedUuid('idea-' + p.name);
    const supplierId = fixedUuid('supplier-' + p.name);
    const landedCostId = fixedUuid('lc-' + p.name);
    const isIndia = p.country === 'India';
    const slug = slugify(p.name);

    ideaRows.push({
      id: ideaId, research_project_id: projectId, user_id: userId,
      name: p.name, category: p.category, target_retail_price: p.retail,
      max_preferred_moq: p.moq, max_initial_investment: BUDGET,
      has_compliance_evidence: p.complianceEvidence, status: 'researching',
      // Provenance is mandatory: these inputs are demo fixtures, NOT real supplier evidence.
      // The UI reads this to warn that the report must not drive a purchasing decision.
      data_source: 'seeded',
      is_demo: true, is_public: PUBLISH, public_slug: PUBLISH ? `${slug}-${sha(p.name).slice(0, 5)}` : null,
      public_intent_keywords: PUBLISH ? [...new Set([p.name.toLowerCase(), p.category.toLowerCase(), ...p.name.toLowerCase().split(' ').filter((w) => w.length > 3)])] : null,
      published_at: PUBLISH ? new Date().toISOString() : null,
    });

    supplierRows.push({
      id: supplierId, product_idea_id: ideaId,
      supplier_name: `${p.category} Supplier (${p.country})`,
      platform: isIndia ? 'IndiaMART' : 'Alibaba',
      country: p.country, currency: p.currency, moq: p.moq, lead_time_days: isIndia ? 12 : 28,
      business_licence_available: p.licence, audit_report_available: p.audit, factory_address_disclosed: p.factoryAddr,
      customisation_capability: p.custom, export_history: p.exportHist,
      broad_unrelated_catalogue: p.broadCatalogue, identical_photos_flag: p.identicalPhotos, trading_only_scope: p.tradingOnly,
      data_source: 'seeded',
    });

    tierRows.push({ id: fixedUuid('tier-' + p.name), supplier_id: supplierId, quantity: p.moq, unit_price: p.unitPrice, currency: p.currency, data_source: 'seeded' });

    // --- REAL ENGINE CALLS ---
    const mc = calculateManufacturerConfidence({
      businessLicenceSupportsManufacturing: p.licence, factoryAuditAvailable: p.audit, factoryAddressVerified: p.factoryAddr,
      productSpecificManufacturingCapability: p.custom, exportHistory: p.exportHist,
      veryBroadUnrelatedCatalogue: p.broadCatalogue, identicalPhotosUsedByManySellers: p.identicalPhotos,
      factoryLocationNotDisclosed: !p.factoryAddr, companyScopeAppearsTradingOnly: p.tradingOnly,
    });
    const q = calculateQualityScore({
      specificationCompletenessPct: 0.6, materialQualityScore: 60, constructionScore: 60,
      certificationTestScore: p.audit ? 70 : 40, reviewQualityScore: 55, defectComplaintRatePct: 0.1, sampleInspectionScore: null,
    });
    scoreRows.push({
      id: fixedUuid('score-' + p.name), supplier_id: supplierId,
      manufacturer_confidence_score: mc.score, manufacturer_confidence_label: mc.label,
      quality_score: q.score, quality_label: q.label, breakdown_json: { manufacturerConfidence: mc, quality: q },
    });

    const fxRateToInr = isIndia ? 1 : FX_USD_INR;
    const landedCost = calculateLandedCost({
      quantity: p.moq, unitPriceForeign: p.unitPrice, supplierCurrency: p.currency, fxRateToInr,
      customsDutyPct: isIndia ? 0 : undefined,
    });
    lcRows.push({
      id: landedCostId, product_idea_id: ideaId, supplier_id: supplierId, quantity: p.moq,
      inputs_json: { quantity: p.moq, unitPriceForeign: p.unitPrice, supplierCurrency: p.currency, fxRateToInr },
      outputs_json: landedCost, confidence: landedCost.confidence,
    });

    const scenarios = calculateAllScenarios({
      listingPrice: p.retail, readyToSellCostPerUnit: landedCost.readyToSellCostPerUnit,
      fees: DEFAULT_FEE_PROFILES.amazon_in, initialInventorySpend: landedCost.totalCashRequirement,
    });
    for (const [scenario_type, outputs_json] of Object.entries(scenarios)) {
      profitRows.push({
        id: fixedUuid('profit-' + p.name + scenario_type), product_idea_id: ideaId, channel: 'amazon_in',
        landed_cost_scenario_id: landedCostId, scenario_type,
        inputs_json: { listingPrice: p.retail, readyToSellCostPerUnit: landedCost.readyToSellCostPerUnit }, outputs_json,
      });
    }

    const expected = scenarios.expected;
    const marginScore = Math.max(0, Math.min(100, Math.round((expected.contributionMarginPct / 0.4) * 100)));
    const moqInvestment = p.moq * landedCost.readyToSellCostPerUnit;
    const moqSuitabilityScore = moqInvestment <= BUDGET ? 90 : moqInvestment <= BUDGET * 2 ? 55 : 20;

    const result = calculateOpportunityScore({
      marginScore, demandScore: p.demand, competitionGapScore: p.competition, improvementOpportunityScore: p.differentiation,
      qualityScore: q.score, manufacturerConfidenceScore: mc.score, moqSuitabilityScore, capitalScore: moqSuitabilityScore,
      // Mirrors the app: reviewed compliance evidence scores well, unreviewed stays low.
      returnRiskScore: p.returnRisk, complianceScore: p.complianceEvidence ? 80 : 35, shippingSuitabilityScore: p.shipping,
    }, {
      // Same hard override the app applies: a product that loses money per unit is never
      // a launch candidate, however good its other signals look.
      negativeContributionMargin: expected.contributionMarginPct <= 0,
    });

    oppRows.push({
      id: fixedUuid('opp-' + p.name), product_idea_id: ideaId, supplier_id: supplierId,
      score: result.finalScore, recommendation: result.recommendation, breakdown_json: result, score_version: result.scoreVersion,
    });

    const recommendedOrder = computeRecommendedOrder(p.moq, BUDGET, landedCost.readyToSellCostPerUnit);
    const readinessMatrix = buildReadinessMatrix(result.breakdown, result.penaltiesApplied, recommendedOrder.inventoryRisk);
    const blockers = buildBlockers(readinessMatrix, { recommendedTestQty: recommendedOrder.recommendedTestQty, supplierMoq: recommendedOrder.supplierMoq });
    buildVerdict(result.recommendation, blockers); // exercised for parity with the live report path

    const launchReady = result.recommendation === 'Strong launch candidate' || result.recommendation === 'Order samples and validate';
    statusByIdea.set(ideaId, launchReady ? 'launch_ready' : 'researching');
    tally[result.recommendation] = (tally[result.recommendation] || 0) + 1;
  }

  await bulkUpsert('product_ideas', ideaRows, 'upsert ideas');
  await bulkUpsert('research_suppliers', supplierRows, 'upsert suppliers');
  await bulkUpsert('research_price_tiers', tierRows, 'upsert tiers');
  await bulkUpsert('research_supplier_scores', scoreRows, 'upsert supplier scores');
  await bulkUpsert('research_landed_cost_scenarios', lcRows, 'upsert landed cost');
  await bulkUpsert('research_profitability_scenarios', profitRows, 'upsert profitability');
  await bulkUpsert('research_opportunity_scores', oppRows, 'upsert opportunity scores');

  // Persist the launch_ready/researching status the engines actually produced.
  for (const status of ['launch_ready', 'researching']) {
    const ids = [...statusByIdea.entries()].filter(([, s]) => s === status).map(([id]) => id);
    for (const part of chunk(ids, 200)) {
      if (part.length) die(`update status ${status}`, (await sb.from('product_ideas').update({ status }).in('id', part)).error);
    }
  }

  console.log(`✓ ${ideaRows.length} research reports computed by the real engines\n`);
  console.log('Verdict distribution (engine output, not assigned):');
  Object.entries(tally).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
    console.log(`   ${String(v).padStart(4)}  ${k}`);
  });

  console.log(`\n  Login:     ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
  console.log(`  Storefront: http://localhost:3000/store/${SUBDOMAIN}`);
  console.log(`  Research:   http://localhost:3000/dashboard/research`);
  if (PUBLISH) console.log(`  Public:     http://localhost:3000/research  (${ideaRows.length} published examples)`);
}

main();

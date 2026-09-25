// In-depth guides for /sell-online/[slug].
//
// WHY THIS FILE EXISTS
//   The 45 /sell-online pages originally shared one template with a single
//   unique sentence each. Google crawled them and declined to index most
//   ("Crawled – currently not indexed"): to a search engine they were the same
//   page with the city or category name swapped.
//
//   A page is now only indexable when it has a guide here. Pages without one
//   still render (users and internal links keep working) but are served
//   `noindex, follow` and left out of the sitemap. To bring a page back into
//   search, write it a real guide — do NOT copy another guide and swap names;
//   that recreates the exact problem this file fixes.
//
// WRITING RULES
//   - `answer` is the first paragraph and must directly answer the search query.
//   - Every section must contain something specific to this city/category that
//     would be false or irrelevant on any other page.
//   - Numbers in `economics` are illustrative worked examples, labelled as such
//     on the page. Never present them as market data.
//   - FAQs must be unique to the page (no shared boilerplate questions).

export interface GuideSection {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export interface EconomicsRow {
  item: string
  /** Landed cost of the product. */
  cost: number
  price: number
  shipping: number
  packaging: number
  /** Gateway fee + share of COD returns per successful order. */
  other: number
}

export interface SellGuide {
  /** Full <title> text (rendered as-is, no brand suffix — these run long). */
  title: string
  description: string
  h1: string
  /** First paragraph. Answers the query in plain words. */
  answer: string
  /** ISO date of the last substantive edit (drives sitemap + dateModified). */
  updated: string
  sections: GuideSection[]
  economics?: { caption: string; rows: EconomicsRow[] }
  faqs: { q: string; a: string }[]
  /** Descriptive-anchor links to tools. */
  tools: { href: string; label: string }[]
  /** Supporting articles in the same topic cluster. */
  reading: { href: string; label: string }[]
  /** Other /sell-online slugs worth linking to. */
  related: string[]
}

export const SELL_GUIDES: Record<string, SellGuide> = {
  // ─────────────────────────────────────────────────────────── categories ──
  'mobile-accessories': {
    title: 'Sell Mobile Accessories Online in India: Sourcing, Margins & Shipping',
    description:
      'How to sell phone cases, chargers and earbuds online in India: where to buy wholesale, what margins to expect after shipping and COD returns, GST rates, and how to take orders on WhatsApp.',
    h1: 'How to Sell Mobile Accessories Online in India',
    answer:
      'To sell mobile accessories online in India, buy a focused range (usually cases, chargers and cables for the 20–30 most popular phone models) from a wholesale market such as Delhi’s Gaffar Market or Mumbai’s Manish Market, price each item so it still makes money after ₹50–₹90 shipping and COD returns, and sell through your own store link shared on WhatsApp and Instagram, with UPI and Cash on Delivery at checkout. Accessories are small, light and bought again and again, which makes them one of the easiest categories to start with, as long as your prices cover the per-order costs.',
    updated: '2026-09-25',
    sections: [
      {
        heading: 'Pick a range you can actually keep in stock',
        paragraphs: [
          'The biggest mistake new accessory sellers make is stocking "everything for every phone". Phone cases are model-specific, and India has hundreds of models in circulation. Start with the models your buyers actually own: current and previous-generation Samsung Galaxy A and M series, Redmi and Realme number series, recent iPhones and the vivo/OPPO models popular in your area. Check your own WhatsApp contacts. What they carry is a decent sample of your market.',
          'Chargers, cables and earbuds are model-independent, so they carry less inventory risk. Many sellers start with these, then add cases for 20–30 models once they see which ones customers ask for.',
        ],
        bullets: [
          'Low risk: USB-C and Lightning cables, 20W–33W fast chargers, screen guards for top-selling models',
          'Medium risk: back cases and covers (model-specific, but the highest-margin items)',
          'High risk: smartwatches and branded earbuds (thin margins, frequent counterfeits, higher return rates)',
        ],
      },
      {
        heading: 'Where to source mobile accessories wholesale',
        paragraphs: [
          'Most Indian accessory stock is sold through a few wholesale hubs. Gaffar Market in Karol Bagh and Lajpat Rai Market in Chandni Chowk (Delhi) and Manish Market (Mumbai) are the best known. Most cities also have a local mobile market that buys from them. B2B apps and IndiaMART-style listings work for repeat orders once you know which products sell.',
          'Before buying in bulk, order a small sample of each product and test it yourself. With chargers, check the output matches the label (a cheap USB power meter does this). Also check the charger carries a BIS registration mark: chargers and power banks sold in India are covered by compulsory BIS registration. Selling uncertified chargers is a legal risk and a returns problem.',
        ],
      },
      {
        heading: 'What margins look like after shipping and returns',
        paragraphs: [
          'Accessories look very profitable on paper, because a case bought for ₹80 sells for ₹299. But shipping a ₹299 order costs almost as much as shipping a ₹2,999 one. A ₹55 courier charge is 18% of a ₹299 order. So the real lever is order value: bundle a case, a screen guard and a cable, or set free shipping above ₹499, so each parcel carries more revenue.',
          'Cash on Delivery is essential for first-time buyers, but low-value COD orders are the most likely to be refused at the door. Many accessory sellers offer COD only above a minimum order value, or offer a small discount for UPI payment.',
        ],
      },
      {
        heading: 'GST on mobile accessories',
        paragraphs: [
          'Most mobile accessories (chargers, cables, cases, earphones) fall under the 18% GST slab. Confirm the HSN code for each product with your supplier’s invoice or your CA. If you register for GST, remember your margin should be calculated on the price excluding GST. On LaunchGrid, invoices split CGST + SGST or IGST automatically based on where the buyer is.',
        ],
      },
      {
        heading: 'Selling on WhatsApp and Instagram, not just marketplaces',
        paragraphs: [
          'Marketplaces bring traffic, but for small accessory orders their commission, fixed fees and shipping deductions leave very little margin. Your own store link lets you keep the full price, sell bundles marketplaces don’t allow, and build a customer list you can message when new cases arrive for a popular phone launch.',
          'What works well: post "just arrived" cases for newly launched phones on your WhatsApp status the week the phone goes on sale. Early buyers of a new model have few case options, so they’ll pay full price.',
        ],
      },
    ],
    economics: {
      caption: 'Illustrative per-order economics for three accessory products (single-item orders). Replace with your own supplier and courier quotes.',
      rows: [
        { item: 'Printed back case', cost: 80, price: 299, shipping: 55, packaging: 12, other: 25 },
        { item: '20W USB-C fast charger (BIS-registered)', cost: 210, price: 549, shipping: 60, packaging: 15, other: 35 },
        { item: 'Bundle: case + screen guard + cable', cost: 190, price: 649, shipping: 60, packaging: 15, other: 38 },
      ],
    },
    faqs: [
      {
        q: 'Is selling mobile accessories online profitable in India?',
        a: 'It can be, but profit comes from order value, not from the margin on each item. A ₹299 case with ₹55 shipping keeps far less than its 70%+ gross margin suggests. Sellers who bundle items, set a free-shipping minimum and limit COD on very small orders usually end up with a net margin of 30–45% per order.',
      },
      {
        q: 'How much money do I need to start a mobile accessories business?',
        a: 'You can test with ₹10,000–₹25,000 of stock. That’s enough for chargers and cables plus cases for your 10 best-selling phone models. Add a store (free to start on LaunchGrid) and a courier aggregator account, and you can take orders the same week.',
      },
      {
        q: 'Do I need a licence to sell chargers and power banks?',
        a: 'Chargers, adapters and power banks sold in India must carry BIS registration under the compulsory registration scheme. Buy only from suppliers who can show the registration number (the R-number on the product) and keep their invoices.',
      },
      {
        q: 'Which mobile accessories sell the most online?',
        a: 'Back cases and screen guards for popular models, fast chargers and USB-C cables sell most consistently. Cases for a newly launched phone sell fastest in its first few weeks, while options are limited.',
      },
      {
        q: 'Should I offer Cash on Delivery on accessories?',
        a: 'Yes for first-time buyers, since COD is what gets a hesitant customer to order. But low-value COD orders get refused most often. A common rule is COD above ₹399–₹499 and UPI only below that, or a small UPI discount.',
      },
    ],
    tools: [
      { href: '/tools/profit-margin-calculator', label: 'Calculate your product profit margin' },
      { href: '/tools/shipping-cost-calculator', label: 'Estimate courier cost per order' },
      { href: '/tools/whatsapp-message-generator', label: 'Create a WhatsApp order link' },
      { href: '/tools/gst-calculator', label: 'Work out GST on accessories' },
    ],
    reading: [
      { href: '/blog/mobile-accessories-business-margins-sourcing', label: 'Mobile accessories business: sourcing, margins and best sellers' },
      { href: '/blog/how-to-sell-on-whatsapp-india', label: 'How to sell on WhatsApp in India' },
    ],
    related: ['noida', 'beauty-cosmetics', 'jewellery'],
  },

  sarees: {
    title: 'How to Sell Sarees Online in India: Pricing, Photos, Shipping & Returns',
    description:
      'A practical guide to selling sarees online in India: sourcing from Surat, Varanasi and Kanchipuram, pricing with shipping and returns built in, photographing drape and fall, GST at 5%, and selling on WhatsApp.',
    h1: 'How to Sell Sarees Online in India',
    answer:
      'To sell sarees online, choose a clear niche (daily-wear cotton, Surat georgette, Banarasi or Kanjivaram silk), photograph every saree in natural light with a full drape, the pallu and a close-up of the border, and price it so shipping, packaging and a returns buffer are already covered. Then sell through your own store link shared on WhatsApp and Instagram, with UPI and Cash on Delivery at checkout. Sarees suit online selling well: one size fits all, so there are no size-related returns. Most returns happen because the colour or fabric didn’t match the photo, so honest photos matter more than anything else.',
    updated: '2026-09-25',
    sections: [
      {
        heading: 'Choose a niche buyers can recognise',
        paragraphs: [
          'Saree buyers search by weave, fabric and occasion, not by "saree". A store positioned as "handloom cotton sarees for office wear" or "Banarasi silk for weddings" is easier to remember, easier to share, and easier to rank for than a general saree shop.',
        ],
        bullets: [
          'Daily-wear and office: cotton, linen, mul-mul, tant (price-sensitive, repeat buyers)',
          'Party and festive: georgette, chiffon, organza, Surat printed and embroidered (trend-driven)',
          'Wedding and heirloom: Banarasi, Kanjivaram, Paithani, Patola (high value, research-heavy buyers)',
        ],
      },
      {
        heading: 'Where saree sellers source',
        paragraphs: [
          'Surat is the main source for synthetic, georgette and printed sarees, with wholesale markets around Ring Road. Varanasi weavers and showrooms supply Banarasi silk. Kanchipuram and Arni supply Kanjivaram and silk-cotton, and Kolkata and Shantipur supply tant and handloom cotton. For silk, ask whether the zari is real (silver or gold-coated) or tested (imitation). That one answer changes both the price and how you should describe the saree.',
          'Many new sellers start as resellers: they photograph a wholesaler’s stock and order only when a customer pays. It’s low risk, but check delivery times first. A saree that takes 10 days to reach the buyer gets more cancellations.',
        ],
      },
      {
        heading: 'Photos that reduce returns',
        paragraphs: [
          'The most common reason a saree is returned is "the colour looked different". Photograph in daylight near a window, never under yellow tube lights, and add one un-edited close-up. Show at least five images: full drape on a model or mannequin, the pallu spread flat, the border close-up, the blouse piece, and the fabric texture. Mention the saree length (usually 5.5 m plus a 0.8 m blouse piece) and whether the blouse piece is attached.',
        ],
      },
      {
        heading: 'Pricing, shipping and returns',
        paragraphs: [
          'A packed saree usually ships in the 500 g–1 kg slab, so courier costs are predictable. Silk sarees need a rigid box so they aren’t crushed, which adds packaging cost. Build a returns buffer into the price: if 1 in 10 orders comes back, the two-way shipping on that one order has to be paid for by the other nine.',
          'For high-value silk, ask for full or partial prepayment by UPI. Refused COD parcels on a ₹15,000 saree cost both shipping and weeks of blocked stock. Many sellers take a small UPI advance to confirm an order and collect the balance on delivery.',
        ],
      },
      {
        heading: 'GST on sarees',
        paragraphs: [
          'Sarees are usually taxed as woven fabric, generally at 5% GST. Confirm the HSN code for silk, cotton and synthetic sarees with your supplier’s invoice or your CA. If you sell only within your own state and your turnover is below the threshold, you may not need a GSTIN at first. Once you register, LaunchGrid creates the invoice with the right CGST + SGST or IGST split automatically.',
        ],
      },
      {
        heading: 'Selling around the wedding and festive calendar',
        paragraphs: [
          'Saree demand peaks around Navratri, Durga Puja, Diwali, Onam and Pongal, and during wedding season. Put up your festive collection 3–4 weeks before each peak, not in the week itself, so buyers have time to order a blouse stitched. A WhatsApp broadcast to past buyers with the new collection link usually brings in more orders than paid ads for an established seller.',
        ],
      },
    ],
    economics: {
      caption: 'Illustrative per-order economics for three saree price points. Replace with your own supplier and courier quotes.',
      rows: [
        { item: 'Cotton daily-wear saree', cost: 450, price: 999, shipping: 70, packaging: 25, other: 50 },
        { item: 'Surat georgette party saree', cost: 650, price: 1499, shipping: 80, packaging: 35, other: 95 },
        { item: 'Banarasi silk saree (tested zari)', cost: 3200, price: 5999, shipping: 110, packaging: 90, other: 280 },
      ],
    },
    faqs: [
      {
        q: 'How can I sell sarees online from home?',
        a: 'Start with a small collection of 15–30 sarees in one niche, photograph them in daylight, and put them in an online store you can share on WhatsApp and Instagram. You can begin as a reseller for a Surat or local wholesaler, ordering only after a customer pays, so you need very little upfront stock.',
      },
      {
        q: 'What is a good profit margin on sarees?',
        a: 'Sellers commonly price at 1.8–2.5 times the wholesale cost for printed and synthetic sarees, and lower multiples for high-value silk. After shipping, packaging and returns, a net margin of 30–45% on mid-range sarees is realistic. Use the worked examples above and the profit margin calculator with your own costs.',
      },
      {
        q: 'Should I offer Cash on Delivery on expensive silk sarees?',
        a: 'Full COD on a high-value saree is risky, because a refused parcel costs two-way shipping and blocks the stock for weeks. Many sellers accept a UPI advance (for example 20–30%) to confirm the order and collect the rest on delivery, or offer free shipping only on prepaid orders.',
      },
      {
        q: 'How do I reduce saree returns?',
        a: 'Most returns are colour or fabric mismatches. Use daylight photos, add one unedited close-up, state the fabric honestly (pure silk vs art silk, real vs tested zari), and give the exact length and blouse details. Clear information in the listing cuts returns more than any policy does.',
      },
      {
        q: 'Where do wholesale sarees come from?',
        a: 'Surat is the largest hub for synthetic, georgette and printed sarees. Varanasi supplies Banarasi silk, Kanchipuram and Arni supply Kanjivaram, and West Bengal supplies tant and handloom cotton. Local wholesalers in most cities buy from these hubs.',
      },
    ],
    tools: [
      { href: '/tools/profit-margin-calculator', label: 'Calculate your saree profit margin' },
      { href: '/tools/invoice-generator', label: 'Create a GST invoice' },
      { href: '/tools/whatsapp-message-generator', label: 'Make a WhatsApp order link' },
      { href: '/tools/shipping-cost-calculator', label: 'Estimate saree shipping cost' },
    ],
    reading: [
      { href: '/blog/how-to-price-sarees-online', label: 'How to price sarees online: margins, shipping and returns' },
      { href: '/blog/how-to-sell-on-whatsapp-india', label: 'How to sell on WhatsApp in India' },
    ],
    related: ['clothing-boutique', 'jaipur', 'pune'],
  },

  'home-decor': {
    title: 'Sell Home Decor Online in India: Products, Pricing & Fragile Shipping',
    description:
      'How to sell home decor online in India: which products ship well, pricing for volumetric weight and breakage, photographing decor in real rooms, and selling festive collections through your own store.',
    h1: 'How to Sell Home Decor Online in India',
    answer:
      'To sell home decor online in India, focus on a clear style (block-print textiles, brass and metal, ceramics, macramé, festive decor), photograph products in a real room so buyers can judge size, and price for volumetric shipping and breakage, not just product cost. Then sell through your own store with collections like "wall", "table" and "festive", shared on Instagram and WhatsApp. Decor sells on looks, so your own storefront, where every photo supports your style, usually converts better than a marketplace listing next to thousands of lookalikes.',
    updated: '2026-09-25',
    sections: [
      {
        heading: 'Pick products that ship well',
        paragraphs: [
          'Decor ranges from nearly unbreakable (cushion covers, table runners, wall hangings) to very fragile (ceramic vases, glass lanterns). New sellers do best starting with soft furnishings and metal pieces, then adding fragile items once their packaging is tested.',
        ],
        bullets: [
          'Easy to ship: cushion covers, table linen, macramé, wall hangings, brass and iron decor',
          'Needs care: ceramics, blue pottery, mirrors, framed art',
          'Hard: large glass, heavy furniture and oversized planters (use specialist freight, not standard couriers)',
        ],
      },
      {
        heading: 'Volumetric weight changes your pricing',
        paragraphs: [
          'Couriers charge on the greater of actual weight and volumetric weight (length × width × height in cm ÷ 5000 for most Indian aggregators). A light but bulky lampshade in a 40 × 40 × 40 cm box is billed at about 12.8 kg, not the 1 kg it actually weighs. Measure your packed box before setting a price. Flat-packing or nesting items can cut your shipping cost dramatically.',
        ],
      },
      {
        heading: 'Packaging fragile decor',
        paragraphs: [
          'The standard for ceramics and glass is two boxes: wrap the item in bubble wrap, put it in a snug inner box, and leave 5 cm of padding on all sides inside the outer box. Mark the box "fragile", but don’t rely on the label. Record a short video of every fragile order being packed, because it settles damage disputes with both buyers and couriers.',
        ],
      },
      {
        heading: 'Photograph decor in context',
        paragraphs: [
          'Buyers can’t judge the size of a vase on a white background. Show every product in a real setting (on a console table, next to a sofa, beside a common object), plus one plain shot for detail, and give the dimensions in centimetres. Group products into collections by room or occasion so a buyer who likes one piece sees the next.',
        ],
      },
      {
        heading: 'Plan for festive peaks',
        paragraphs: [
          'Diwali is the single biggest decor season, followed by weddings and housewarmings. Diyas, torans, lanterns and gift hampers sell from late September. Launch your festive collection 4–6 weeks before Diwali, and offer gift wrapping and a message card as paid extras. They add margin at little cost.',
        ],
      },
    ],
    economics: {
      caption: 'Illustrative per-order economics for three decor products. Shipping reflects volumetric weight. Replace with your own quotes.',
      rows: [
        { item: 'Block-print cushion covers (set of 2)', cost: 280, price: 899, shipping: 65, packaging: 20, other: 45 },
        { item: 'Brass diya set (festive)', cost: 420, price: 1199, shipping: 75, packaging: 35, other: 55 },
        { item: 'Ceramic table vase', cost: 380, price: 1199, shipping: 110, packaging: 70, other: 80 },
      ],
    },
    faqs: [
      {
        q: 'What home decor items sell best online in India?',
        a: 'Items that are giftable, photograph well and ship safely do best: cushion covers, table linen, wall hangings, brass and metal decor, candles, and festive diyas and torans around Diwali. Fragile ceramics sell well too, but only once your packaging is reliable.',
      },
      {
        q: 'How do I ship fragile home decor without breakage?',
        a: 'Use two boxes with bubble wrap and at least 5 cm of padding between them, record a packing video for each order, and add a small breakage buffer to your price. For high-value pieces, choose a courier plan that includes damage cover.',
      },
      {
        q: 'Why is shipping so expensive for my decor products?',
        a: 'Because couriers charge on volumetric weight: box length × width × height in cm ÷ 5000. A light but bulky item can cost as much to ship as a heavy one. Use smaller boxes, flat-pack where you can, and check the volumetric weight before you set prices.',
      },
      {
        q: 'Do I need GST registration to sell home decor online?',
        a: 'Within your own state, you can usually start below the turnover threshold without GST. Selling to other states generally requires registration, and GST rates on decor vary by material, so confirm HSN codes with your CA. LaunchGrid applies the right tax split on each invoice once you add your GSTIN.',
      },
    ],
    tools: [
      { href: '/tools/profit-margin-calculator', label: 'Calculate decor profit margin' },
      { href: '/tools/shipping-cost-calculator', label: 'Check volumetric shipping cost' },
      { href: '/tools/discount-calculator', label: 'Plan a festive discount' },
      { href: '/tools/invoice-generator', label: 'Create a GST invoice' },
    ],
    reading: [
      { href: '/blog/ship-home-decor-without-breakage', label: 'How to ship fragile home decor across India' },
      { href: '/blog/how-to-start-online-store-india-2026', label: 'How to start an online store in India' },
    ],
    related: ['jaipur', 'handicrafts', 'pune'],
  },

  // ─────────────────────────────────────────────────────────────── cities ──
  jaipur: {
    title: 'Sell Online in Jaipur: Block Prints, Gems & Handicrafts to All India',
    description:
      'A guide for Jaipur sellers going online: selling block-print textiles, blue pottery, gemstone jewellery and juttis across India, shipping from Rajasthan, IGST on out-of-state orders, and keeping tourist customers buying.',
    h1: 'How to Sell Online From Jaipur',
    answer:
      'Jaipur sellers do best online by selling what the city is already known for (Sanganeri and Bagru block prints, blue pottery, gemstone and silver jewellery, juttis) to buyers across India, using their own store link instead of relying only on walk-in and tourist footfall. Most of your orders will ship outside Rajasthan, so plan courier costs and IGST from the start, pack fragile pottery properly, and print your store link on every bill so tourists can reorder after they go home.',
    updated: '2026-09-25',
    sections: [
      {
        heading: 'What sells from Jaipur, and why buyers trust it',
        paragraphs: [
          'Jaipur has something most cities don’t: products people already associate with it. "Jaipuri razai", "Sanganeri print" and "Jaipur blue pottery" are phrases buyers across India search for. Use the craft, the technique and the place in your product names and descriptions, for example "Hand block-printed Bagru dabu bedsheet, natural dyes", not just "cotton bedsheet".',
        ],
        bullets: [
          'Textiles: Sanganeri and Bagru block-print bedsheets, quilts (razai), kurtas and fabric by the metre',
          'Jewellery: Johari Bazaar gemstone, kundan and silver pieces, including oxidised jewellery',
          'Crafts: blue pottery, lac bangles, Bapu Bazaar juttis, marble and brass decor',
        ],
      },
      {
        heading: 'Turning tourists into repeat online customers',
        paragraphs: [
          'Many Jaipur shops make most of their sales to visitors, who buy once and leave. Put a QR code linking to your online store on every bill, bag and business card, with a line like "Reorder from anywhere in India". A tourist who loved your bedsheet in December is your best customer for a gift in March.',
          'Keep a WhatsApp broadcast list of these buyers (with their permission) and send new-arrival links a few times a year: winter razai stock, Teej and Diwali collections, wedding-season jewellery.',
        ],
      },
      {
        heading: 'Shipping out of Rajasthan',
        paragraphs: [
          'Most of your buyers will be in Delhi NCR, Mumbai, Bengaluru and other metros, all out of state. Delhi NCR is usually the fastest and cheapest lane from Jaipur, and South India the longest. Quote realistic delivery times by region on your store instead of one national promise.',
          'Blue pottery and ceramics need double-boxing with bubble wrap. Quilts and razais are light but bulky, so check volumetric weight (L × W × H ÷ 5000) before pricing, and vacuum-pack them where you can to cut the billed weight.',
        ],
      },
      {
        heading: 'GST for Jaipur sellers',
        paragraphs: [
          'Rajasthan’s GST state code is 08. Sales to buyers inside Rajasthan carry CGST + SGST, while sales to other states carry IGST, so most of your online invoices will be IGST. Selling across state lines generally requires GST registration. LaunchGrid reads the buyer’s delivery state and applies the correct split on every invoice automatically.',
        ],
      },
      {
        heading: 'Seasons that matter in Jaipur',
        paragraphs: [
          'The tourist season (October–March) overlaps with wedding and festive demand nationally, so this is when stock runs out. Build your online stock before October. Razai and quilt demand rises in North India from November, while summer is a good time for cotton block-print dresses, kurtas and light bedsheets.',
        ],
      },
    ],
    faqs: [
      {
        q: 'How do I start selling Jaipur handicrafts online?',
        a: 'Photograph your 20–30 best products in daylight, name each one with its craft and technique (Sanganeri, Bagru, blue pottery), and put them in an online store. Share the link on WhatsApp and Instagram, and print a QR code to it on every bill so your in-store customers can reorder.',
      },
      {
        q: 'Do Jaipur sellers need GST to sell online to other states?',
        a: 'Selling goods to buyers in other states generally requires GST registration, and those invoices carry IGST. Sales within Rajasthan (state code 08) carry CGST + SGST. Check your case with a CA. Once your GSTIN is added, LaunchGrid applies the right split automatically.',
      },
      {
        q: 'How do I ship blue pottery safely from Jaipur?',
        a: 'Wrap each piece in bubble wrap, place it in a snug inner box, and pack that inside an outer box with at least 5 cm of padding. Record a packing video for each order to settle any damage claim, and add a small breakage buffer to your prices.',
      },
      {
        q: 'Which Jaipur products sell best online?',
        a: 'Block-print bedsheets and quilts, kurtas and fabric, oxidised and silver jewellery, juttis, and blue pottery gifts sell consistently, because buyers across India already know and search for them.',
      },
    ],
    tools: [
      { href: '/tools/invoice-generator', label: 'Create a GST invoice with IGST' },
      { href: '/tools/shipping-cost-calculator', label: 'Estimate shipping from Jaipur' },
      { href: '/tools/qr-code-generator', label: 'Make a QR code for your store link' },
      { href: '/tools/profit-margin-calculator', label: 'Calculate your product profit margin' },
    ],
    reading: [
      { href: '/blog/ship-home-decor-without-breakage', label: 'How to ship fragile decor and pottery' },
      { href: '/blog/complete-gst-guide-small-businesses', label: 'GST guide for small online businesses' },
    ],
    related: ['home-decor', 'handicrafts', 'jewellery'],
  },

  pune: {
    title: 'Sell Online in Pune: Grow Your Shop Beyond Laxmi Road & FC Road',
    description:
      'A guide for Pune businesses going online: reaching students and IT professionals, same-day local delivery, selling to Mumbai and the rest of Maharashtra, GST for Maharashtra sellers, and taking orders on WhatsApp.',
    h1: 'How to Sell Online in Pune',
    answer:
      'Pune businesses sell online most successfully by pairing a shareable store link with same-day local delivery for Pune buyers and courier shipping everywhere else. Buyers in Kothrud, Baner, Hinjewadi, Viman Nagar and Kharadi are young and pay by UPI, and they expect to order from a link, not a DM thread. Sales within Maharashtra (including Mumbai, three hours away) carry CGST + SGST, which keeps your invoices simple while you grow.',
    updated: '2026-09-25',
    sections: [
      {
        heading: 'Who buys online in Pune',
        paragraphs: [
          'Pune has two large online-first buyer groups: students around FC Road, Kothrud and Viman Nagar, and IT professionals in Hinjewadi, Baner, Kharadi and Magarpatta. Both order on their phones, pay by UPI, and discover shops through Instagram and WhatsApp groups (society, office and college groups). A store link that opens in one tap and checks out in under a minute matters more to them than a detailed website.',
        ],
      },
      {
        heading: 'What Pune sellers are putting online',
        paragraphs: [
          'Traditional retail around Laxmi Road, Tulshibaug and Mandai (sarees, Paithani, jewellery, puja items) now sells to Pune families who have moved to other cities, and they order for festivals and weddings. At the same time, home bakers, chocolatiers, plant studios and small fashion labels in the western suburbs sell mainly to local buyers.',
        ],
        bullets: [
          'Paithani and wedding sarees, sold to Maharashtrian families across India',
          'Home bakeries and cake studios with same-day local delivery',
          'Snacks: bakarwadi and chivda-style namkeen, which ship well',
          'College-area fashion, thrift and accessories',
        ],
      },
      {
        heading: 'Local delivery inside Pune',
        paragraphs: [
          'For cakes, flowers and anything needed the same day, use an on-demand bike courier such as Porter, or your own delivery person, instead of a national courier. Set delivery zones and charges by area. Hinjewadi to Hadapsar is a long ride, so one flat fee rarely works across the whole city. Show an order cut-off time (for example "order by 2 pm for same-day delivery") on your store.',
        ],
      },
      {
        heading: 'Selling beyond Pune: Mumbai first',
        paragraphs: [
          'Mumbai is Pune’s biggest nearby market, and courier delivery between them is usually next-day. Because both are in Maharashtra, those sales carry CGST + SGST like your local sales. Maharashtra’s GST state code is 27. Orders to other states carry IGST. LaunchGrid applies the correct split automatically from the buyer’s delivery address.',
        ],
      },
      {
        heading: 'Festive calendar in Pune',
        paragraphs: [
          'Ganeshotsav is Pune’s biggest retail moment, with demand for decoration, modaks, puja items and festive clothing. It’s followed by Navratri, Diwali and the wedding season. Launch Ganeshotsav collections two to three weeks early. For bakers and sweet makers, take pre-orders with UPI payment so you can plan batches instead of turning buyers away.',
        ],
      },
    ],
    faqs: [
      {
        q: 'How do I start an online store for my Pune shop?',
        a: 'Add your best-selling products with clear photos, set your delivery zones and charges for Pune areas, add courier shipping for other cities, and share the store link in your WhatsApp status, society groups and Instagram bio. On LaunchGrid this takes about 15 minutes, and you can start free.',
      },
      {
        q: 'Can I offer same-day delivery in Pune?',
        a: 'Yes. Use an on-demand bike courier or your own delivery staff for local orders, charge by area, and show a clear daily cut-off time. Keep national couriers for orders outside Pune.',
      },
      {
        q: 'Do I charge IGST when selling from Pune to Mumbai?',
        a: 'No. Pune and Mumbai are both in Maharashtra (GST state code 27), so those are intra-state sales with CGST + SGST. IGST applies when you ship to a buyer in another state.',
      },
      {
        q: 'What sells well online from Pune?',
        a: 'Paithani and festive sarees sold to Maharashtrian families across India, home-baked cakes and chocolates for local delivery, packaged snacks like bakarwadi and chivda, and college-area fashion all do well.',
      },
    ],
    tools: [
      { href: '/tools/whatsapp-message-generator', label: 'Create a WhatsApp order link' },
      { href: '/tools/gst-calculator', label: 'Split CGST and SGST for Maharashtra' },
      { href: '/tools/profit-margin-calculator', label: 'Calculate your product profit margin' },
      { href: '/tools/qr-code-generator', label: 'Make a QR code for your shop counter' },
    ],
    reading: [
      { href: '/blog/how-to-sell-on-whatsapp-india', label: 'How to sell on WhatsApp in India' },
      { href: '/blog/how-to-price-sarees-online', label: 'How to price sarees online' },
    ],
    related: ['sarees', 'bakery-sweets', 'mumbai'],
  },

  noida: {
    title: 'Sell Online in Noida: Launch a D2C Brand from Uttar Pradesh',
    description:
      'A guide for Noida and Greater Noida sellers: launching D2C brands, sourcing electronics and accessories from Delhi, why orders to Delhi are inter-state for GST, and shipping across NCR and India.',
    h1: 'How to Sell Online From Noida',
    answer:
      'To sell online from Noida, set up your own store with UPI and COD checkout, source from nearby Delhi wholesale markets (Gaffar Market, Chandni Chowk, Sadar Bazar), and market to NCR buyers first, since they can receive orders the next day. One thing surprises many new Noida sellers: Noida is in Uttar Pradesh, so an order to a buyer across the border in Delhi is an inter-state sale with IGST, not CGST + SGST. Plan your GST registration with that in mind.',
    updated: '2026-09-25',
    sections: [
      {
        heading: 'Why Noida suits D2C founders',
        paragraphs: [
          'Noida and Greater Noida combine cheaper warehouse and office space than Delhi, an industrial base that includes electronics manufacturing, and quick road access to Delhi’s wholesale markets. That makes it a practical base for gadget and accessory brands, print-on-demand, home and kitchen products, and apparel labels that outsource stitching.',
        ],
        bullets: [
          'Mobile and gadget accessories sourced from Delhi wholesale markets',
          'Print-on-demand t-shirts, mugs and merchandise',
          'Home, kitchen and gifting products',
          'Apparel labels working with NCR fabricators',
        ],
      },
      {
        heading: 'The Delhi–UP border and GST',
        paragraphs: [
          'Uttar Pradesh’s GST state code is 09 and Delhi’s is 07. A buyer in Sector 62 gets CGST + SGST on their invoice. A buyer ten kilometres away in Mayur Vihar gets IGST, because the goods cross a state line. Selling goods inter-state generally requires GST registration, so most Noida sellers who deliver to Delhi or ship nationally register early.',
          'You don’t need to work this out order by order. LaunchGrid reads the delivery state from the checkout address and applies CGST + SGST or IGST on each invoice automatically.',
        ],
      },
      {
        heading: 'Sourcing from Delhi',
        paragraphs: [
          'Gaffar Market (Karol Bagh) and Lajpat Rai Market (Chandni Chowk) for mobile and electronics accessories, Sadar Bazar for household goods, toys and gifting, and Gandhi Nagar for garments are all within an hour’s drive. Buy samples before you buy in bulk, keep every purchase invoice (you need it for GST input credit), and for chargers and power banks, stock only BIS-registered products.',
        ],
      },
      {
        heading: 'Selling across NCR, then India',
        paragraphs: [
          'Start where delivery is fastest. Next-day delivery across Noida, Delhi, Ghaziabad and Gurugram lets you offer COD with fewer refused parcels and build reviews quickly. Once your products and packaging are proven, open national shipping through a courier aggregator and offer prepaid-only or a UPI discount for distant pincodes, where COD returns are most expensive.',
        ],
      },
      {
        heading: 'Moving fast',
        paragraphs: [
          'Noida’s founder community moves quickly. The brands that win usually launch a small catalogue this week, learn from the first 50 orders, and fix pricing and packaging before scaling ads. A store you can launch in 15 minutes and edit from your phone fits that pace better than a website that takes an agency weeks to build.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Is an order from Noida to Delhi intra-state or inter-state for GST?',
        a: 'Inter-state. Noida is in Uttar Pradesh (state code 09) and Delhi is a separate state for GST (code 07), so the invoice carries IGST. Orders to buyers within UP, such as Noida, Greater Noida and Ghaziabad, carry CGST + SGST.',
      },
      {
        q: 'Where can Noida sellers source products wholesale?',
        a: 'Delhi’s wholesale markets are close by: Gaffar Market and Lajpat Rai Market for mobile and electronics accessories, Sadar Bazar for household goods, toys and gifts, and Gandhi Nagar for garments. Always buy samples first and keep purchase invoices.',
      },
      {
        q: 'How fast can I launch an online store in Noida?',
        a: 'With LaunchGrid you can have a store with UPI and COD checkout live in about 15 minutes, on a free yourname.launchgrid.in address, and add a custom domain later.',
      },
      {
        q: 'Should Noida sellers offer COD across India?',
        a: 'Offer COD freely within NCR, where delivery is fast and refusals are fewer. For distant pincodes, consider prepaid-only or a small UPI discount, because a refused COD parcel costs two-way shipping.',
      },
    ],
    tools: [
      { href: '/tools/gst-calculator', label: 'Calculate IGST vs CGST + SGST' },
      { href: '/tools/invoice-generator', label: 'Create a GST invoice' },
      { href: '/tools/profit-margin-calculator', label: 'Calculate your product profit margin' },
      { href: '/tools/roas-calculator', label: 'Check your Meta ads ROAS' },
    ],
    reading: [
      { href: '/blog/mobile-accessories-business-margins-sourcing', label: 'Mobile accessories business: sourcing and margins' },
      { href: '/blog/complete-gst-guide-small-businesses', label: 'GST guide for small online businesses' },
    ],
    related: ['mobile-accessories', 'delhi', 'gurgaon'],
  },
}

export function getGuide(slug: string): SellGuide | undefined {
  return SELL_GUIDES[slug]
}

/** Only pages with a real guide are indexed and listed in the sitemap. */
export function isIndexableSeoPage(slug: string): boolean {
  return slug in SELL_GUIDES
}

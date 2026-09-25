// Single source of truth for blog posts: the post route, the /blog index and the
// sitemap all read from here, so a post can't exist without being listed.

export interface BlogPostData {
  title: string
  /** Meta description and index-card summary. Falls back to the first paragraph. */
  description?: string
  category: string
  date: string
  /** ISO date of the last substantive edit. */
  updated?: string
  readTime: string
  content: string[]
  faqs: { question: string; answer: string }[]
  /** Commercial page this post supports (topic cluster hub). */
  pillar?: { href: string; label: string }
}

export const blogPosts: Record<string, BlogPostData> = {
  'start-dropshipping-india': {
    pillar: { href: '/tools/profit-margin-calculator', label: 'Calculate your product profit margin' },
    title: 'How to start dropshipping in India with zero inventory investment',
    category: 'Guides',
    date: 'June 5, 2026',
    readTime: '6 min read',
    content: [
      'Dropshipping has emerged as one of the most popular business models in India for aspiring entrepreneurs. Unlike traditional e-commerce, dropshipping allows you to sell products directly to buyers without buying bulk inventory upfront or managing a warehouse.',
      'Here is the exact step-by-step roadmap to launch your dropshipping business in India:',
      '1. Identify a Niche: Avoid generic stores. Focus on specific verticals like home decor, minimalist jewelry, or fitness accessories where passion drives buying decisions.',
      '2. Find Suppliers: Use reliable dropship platforms or local Indian suppliers (e.g. GlowRoad, Robu) that offer high-quality products, shipping across India, and Cash on Delivery (COD) capabilities.',
      '3. Launch Your Storefront: Use LaunchGrid to deploy a premium, conversion-optimized storefront in 15 seconds. Ensure you configure UPI payment processing.',
      '4. Run Targeted Campaigns: Start with low-budget Meta conversion ads or seed products to micro-influencers on Instagram to drive your first visitors.'
    ],
    faqs: [
      {
        question: 'Do I need GST to start dropshipping in India?',
        answer: 'If you are selling goods within your own state, you do not need GST registration until your annual turnover exceeds ₹40 Lakhs. However, for inter-state sales, GST registration is required. LaunchGrid helps you start with a trial, but you should register for GST once your sales pick up.'
      },
      {
        question: 'What is the minimum investment required?',
        answer: 'You do not need money for inventory, but we recommend keeping at least ₹5,000 liquid capital to fund initial orders before Razorpay/UPI settlements land in your account.'
      }
    ]
  },
  'gst-compliance-ecommerce': {
    title: 'How does GST compliance work for online ecommerce stores in India?',
    category: 'Compliance',
    date: 'May 28, 2026',
    readTime: '8 min read',
    content: [
      'Navigating tax compliance is one of the biggest challenges for ecommerce founders in India. Staying compliant prevents heavy fines and ensures smooth payment settlement.',
      'Understanding the GST Thresholds:',
      'For standard intra-state trade, you must register for GST once your turnover crosses ₹40 Lakhs (for goods) or ₹20 Lakhs (for services). However, online portals like Amazon or Shopify require a GSTIN from day one. LaunchGrid allows UPI-based direct checkouts, giving you room to test your store before filing for a GSTIN.',
      'How Taxes Split on Invoices:',
      'If you sell to a customer in the same state as your business location, CGST (Central GST) and SGST (State GST) are split equally (e.g., 9% + 9% for a 18% tax tier). If the customer is in another state, a single IGST (Integrated GST) of 18% is applied. LaunchGrid automates this calculation on every generated invoice based on customer state selections.'
    ],
    faqs: [
      {
        question: 'Is GST mandatory for selling online in India?',
        answer: 'Technically, any inter-state commerce requires GST registration under section 24 of the CGST Act. However, local state-level sales can be conducted under the GST threshold limit.'
      },
      {
        question: 'What is the standard GST rate for dropshipped goods?',
        answer: 'Most consumer electronics, clothing, and home accessories fall under the 18% GST rate bracket.'
      }
    ]
  },
  'what-is-abandoned-cart-recovery': {
    title: 'What is abandoned cart recovery: Recovering lost sales on auto-pilot',
    category: 'Optimization',
    date: 'May 14, 2026',
    readTime: '5 min read',
    content: [
      'Almost 70% of shoppers add items to their cart but leave before completing checkout. In e-commerce, this is known as cart abandonment.',
      'Why shoppers abandon checkout:',
      'High shipping fees, complex multi-step forms, and lack of trusted payment options are the top reasons. To counter this, LaunchGrid utilizes a single-page checkout design and automatically calculates shipping fees as free.',
      'The Recovery Loop:',
      'If a buyer enters their details but fails to complete payment, LaunchGrid starts a 30-minute timer. Once expired, it triggers automated emails and WhatsApp messages offering a direct link to resume checkout, occasionally adding a limited-time coupon discount. This setup recovers up to 25% of lost checkouts automatically.'
    ],
    faqs: [
      {
        question: 'How do you trigger cart recovery?',
        answer: 'LaunchGrid monitors checkout initiation. If an order remains in "pending" payment status for 30 minutes, it automatically executes the recovery flow.'
      },
      {
        question: 'Can I customize the recovery messages?',
        answer: 'Yes, merchants can configure recovery message templates and discounts inside the dashboard settings.'
      }
    ]
  },
  'best-dukaan-alternatives-india': {
    title: 'Best Dukaan Alternatives in India (2026): An Honest Comparison',
    category: 'Comparisons',
    date: 'June 13, 2026',
    readTime: '9 min read',
    content: [
      'If you built your store on Dukaan and you are now looking for an alternative, you are not alone. Many Indian sellers who started on app-only store builders have run into the same walls: an app-only storefront that does not feel like a real website, limited control over checkout, and pricing that climbs as soon as you want features that should be standard. This guide compares the genuine alternatives available to Indian sellers in 2026 — honestly, including where each one is weaker — so you can pick the right home for your business.',
      'What to actually look for in a Dukaan alternative:',
      '1. A real storefront, not just an app link. Your customers should land on a clean, mobile-fast website at your own subdomain (or custom domain) — something you can share on WhatsApp status, Instagram bio, and Google. A store that only lives inside an app is harder to share and harder to trust.',
      '2. Payments that fit India. UPI and Cash on Delivery (COD) are non-negotiable for most Indian buyers. COD in particular is what converts first-time customers who do not yet trust your brand. If a platform makes COD hard to enable, that is a red flag.',
      '3. GST-ready invoicing built in. The moment your sales grow, GST compliance becomes real work. A good platform splits CGST/SGST/IGST automatically based on the buyer state and generates a clean invoice on every order — so you are not paying an accountant for something software should do.',
      '4. WhatsApp-native selling. In India, the order conversation happens on WhatsApp. Order alerts, shipping updates, and a one-tap "share this product" link matter more here than anywhere else.',
      '5. Honest, predictable pricing. Watch for the gap between the headline "free" and what you actually pay to keep a working store. A genuinely free tier — even a capped one — lets you test before you commit a single rupee.',
      'The main options for Indian sellers in 2026:',
      'Shopify — the global heavyweight. Shopify is powerful and reliable, but it is priced in USD (effectively ₹2,000+/month before apps), and GST, COD, and UPI all require extra apps or configuration. It is a strong choice once you are doing serious volume and can absorb the app stack; it is overkill and overpriced for a seller taking their first orders.',
      'Instamojo / other payment-first tools — these started as payment links and bolted on stores. Fine for a quick link-in-bio sale, but the storefront experience is thin and they are not built around a full catalog, GST invoicing, or fulfilment workflow.',
      'LaunchGrid — built for exactly this seller. LaunchGrid gives you a full storefront at yourname.launchgrid.in in about 15 minutes, with UPI and COD checkout, automatic GST invoices, WhatsApp selling tools, and order alerts on your phone — on a genuinely free tier (up to 3 products, with a small "Made with LaunchGrid" badge) so you can launch and test before paying anything. You upgrade only when you want more products and advanced features. The honest trade-off: LaunchGrid is India-focused and newer than Shopify, so if you need a huge third-party app ecosystem or international-first features, Shopify still wins there.',
      'How to switch without losing momentum:',
      'Switching is simpler than most sellers expect, because the assets you care about — your product photos, your prices, and your customer list — are yours. Export your product list and images, set up your new store (LaunchGrid can have you live in 15 minutes), point your WhatsApp status and Instagram bio at the new link, and run a short "we moved — same products, faster checkout" message to your existing customers. Keep the old store live for a week so no in-flight orders are lost, then retire it.',
      'The bottom line: the best Dukaan alternative is the one that gives your customers a real, trustworthy storefront with UPI + COD checkout and GST invoicing, without pricing you out before you have made your first sale. For most Indian sellers taking early orders, that means starting free, proving the model, and only paying once the store is genuinely growing.'
    ],
    faqs: [
      {
        question: 'Is there a genuinely free Dukaan alternative in India?',
        answer: 'Yes. LaunchGrid offers a free-forever tier — a live store with up to 3 products, UPI and Cash on Delivery checkout, and GST-ready invoices, with a small "Made with LaunchGrid" badge. You only pay if you upgrade for more products or advanced features, so you can launch and take your first orders without spending anything.'
      },
      {
        question: 'Can I move my products from Dukaan to a new platform?',
        answer: 'Your product photos, descriptions, prices, and customer list belong to you. Export them, recreate your catalog on the new platform (LaunchGrid lets you add products from your phone or import from a link), and repoint your WhatsApp and Instagram links. Keep the old store live for a few days so no in-flight orders are lost.'
      },
      {
        question: 'Which platform is best for Cash on Delivery (COD) in India?',
        answer: 'COD is essential for converting first-time Indian buyers. Choose a platform where COD is on by default or trivial to enable. On LaunchGrid, COD is enabled by default for new stores, so a brand-new store can accept its first COD order immediately, with the merchant confirming by phone.'
      }
    ]
  },
  'how-to-sell-on-whatsapp-india': {
    pillar: { href: '/sell-online', label: 'How to sell online in India: guides by product and city' },
    title: 'How to Sell on WhatsApp in India (2026): From DMs to a Real Store',
    category: 'Guides',
    date: 'June 13, 2026',
    readTime: '8 min read',
    content: [
      'WhatsApp is where Indian commerce actually happens. Customers ask "price kya hai?", you send photos one by one, you confirm the order in chat, and you chase the payment over UPI. It works — until it does not scale. If you are spending hours every day copy-pasting prices, re-sending the same product photos, and losing track of which order is paid, this guide is for you. Here is how to go from selling in WhatsApp DMs to running a real store that still uses WhatsApp, but stops the chaos.',
      'Stage 1 — Why pure-DM selling hits a ceiling:',
      'Selling entirely through WhatsApp chats breaks down in predictable ways: you cannot show a full catalog cleanly, every customer needs the same questions answered manually, there is no proper order record, payments are unverified until you check your UPI app, and you have no idea which products people actually look at most. None of this means you should leave WhatsApp — it means WhatsApp should be the conversation layer, not your entire shop.',
      'Stage 2 — Give customers one link instead of twelve photos:',
      'The single biggest upgrade is replacing "let me send you photos" with one storefront link. When a customer asks for options, you send your store link — they browse the full catalog, see clear prices, and check out themselves. With LaunchGrid you can have this live at yourname.launchgrid.in in about 15 minutes, then drop the link in your WhatsApp status, your bio, and every chat. The order conversation still happens on WhatsApp; the browsing and payment just stop eating your day.',
      'Stage 3 — Make payment effortless (and trustworthy):',
      'Indian buyers want UPI and Cash on Delivery. UPI gives instant prepaid orders; COD converts first-time buyers who do not yet trust you. A good store offers both at checkout, so the customer picks what they are comfortable with. COD especially is what gets you that crucial first order from a stranger — they pay when the product arrives, so there is no risk on their side.',
      'Stage 4 — Stop manually tracking orders:',
      'Once orders come through a store instead of scattered chats, every order has a record: customer name, items, amount, payment status, and shipping address in one place. You get a notification the moment an order is placed, mark it fulfilled with one tap, and send the customer a clean order confirmation — instead of scrolling fourteen chats at midnight trying to remember who paid.',
      'Stage 5 — Use WhatsApp for what it is great at:',
      'With the store handling catalog and checkout, WhatsApp becomes your growth and retention channel: post your store link to your status whenever you add stock, send order-shipped updates, and message past buyers when something they liked is back. This is where WhatsApp genuinely outperforms email in India — open rates are far higher and the relationship is personal.',
      'The honest summary: you do not have to choose between WhatsApp and a "proper website." The winning setup for Indian sellers in 2026 is both — a real storefront that takes the catalog, payment, and order admin off your plate, with WhatsApp as the human layer for conversation, status updates, and repeat sales. Start with a free store, move your next "send me photos" customer to your link, and take it from there.'
    ],
    faqs: [
      {
        question: 'Can I keep using my personal WhatsApp to sell?',
        answer: 'Yes. The goal is not to leave WhatsApp — it is to stop using it as your entire shop. You keep chatting with customers on WhatsApp, but send them a store link for browsing and checkout instead of photos and manual price quotes. Order alerts and shipping updates can still flow through WhatsApp.'
      },
      {
        question: 'How do I take payments when selling on WhatsApp?',
        answer: 'The cleanest way is a storefront with UPI and Cash on Delivery at checkout, so payment is verified and recorded automatically instead of you checking your UPI app. On LaunchGrid, UPI and COD are built in, and COD is enabled by default so you can take your first order immediately.'
      },
      {
        question: 'Do I need to pay to start selling on WhatsApp with a store?',
        answer: 'No. You can start on a free tier — LaunchGrid gives you a live store with up to 3 products, UPI and COD checkout, and GST-ready invoices for free, so you can move your WhatsApp orders to a real store and take your first sale without spending anything.'
      }
    ]
  },
  'how-to-start-online-store-india-2026': {
    pillar: { href: '/sell-online', label: 'How to sell online in India: guides by product and city' },
    title: 'How to Start an Online Store in India (2026 Guide)',
    category: 'Guides',
    date: 'June 14, 2026',
    readTime: '7 min read',
    content: [
      'Starting an online store in India has never been more accessible, yet the D2C landscape in 2026 demands strategic execution. Sourcing products, setting up checkouts, and configuring logistics require clear planning.',
      '<strong>Step 1: Choose Your Niche and Brand Name</strong><br/>Select a brand name that resonates with Indian buyers. Use our <a href="/tools/store-name-generator" class="text-black font-bold underline">Store Name Generator</a> to generate catchy names and instantly check domain name availability.',
      '<strong>Step 2: Source Products and Calculate Margins</strong><br/>Ensure your pricing factors in hidden costs. Sourcing costs, packaging fees, and logistics will eat into your earnings. Use the <a href="/tools/profit-margin-calculator" class="text-black font-bold underline">Profit Margin Calculator</a> to set profitable listing prices.',
      '<strong>Step 3: Setup Automated Logistics</strong><br/>Partner with aggregators like Shiprocket or Delhivery. Enable automatic COD validation via OTPs to reduce return-to-origin (RTO) charges.',
      '<strong>Step 4: Launch and Scale Ad Spend</strong><br/>Deploy Meta pixel conversion events on your storefront to feed the attribution algorithm. Once campaigns go live, track margins to ensure ad budgets generate a positive multiplier.'
    ],
    faqs: [
      {
        question: 'What is the most popular payment method for Indian buyers?',
        answer: 'UPI (Unified Payments Interface) commands over 70% of online retail transaction volume in India, followed closely by Cash on Delivery (COD) for first-time brand buyers.'
      },
      {
        question: 'How much budget do I need to start marketing?',
        answer: 'We recommend starting with a daily budget of ₹500 to ₹1,000 on Meta conversion campaigns to gather initial performance data.'
      }
    ]
  },
  'shopify-vs-woocommerce-vs-launchgrid': {
    title: 'Shopify vs WooCommerce vs LaunchGrid: Which is Best in 2026?',
    category: 'Comparisons',
    date: 'June 14, 2026',
    readTime: '9 min read',
    content: [
      'Choosing the right ecommerce software determines your store speed, operational costs, and checkout conversion rates. Let\'s evaluate how the leading options compare for Indian D2C brands.',
      '<strong>1. Shopify (The Global Heavyweight)</strong><br/>Shopify is highly reliable, but costs are billed in USD (starting at $25/mo) which introduces foreign exchange fees. Additionally, standard Indian requirements like native UPI, local COD filters, and GST compliance require installing multiple paid third-party apps.',
      '<strong>2. WooCommerce (The Open Source Option)</strong><br/>WooCommerce offers maximum customization, but requires manual hosting setup, security updates, and plugin management. Slow loading speeds can hurt checkouts if servers are poorly configured.',
      '<strong>3. LaunchGrid (The India-First Solution)</strong><br/>LaunchGrid is built specifically for Indian merchants. It features built-in CGST/SGST/IGST tax splits, 0% transaction fees, and native UPI + COD checkouts. Calculate your exact channel costs with our <a href="/tools/ecommerce-pricing-calculator" class="text-black font-bold underline">Ecommerce Pricing Calculator</a> to compare platforms.'
    ],
    faqs: [
      {
        question: 'Which platform is best for dropshipping in India?',
        answer: 'LaunchGrid offers a direct 500+ Indian dropship catalog integration with local suppliers, making it faster to deploy without monthly integration plugins.'
      },
      {
        question: 'Are there hidden transaction fees on LaunchGrid?',
        answer: 'No. LaunchGrid charges 0% transaction commission fees. You only pay for your payment gateway fees (Razorpay/Paytm) directly.'
      }
    ]
  },
  'complete-gst-guide-small-businesses': {
    title: 'The Complete GST Guide for Small Online Businesses in India',
    category: 'Compliance',
    date: 'June 14, 2026',
    readTime: '10 min read',
    content: [
      'Tax compliance is vital for scaling online businesses. Under current Indian regulations, online portals require a GSTIN. However, direct selling via subdomains offers flexible threshold limits.',
      '<strong>Understanding GST Threshold Limits</strong><br/>For standard sales within your home state, registration is required once cumulative sales cross ₹40 Lakhs for goods (₹20 Lakhs for services). For interstate trade, standard CGST rules apply.',
      '<strong>How to Calculate CGST, SGST, and IGST</strong><br/>Sales within your state split tax equally between Central (CGST) and State (SGST) allocations. Sales to other states require Integrated GST (IGST). Use our <a href="/tools/gst-calculator" class="text-black font-bold underline">GST Calculator India</a> to get instant calculations.',
      '<strong>Failing to file GSTR Returns</strong><br/>Once registered, you must file monthly or quarterly returns (GSTR-1 and GSTR-3B) even if you had zero transactions. Failing to file nil returns triggers daily penalties.'
    ],
    faqs: [
      {
        question: 'Do I need a GSTIN to start selling on LaunchGrid?',
        answer: 'No. LaunchGrid allows you to test your market and take early orders without a GSTIN. You should register for GST once your sales approach threshold limits.'
      },
      {
        question: 'How does LaunchGrid help with GST invoicing?',
        answer: 'LaunchGrid automatically generates compliant invoices, splits CGST/SGST/IGST based on client shipping addresses, and sends PDF copies to buyers.'
      }
    ]
  },
  'case-study-local-clothing-store-launchgrid': {
    title: 'Case Study: How Aanya Ethnic Wear Increased Orders 3x Using LaunchGrid',
    category: 'Case Studies',
    date: 'June 14, 2026',
    readTime: '6 min read',
    content: [
      'Aanya Ethnic Wear is a growing fashion label that originally sold products entirely through Instagram DMs and manual WhatsApp chats. In this case study, we look at how they automated their operations and tripled order volumes.',
      '<strong>The Challenge: Manual DM Bottlenecks</strong><br/>Sharing individual photo files, quoting prices, sharing UPI QR codes, and confirming payments manually took hours. High cart abandonment occurred when customers had to wait for replies.',
      '<strong>The Solution: Streamlined Checkout</strong><br/>They built a storefront on LaunchGrid, letting customers tap bio links to view the entire catalog and checkout immediately. They used our <a href="/tools/whatsapp-message-generator" class="text-black font-bold underline">WhatsApp Message Generator</a> to customize quick chat CTAs for campaigns.',
      '<strong>The Result: 3x Order Growth</strong><br/>Conversion rates climbed from 1.2% to 3.8%. Automatic WhatsApp reminders recovered 28% of abandoned checkouts. Check your own ad potential with our <a href="/tools/roas-calculator" class="text-black font-bold underline">Meta Ads ROAS Calculator</a>.'
    ],
    faqs: [
      {
        question: 'How did Aanya Ethnic Wear manage logistics?',
        answer: 'They connected Delhivery shipping APIs natively to their storefront, printing shipping labels with a single tap.'
      },
      {
        question: 'What was their cart recovery rate?',
        answer: 'Using LaunchGrid\'s automated WhatsApp recovery loops, they recovered 28% of checkouts that had entered shipping details but left before paying.'
      }
    ]
  },
  'mobile-accessories-business-margins-sourcing': {
    title: 'Mobile Accessories Business in India: Sourcing, Margins and Best Sellers',
    description: 'What phone cases, chargers and earbuds really earn after shipping and COD returns, where Indian sellers source them, and how to raise order value so small parcels stay profitable.',
    category: 'Guides',
    date: 'September 25, 2026',
    updated: '2026-09-25',
    readTime: '7 min read',
    pillar: { href: '/sell-online/mobile-accessories', label: 'Sell mobile accessories online: the complete guide' },
    content: [
      'A mobile accessories business looks simple: buy a phone case for ₹80, sell it for ₹299, keep the difference. The difference is real, but most of it goes on getting a small parcel to a buyer. This article looks at the numbers behind an accessories store and the few decisions that decide whether it makes money. For the full setup, including sourcing markets, GST and selling on WhatsApp, see our guide to <a href="/sell-online/mobile-accessories" class="text-black font-bold underline">selling mobile accessories online</a>.',
      '<strong>The problem with a ₹299 order</strong><br/>Shipping a 150 g parcel within India through a courier aggregator typically costs about ₹45–₹70, depending on the zone. Add ₹10–₹15 for a padded envelope or small box, around 2% for the payment gateway, and a share of the cost of COD parcels that get refused at the door. On a ₹299 case, those per-order costs can easily reach ₹90, about 30% of the price, before you pay for any ads.',
      '<strong>Lever 1: raise order value, not item margin</strong><br/>Shipping costs about the same whether the parcel holds one item or three. A "case + screen guard + cable" bundle at ₹649 costs barely more to ship than the case alone. Two simple rules help most accessory stores: a free-shipping minimum just above your average order (for example ₹499), and a "complete the set" suggestion at checkout.',
      '<strong>Lever 2: control Cash on Delivery on small orders</strong><br/>COD wins first-time buyers, but a refused ₹299 COD parcel costs you two-way shipping, often more than the order’s entire profit. Common approaches are COD only above a minimum order value, a small COD fee, or a ₹20–₹30 discount for paying by UPI. Confirming COD orders on WhatsApp before dispatch also cuts refusals noticeably.',
      '<strong>Lever 3: stock what moves, for the phones people own</strong><br/>Cases are model-specific, so inventory risk grows with every model you add. Start with chargers and cables (which fit any phone) and cases for the 10–20 models most common among your buyers, then expand based on what customers ask for. When a popular phone launches, cases for it sell at full price for the first few weeks while choice is limited.',
      '<strong>Where Indian sellers source accessories</strong><br/>Delhi’s Gaffar Market and Lajpat Rai Market and Mumbai’s Manish Market are the best-known wholesale hubs, and city-level mobile markets across India buy from them. Buy samples first, test chargers for real output, and stock only chargers and power banks with BIS registration. It’s mandatory, and uncertified chargers lead to returns and complaints.',
      '<strong>Run your own numbers</strong><br/>Put your real supplier price, courier rate and packaging cost into the <a href="/tools/profit-margin-calculator" class="text-black font-bold underline">profit margin calculator</a>, and check shipping by weight and zone with the <a href="/tools/shipping-cost-calculator" class="text-black font-bold underline">shipping cost calculator</a>. If net margin on a single-item order is below about 25%, fix it with bundles or a free-shipping minimum before spending on ads.'
    ],
    faqs: [
      {
        question: 'What is the profit margin on mobile accessories in India?',
        answer: 'Gross margins on cases, screen guards and cables are often 60–75%, because wholesale prices are low. After shipping, packaging, gateway fees and COD returns, a single-item order typically keeps 30–45%. Bundles and free-shipping minimums push that higher.'
      },
      {
        question: 'Which mobile accessories have the best margins?',
        answer: 'Back cases and screen guards usually have the highest percentage margins. Chargers and cables have lower margins but less inventory risk, because they fit many phones. Branded earbuds and smartwatches tend to have the thinnest margins.'
      },
      {
        question: 'Is it better to sell accessories on a marketplace or my own store?',
        answer: 'Marketplaces bring traffic but take commissions and fees that hurt low-priced items the most. Many sellers use a marketplace for discovery and their own store for repeat customers, bundles and WhatsApp orders, where they keep the full price.'
      }
    ]
  },
  'how-to-price-sarees-online': {
    title: 'How to Price Sarees Online: Margins, Shipping and Returns (With Examples)',
    description: 'A practical pricing method for saree sellers in India: from wholesale cost to a selling price that covers shipping, packaging, COD returns and GST, with worked examples at three price points.',
    category: 'Guides',
    date: 'September 25, 2026',
    updated: '2026-09-25',
    readTime: '7 min read',
    pillar: { href: '/sell-online/sarees', label: 'How to sell sarees online: the complete guide' },
    content: [
      'Most saree sellers price the way their wholesaler suggests: double the cost and round up. That works in a shop, where the customer walks out with the saree. Online, every order also has to pay for a courier, a box, a payment fee and the occasional return. This article shows how to build a price that covers all of it. For sourcing, photography and the festive calendar, read the full guide to <a href="/sell-online/sarees" class="text-black font-bold underline">selling sarees online</a>.',
      '<strong>Step 1: list every per-order cost</strong><br/>For a typical packed saree in the 500 g–1 kg slab: courier ₹60–₹110 depending on distance, packaging ₹20–₹40 (more for a rigid silk box), payment gateway around 2% of the price, and a returns buffer. If roughly 1 in 10 orders comes back, spread the two-way shipping on that one order across the other nine.',
      '<strong>Step 2: price from a target margin, not a multiplier</strong><br/>Add product cost and per-order costs, then divide by (1 − your target net margin). A ₹650 georgette saree with ₹210 of per-order costs is ₹860 all-in. For a 40% net margin: ₹860 ÷ 0.60 ≈ ₹1,433, so ₹1,449 or ₹1,499 is a sound price. Compare that with the "double it" price of ₹1,299, which leaves you about 34%.',
      '<strong>Step 3: treat silk differently</strong><br/>High-value sarees carry a bigger risk per order. A refused COD parcel on a ₹6,000 Banarasi costs two-way shipping and ties up stock for weeks. Many sellers take a UPI advance to confirm silk orders, or offer free shipping only on prepaid orders, and use a lower price multiple, because buyers of silk sarees compare prices carefully.',
      '<strong>Step 4: keep GST out of your margin</strong><br/>Sarees are generally taxed at 5% GST as woven fabric (confirm the HSN code with your supplier invoice or CA). If you’re registered, the GST you collect isn’t your revenue, so calculate margin on the pre-GST price. A <a href="/tools/gst-calculator" class="text-black font-bold underline">GST calculator</a> makes it easy to separate the tax from a GST-inclusive price.',
      '<strong>Step 5: check the result</strong><br/>Put your numbers into the <a href="/tools/profit-margin-calculator" class="text-black font-bold underline">profit margin calculator</a>. If a saree only works at a price your buyers won’t pay, change the product (a different fabric or supplier), not just the margin. Selling at a loss doesn’t become profitable at higher volume.'
    ],
    faqs: [
      {
        question: 'How much should I mark up sarees for online sale?',
        answer: 'Instead of a fixed markup, add your per-order costs (shipping, packaging, fees, returns buffer) to the product cost and divide by one minus your target margin. For mid-range sarees this usually lands at 1.8–2.5 times the wholesale cost.'
      },
      {
        question: 'Should I include shipping in the saree price or charge it separately?',
        answer: 'Many saree sellers include shipping in the price and advertise free shipping, because buyers compare the final price. If you do, build the courier cost into your pricing calculation, and consider a minimum order value for free shipping on low-priced sarees.'
      },
      {
        question: 'What GST rate applies to sarees?',
        answer: 'Sarees are generally taxed at 5% GST as woven fabric, but confirm the HSN code for silk, cotton and synthetic sarees with your supplier’s invoice or a CA.'
      }
    ]
  },
  'ship-home-decor-without-breakage': {
    title: 'How to Ship Fragile Home Decor Across India Without Breakage',
    description: 'Packaging, volumetric weight and pricing for Indian sellers shipping ceramics, pottery, glass and decor: the double-box method, packing videos, breakage buffers and courier choices.',
    category: 'Guides',
    date: 'September 25, 2026',
    updated: '2026-09-25',
    readTime: '6 min read',
    pillar: { href: '/sell-online/home-decor', label: 'Sell home decor online: the complete guide' },
    content: [
      'A broken vase costs you twice: the product, and a customer who won’t order again. Shipping fragile decor across India isn’t luck. It comes down to packaging, choosing the right courier, and pricing that expects some breakage. This article covers the practical side. For choosing products, photography and festive planning, see the guide to <a href="/sell-online/home-decor" class="text-black font-bold underline">selling home decor online</a>.',
      '<strong>The double-box method</strong><br/>Wrap the item in two or three layers of bubble wrap, with extra around handles, spouts and rims. Put it in a snug inner box so it can’t move. Place that box inside an outer carton with at least 5 cm of padding on every side (crumpled kraft paper, air pillows or foam). Shake the finished box gently. If you can hear or feel movement, add more padding.',
      '<strong>Record a packing video</strong><br/>Film every fragile order being packed and sealed, with the order number visible. It takes a minute, and it settles most disputes, both with a buyer claiming damage and with a courier when you file a claim.',
      '<strong>Watch volumetric weight</strong><br/>Couriers charge on the greater of actual weight and volumetric weight, usually length × width × height in cm ÷ 5000. Double-boxing adds volume, so a 1 kg vase can be billed as 3–4 kg. Use the smallest outer box that still leaves 5 cm of padding, and check the billed weight with the <a href="/tools/shipping-cost-calculator" class="text-black font-bold underline">shipping cost calculator</a> before you set your price.',
      '<strong>Price in a breakage buffer</strong><br/>Even good packaging has losses. If 1 in 30 ceramic orders arrives damaged, the replacement cost of that one order is spread across the other 29. Add it to the per-order cost when you work out your price in the <a href="/tools/profit-margin-calculator" class="text-black font-bold underline">profit margin calculator</a>.',
      '<strong>Courier and payment choices</strong><br/>Prefer surface or air services with fewer handovers for fragile goods, and check whether your aggregator offers damage cover for high-value pieces. For expensive ceramics and art, prepaid orders (or a UPI advance) avoid the double loss of a refused COD parcel that also gets damaged on its way back.'
    ],
    faqs: [
      {
        question: 'What is the best packaging for shipping ceramics in India?',
        answer: 'The double-box method: bubble-wrap the item, place it in a snug inner box, then pack that inside an outer carton with at least 5 cm of padding on every side. Test by shaking gently. Nothing should move.'
      },
      {
        question: 'How do I calculate volumetric weight for a parcel?',
        answer: 'Multiply the box length, width and height in centimetres and divide by 5000 (the divisor most Indian courier aggregators use). You are billed on whichever is higher: actual weight or volumetric weight.'
      },
      {
        question: 'Who pays if fragile decor breaks in transit?',
        answer: 'Usually the seller, unless you have courier damage cover and can prove the item was packed well. A packing video with the order number visible is the most useful evidence for a claim.'
      }
    ]
  }
}

export const BLOG_SLUGS = Object.keys(blogPosts)

export function postDescription(post: BlogPostData): string {
  return post.description ?? post.content[0].replace(/<[^>]*>/g, '')
}

/** ISO date of the most recent substantive change, for sitemap and schema. */
export function postModifiedISO(post: BlogPostData): string {
  return post.updated ?? new Date(post.date).toISOString().slice(0, 10)
}

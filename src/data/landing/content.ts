export const painCards = [
  { id: '01', title: 'What platform do I even use?', description: 'Shopify? WooCommerce? Custom? The research rabbit hole begins.' },
  { id: '02', title: 'How do I collect payments?', description: 'UPI? Razorpay? Stripe? Bank transfer? Nothing is obvious.' },
  { id: '03', title: '50 products. How do I upload all of this?', description: 'Spreadsheets. CSV files. Manual entry. Days lost.' },
  { id: '04', title: 'What is GST? Do I need it?', description: '₹40 lakh threshold. Intra-state rules. Penalties. Panic.' },
  { id: '05', title: 'Why is nobody buying?', description: 'Traffic is zero. Marketing is overwhelming. Confidence drops.' }
];

export const founderStories = [
  {
    id: 1,
    name: 'Rohit M.',
    location: 'Mumbai, Maharashtra',
    started: 'April 3',
    timeline: [
      { date: 'April 3', event: 'Reserved my subdomain in 10 minutes.' },
      { date: 'April 4', event: 'Store live. 50 products imported.' },
      { date: 'April 8', event: 'First Instagram story shared.' },
      { date: 'April 10', event: 'FIRST SALE. ₹1,299. 🎉', highlight: true },
      { date: 'April 30', event: 'Total Revenue: ₹24,000' }
    ],
    quote: "I spent 2 years thinking about it. LaunchGrid made me stop thinking and start selling.",
    large: true
  },
  {
    id: 2,
    name: 'Priya S.',
    location: 'Pune',
    niche: 'Jewellery & Accessories',
    firstSale: 'Day 8',
    month1: '₹18,500',
    quote: "I thought I needed ₹50,000 to start. I needed ₹4,999."
  },
  {
    id: 3,
    name: 'Arjun K.',
    location: 'Bengaluru',
    niche: 'Home Decor',
    firstSale: 'Day 6',
    month1: '₹31,200',
    quote: "The dashboard makes me feel like a real CEO."
  }
];

export const methodSteps = [
  { id: '01', mission: 'Reserve Your Subdomain', pain: "I don't have a website.", solution: "You pick your store name. We provision it in 15 seconds.", outcome: "Your store URL is live." },
  { id: '02', mission: 'Build Your Brand', pain: "I need a logo and colors.", solution: "AI generates your brand identity on signup.", outcome: "You look professional from day one." },
  { id: '03', mission: 'Import Your Catalog', pain: "How do I upload 50 products?", solution: "One-click dropship catalog import.", outcome: "Your store is stocked instantly." },
  { id: '04', mission: 'Accept Payments', pain: "I don't know how to collect money.", solution: "We wire Razorpay to your store.", outcome: "You're ready to get paid." },
  { id: '05', mission: 'Launch Your Store', pain: "Will anyone even find it?", solution: "Your store is indexable, shareable, live.", outcome: "Real URL. Real customers possible." },
  { id: '06', mission: 'Drive Your First Traffic', pain: "I don't know marketing.", solution: "We give you a launch playbook.", outcome: "Your first visitor arrives." },
  { id: '07', mission: 'Get Your First Order', pain: "What if nobody buys?", solution: "Pre-built conversion optimization.", outcome: "Your phone buzzes with a sale notification." },
  { id: '08', mission: 'Fulfill the Order', pain: "I've never shipped anything.", solution: "Step-by-step fulfillment guide.", outcome: "Order dispatched. Customer happy." },
  { id: '09', mission: 'Track Your Revenue', pain: "Where does the money go?", solution: "Real-time dashboard shows every rupee.", outcome: "You watch your revenue grow." },
  { id: '10', mission: 'Handle GST', pain: "What is GST compliance?", solution: "We monitor thresholds. Alert you when to act.", outcome: "No penalties. No surprises." },
  { id: '11', mission: 'Scale With Ads', pain: "How do I get more orders?", solution: "Meta and Google campaign templates.", outcome: "Profitable growth begins." },
  { id: '12', mission: 'Earn Your First Month', pain: "Can I really make ₹30,000?", solution: "100 orders × ₹300 = ₹30,000 gross.", outcome: "You are a business owner." },
];

export const pricingMissions = [
  {
    id: '01',
    name: 'Get Online',
    tagline: 'Your store. Your brand. Live in 15 minutes.',
    price: '₹1,999 / month',
    features: [
      'AI-generated store',
      'Dropship catalog (50 items)',
      'Razorpay payments',
      'Mobile storefront',
      'Basic analytics'
    ],
    cta: 'Launch My Business →',
    popular: false
  },
  {
    id: '02',
    name: 'Get Customers',
    tagline: 'Traffic. Ads. Conversions. Everything you need for your first ₹30K.',
    price: '₹9,999 / month',
    features: [
      'Meta Ads campaign templates',
      'Google Shopping setup',
      'WhatsApp order notifications',
      'Advanced analytics',
      'AI business coach'
    ],
    cta: 'Start Growing →',
    popular: true
  },
  {
    id: '03',
    name: 'Scale Revenue',
    tagline: "For founders who've tasted success and want more.",
    price: '₹24,999 / month',
    features: [
      'GST compliance automation',
      'Multi-product catalog (500 items)',
      'Priority support',
      'Custom domain',
      'Revenue scaling playbook'
    ],
    cta: 'Scale Now →',
    popular: false
  }
];

// Copy shared by the page (client) and its layout (metadata + FAQ schema), so
// the FAQ structured data can never describe questions the page doesn't show.

export const PROFIT_MARGIN_FAQS: { q: string; a: string }[] = [
  {
    q: 'How do I calculate profit margin on a product?',
    a: 'Subtract the product cost from the selling price, divide by the selling price and multiply by 100. A product that costs ₹400 and sells for ₹1,000 has a gross profit of ₹600 and a gross margin of 60%. For net margin, also subtract per-order costs such as packaging, shipping, payment gateway fees and ad spend before dividing.',
  },
  {
    q: 'What is the difference between margin and markup?',
    a: 'Margin is profit as a share of the selling price; markup is profit as a share of the cost. Buying at ₹500 and selling at ₹1,000 is a 50% margin but a 100% markup. Pricing with a "50% markup" when you meant a 50% margin leaves you with only a 33% margin.',
  },
  {
    q: 'Should I calculate margin on the price with GST or without GST?',
    a: 'Without GST. If you are GST-registered, the GST you collect belongs to the government, so your real revenue is the price excluding tax. A ₹1,180 price that includes 18% GST is ₹1,000 of revenue for you. Calculate margin on that ₹1,000, not the ₹1,180 the customer pays.',
  },
  {
    q: 'How do I find the selling price for a target margin?',
    a: 'Divide your total cost by (1 − target margin). For a ₹600 all-in cost and a 40% target margin: ₹600 ÷ 0.60 = ₹1,000. Note that adding 40% to cost (₹840) gives only a 28.6% margin — a common pricing mistake.',
  },
  {
    q: 'What is a good profit margin for an online store in India?',
    a: 'It depends on the category and how you get customers. Small, light items like phone cases and jewellery often run gross margins of 60% or more, because they need that room to pay for ads, COD returns and shipping. Heavier or branded goods run thinner. What matters is net margin after every per-order cost: if it is below roughly 15%, a small rise in ad costs or returns can wipe out your profit.',
  },
  {
    q: 'How do Cash on Delivery returns (RTO) affect my margin?',
    a: 'Every COD order that is refused at the door costs you forward shipping plus return shipping, with no revenue. Spread that cost across the orders that do succeed. For example, if 1 in 5 COD orders returns and each failed delivery costs ₹120 in freight, add about ₹30 to the cost of every successful COD order.',
  },
];

/** Illustrative unit economics used as worked examples. Not market data. */
export const PROFIT_MARGIN_EXAMPLES: {
  label: string;
  href: string;
  anchor: string;
  cost: number;
  price: number;
  expenses: number;
  expenseNote: string;
}[] = [
  {
    label: 'Phone case (bought wholesale)',
    href: '/sell-online/mobile-accessories',
    anchor: 'Guide: sell mobile accessories online',
    cost: 85,
    price: 299,
    expenses: 95,
    expenseNote: '₹55 shipping, ₹15 packaging, ₹6 gateway, ₹19 returns buffer',
  },
  {
    label: 'Cotton saree (Surat wholesale)',
    href: '/sell-online/sarees',
    anchor: 'Guide: sell sarees online',
    cost: 650,
    price: 1499,
    expenses: 210,
    expenseNote: '₹80 shipping, ₹35 box and tissue, ₹30 gateway, ₹65 returns buffer',
  },
  {
    label: 'Ceramic table vase',
    href: '/sell-online/home-decor',
    anchor: 'Guide: sell home decor online',
    cost: 380,
    price: 1199,
    expenses: 260,
    expenseNote: '₹110 shipping (volumetric), ₹70 bubble wrap and double box, ₹24 gateway, ₹56 breakage buffer',
  },
];

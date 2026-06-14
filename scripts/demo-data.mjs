// Shared definition of the LaunchGrid demo store.
// Used by seed-demo.mjs (insert) and teardown-demo.mjs (remove).
// Fixed UUIDs make the seed idempotent and the teardown surgical — nothing
// here touches any tenant other than DEMO.TENANT_ID.

export const DEMO = {
  TENANT_ID: 'd3500000-0000-4000-8000-000000000001',
  EMAIL: process.env.DEMO_EMAIL || process.argv[2] || 'demo@launchgrid.in',
  PASSWORD: process.env.DEMO_PASSWORD || process.argv[3] || 'DemoStore@2026',
  FULL_NAME: 'Aanya Sharma',
  PHONE: '+919876543210',
  BUSINESS_NAME: 'Aanya Ethnic Wear',
  SUBDOMAIN: 'aanya-ethnicwear',
  NICHE: 'Ethnic fashion & handcrafted accessories',
};

const IMG = (id) => [`https://images.unsplash.com/photo-${id}?w=600&q=80`];

// 8 products — believable Indian D2C catalogue. One out-of-stock, one hidden.
export const PRODUCTS = [
  { n: 1, title: 'Hand-Block Cotton Kurta Set',        price: 1499, compare: 2199, stock: 24, active: true,  img: IMG('1594633312681-425c7b97ccd1'),
    desc: 'Breezy hand-block printed cotton kurta with matching palazzo. Sizes S–XXL.' },
  { n: 2, title: 'Banarasi Silk Saree — Royal Blue',   price: 3499, compare: 4999, stock: 8,  active: true,  img: IMG('1610030469983-98e550d6193c'),
    desc: 'Pure Banarasi silk with golden zari border. Comes with unstitched blouse piece.' },
  { n: 3, title: 'Kundan Bridal Necklace Set',         price: 2299, compare: 3499, stock: 12, active: true,  img: IMG('1611591437281-460bfbe1220a'),
    desc: 'Gold-plated Kundan necklace with matching earrings and maang tikka.' },
  { n: 4, title: 'Handcrafted Jute Tote Bag',          price: 899,  compare: 1299, stock: 40, active: true,  img: IMG('1590874103328-eac38a683ce7'),
    desc: 'Roomy eco-friendly jute tote with cotton lining and zip pocket.' },
  { n: 5, title: 'Oxidised Silver Jhumka Earrings',    price: 499,  compare: 799,  stock: 60, active: true,  img: IMG('1535632066927-ab7c9ab60908'),
    desc: 'Lightweight oxidised silver jhumkas with pearl drops. Nickel-free.' },
  { n: 6, title: 'Meenakari Glass Bangles (Set of 6)', price: 349,  compare: 599,  stock: 0,  active: true,  img: IMG('1612722432474-b971cdcea546'),
    desc: 'Hand-painted Meenakari glass bangles. Set of 6 in assorted colours.' },
  { n: 7, title: 'Chanderi Cotton Dupatta',           price: 699,  compare: 999,  stock: 18, active: true,  img: IMG('1603561591411-07134e71a2a9'),
    desc: 'Soft Chanderi cotton-silk dupatta with delicate gota border.' },
  { n: 8, title: 'Soy Wax Scented Candle — Oudh',      price: 399,  compare: 549,  stock: 30, active: false, img: IMG('1602173574767-37ac01994b2a'),
    desc: 'Hand-poured soy wax candle, oudh & amber. 40-hour burn time.' },
];

// Distinct, realistic-looking UUIDs (fixed for idempotency/teardown). Order ids
// must differ in their first 8 chars — the app shows shortId = first 8 chars,
// so a shared prefix made every order read as the same "#D3500000".
const PRODUCT_IDS = [
  'a3f1c8d2-5b6e-4f29-9c14-7d2e1a4b8c30',
  '6e9b2f47-8c1d-4a3e-b572-0f9a6c3d1e84',
  'c2d84a19-3f7b-4e6c-8a91-2b5d7e0f3c61',
  '9f4e1b73-2a8d-4c5f-9e08-6d3a1c7b4f29',
  '4b7c0e95-1d6a-4f82-b3c7-8e2f5a9d0c14',
  'e1a6d2f8-7c93-4b50-8d2a-3f6b9c4e1a07',
  '83c5f0a4-6e1b-4d97-a2f5-1c8d3b6e9f40',
  '2d9e4c81-5a7f-4e6b-9c30-7b1f8a2d5c63',
];
const ORDER_IDS = [
  '7f3a9c21-4e8b-4c1a-9d2f-1a2b3c4d5e6f',
  'b2e64d80-9a3f-4b7c-8e15-2c3d4e5f6a7b',
  '4c8d1e92-7b6a-4f3d-a9c8-3d4e5f6a7b8c',
  '9a1f5c34-2d8e-4a6b-bc71-4e5f6a7b8c9d',
  'e6b3072a-1c9d-4e8f-93a2-5f6a7b8c9d0e',
  '3d9e8f17-6a4b-4c2d-8f53-6a7b8c9d0e1f',
  'c1a7b4e0-8f2d-4d9a-a164-7b8c9d0e1f2a',
  '58f2d6c9-3e1a-4b7f-9c85-8c9d0e1f2a3b',
];
export const productId = (n) => PRODUCT_IDS[n - 1];
export const orderId = (n) => ORDER_IDS[n - 1];

const addr = (line1, city, state, pincode) => ({ line1, city, state, pincode });

// Orders: hoursAgo<24 => counts toward "today". 3 unfulfilled (Home to-do list),
// plus shipped/delivered history. Totals are computed from items, not hardcoded.
export const ORDERS = [
  { n: 1, name: 'Priya Sharma',  phone: '+919812345670', email: 'priya@example.com',  pay: 'paid',    fulfill: 'unfulfilled', method: 'upi', hoursAgo: 1,
    items: [{ p: 1, q: 1 }], ship: addr('14 Rose Villa, Bandra West', 'Mumbai', 'Maharashtra', '400050') },
  { n: 2, name: 'Rohan Mehta',   phone: '+919812345671', email: 'rohan@example.com',  pay: 'paid',    fulfill: 'unfulfilled', method: 'upi', hoursAgo: 2,
    items: [{ p: 2, q: 1 }, { p: 5, q: 1 }], ship: addr('Flat 7B, Green Acres', 'Pune', 'Maharashtra', '411001') },
  { n: 3, name: 'Ananya Iyer',   phone: '+919812345672', email: 'ananya@example.com', pay: 'pending', fulfill: 'unfulfilled', method: 'cod', hoursAgo: 4,
    items: [{ p: 4, q: 1 }, { p: 7, q: 1 }], ship: addr('22 Lake View Rd', 'Bengaluru', 'Karnataka', '560034') },
  { n: 4, name: 'Kavya Reddy',   phone: '+919812345673', email: 'kavya@example.com',  pay: 'paid',    fulfill: 'shipped',     method: 'upi', hoursAgo: 6,
    items: [{ p: 3, q: 1 }], ship: addr('Plot 9, Jubilee Hills', 'Hyderabad', 'Telangana', '500033') },
  { n: 5, name: 'Sneha Patil',   phone: '+919812345674', email: 'sneha@example.com',  pay: 'paid',    fulfill: 'delivered',   method: 'upi', hoursAgo: 26,
    items: [{ p: 7, q: 1 }], ship: addr('5 Shivaji Nagar', 'Nashik', 'Maharashtra', '422001') },
  { n: 6, name: 'Aisha Khan',    phone: '+919812345675', email: 'aisha@example.com',  pay: 'paid',    fulfill: 'delivered',   method: 'cod', hoursAgo: 74,
    items: [{ p: 5, q: 2 }], ship: addr('88 MG Road', 'Jaipur', 'Rajasthan', '302001') },
  { n: 7, name: 'Neha Gupta',    phone: '+919812345676', email: 'neha@example.com',   pay: 'paid',    fulfill: 'shipped',     method: 'upi', hoursAgo: 146,
    items: [{ p: 4, q: 1 }], ship: addr('3 Park Street', 'Kolkata', 'West Bengal', '700016') },
  { n: 8, name: 'Divya Nair',    phone: '+919812345677', email: 'divya@example.com',  pay: 'paid',    fulfill: 'delivered',   method: 'upi', hoursAgo: 266,
    items: [{ p: 8, q: 1 }], ship: addr('12 Marine Drive', 'Kochi', 'Kerala', '682011') },
];

export const VISITORS_TODAY = 47;

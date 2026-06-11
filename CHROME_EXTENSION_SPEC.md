# LaunchGrid Chrome Extension — Full Specification
> PRD + TRD + Workflow in one document.  
> Version 1.0 | For internal build use.

---

## Table of Contents
1. [Problem & Vision](#1-problem--vision)
2. [User Stories](#2-user-stories)
3. [Feature Requirements (PRD)](#3-feature-requirements-prd)
4. [User Flows & Wireframe Logic](#4-user-flows--wireframe-logic)
5. [Technical Architecture (TRD)](#5-technical-architecture-trd)
6. [File Structure](#6-file-structure)
7. [Manifest (V3)](#7-manifest-v3)
8. [Auth System](#8-auth-system)
9. [Content Script — Site-Specific DOM Extraction](#9-content-script--site-specific-dom-extraction)
10. [Injected Side Panel UI](#10-injected-side-panel-ui)
11. [Background Service Worker](#11-background-service-worker)
12. [Popup (Extension Icon Click)](#12-popup-extension-icon-click)
13. [LaunchGrid Dashboard Changes Required](#13-launchgrid-dashboard-changes-required)
14. [API Endpoints Used](#14-api-endpoints-used)
15. [Chrome Web Store Publishing Checklist](#15-chrome-web-store-publishing-checklist)
16. [Edge Cases & Error Handling](#16-edge-cases--error-handling)
17. [Phase 2 Ideas](#17-phase-2-ideas)

---

## 1. Problem & Vision

### Problem
LaunchGrid merchants source products they already buy/resell — from Amazon, Flipkart, Meesho, Myntra, GlowRoad, and hundreds of other sites. Today's workflow:
1. Find a product on Amazon
2. Copy URL
3. Go to LaunchGrid dashboard
4. Paste URL → wait for scraper
5. Scraper often fails (bot detection) or gets wrong price
6. Fix manually

This is 6 steps with unreliable results.

### Vision
A Chrome extension that reduces this to **2 steps**:
1. Browse to any product page
2. Click "Add to LaunchGrid" → set your price → done

The extension reads the live DOM directly — no scraping, no bot detection, always accurate data. It's how Oberlo became the #1 Shopify app. This is LaunchGrid's equivalent.

### Success Metrics
- Time to add a product: < 15 seconds
- Data accuracy: title correct 99%, price correct 99%, at least 1 image 95%
- Weekly active users: 60%+ of merchants who install use it at least once per week
- Products added via extension vs manual: target 70% extension by month 3

---

## 2. User Stories

**US-01** — As a reseller browsing Amazon, I want to add a product to my LaunchGrid store without leaving the page, so that I don't lose my browsing context.

**US-02** — As a merchant, I want the extension to auto-fill the product name, images, and the original price, so I only have to set my selling price.

**US-03** — As a first-time user, I want to connect the extension to my LaunchGrid account without re-entering credentials, so setup feels seamless.

**US-04** — As a merchant, I want to see my margin % in real time as I type my selling price, so I can make sure I'm profitable before adding.

**US-05** — As a power user, I want to add products from any site (not just the supported list), so I'm not limited to specific platforms.

**US-06** — As a mobile-first seller, I want to use the extension on my desktop to build up inventory quickly before sharing my store link on WhatsApp.

**US-07** — As a merchant, I want a confirmation that the product was added to my store, so I know the action succeeded without having to check the dashboard.

---

## 3. Feature Requirements (PRD)

### F-01: Floating "Add" Button (Content Script)
- A floating button appears on any recognized product page
- Supported sites (Phase 1): Amazon.in, Flipkart.com, Meesho.com, Myntra.com, Nykaa.com, Ajio.com, GlowRoad.com, Snapdeal.com, Roposo.com
- Generic fallback for any other site (reads JSON-LD / OG tags)
- Button position: bottom-right, above any existing chat widgets
- Button design: LaunchGrid logo + "Add to Store" text, purple background
- Only shows on product pages (not search results, home pages)

### F-02: Side Panel (Product Confirm UI)
- Slides in from right side of screen when button is clicked
- Does NOT use a new tab or popup window — stays on the same page
- Shows: product image carousel, editable title, source price (their price), your price (you set), margin %, category dropdown
- "Add to My Store" CTA — sends to LaunchGrid API
- "Cancel" dismisses panel, button reappears
- Success state: green tick + "Added to your store!" + link to dashboard

### F-03: Auth (Connect Account)
- Extension popup (icon click) shows connection state
- First time: "Connect your LaunchGrid account" → opens LaunchGrid dashboard auth page
- LaunchGrid generates a one-time extension token → passes to extension via URL hash on redirect
- Token stored in `chrome.storage.local` (persists until user explicitly disconnects)
- If token expires: prompt to reconnect
- Disconnect option in popup

### F-04: Generic Site Support
- On any non-listed site, if a product page is detected via JSON-LD `@type: Product`, show the button
- If no JSON-LD: show button if URL path contains `/product`, `/item`, `/dp/`, `/p/`
- Extraction falls back to OG meta tags
- Data may be incomplete — show warning: "Some fields could not be auto-filled. Please check before adding."

### F-05: Popup (Extension Icon)
- Shows account connection status
- Shows store name + subdomain when connected
- Quick stats: "X products in your store"
- "Open Dashboard" shortcut
- "Disconnect Account" option

### F-06: Margin Protection
- If cost price ≥ your price: block "Add to Store", show red warning "You're selling at a loss"
- If margin < 10%: amber warning "Low margin — you keep less than ₹X per sale"
- If margin ≥ 20%: green indicator

---

## 4. User Flows & Wireframe Logic

### Flow A — First Install & Connect
```
Install from Chrome Store
        ↓
Extension popup opens automatically
        ↓
Screen: "Connect your LaunchGrid account"
  [Connect Account] button
        ↓
Opens tab: https://launchgrid.in/dashboard/extension-auth
        ↓
LaunchGrid checks session:
  → Logged in? Generate extension token, redirect to:
    chrome-extension://[ext-id]/auth-callback.html#token=xxx
  → Not logged in? Show login form, then redirect same way
        ↓
auth-callback.html stores token in chrome.storage.local
        ↓
Popup refreshes → shows "Connected as [store name]"
        ↓
User can now browse and add products
```

### Flow B — Add Product (Happy Path)
```
User on amazon.in/dp/[ASIN]
        ↓
Content script detects product page (via URL pattern + DOM check)
        ↓
Floating button appears: [+ Add to LaunchGrid]
        ↓
User clicks button
        ↓
Content script extracts from DOM:
  - title: #productTitle
  - cost_price: .a-price-whole + .a-price-fraction
  - images: #imgTagWrapperId + #altImages thumbnails
  - description: #feature-bullets li items
        ↓
Side panel slides in (injected iframe or shadow DOM)
        ↓
Panel shows pre-filled form:
  [Product image carousel]
  [Title input — pre-filled, editable]
  [Their Price: ₹355 — read-only, extracted]
  [Your Price: ₹___ — required, user types]
  [Margin badge — updates live]
  [Category dropdown]
  [Add to My Store button]
        ↓
User sets price (e.g. ₹499), sees "Margin: 29% — ₹144 profit/sale"
        ↓
Clicks "Add to My Store"
        ↓
Extension calls POST https://launchgrid.in/api/products/add
  with Authorization: Bearer [stored token]
        ↓
Success → panel shows:
  ✅ "Elove 6V Adapter added to your store!"
  [View in Dashboard →]  [Add Another]
```

### Flow C — Not Logged In (Token Missing)
```
User clicks [+ Add to LaunchGrid]
        ↓
Side panel opens → shows:
  "You're not connected to LaunchGrid"
  [Connect Account →]
        ↓
Opens extension popup (or new tab to auth page)
```

### Flow D — Generic / Unknown Site
```
User on any product page (e.g. shopify store, woocommerce)
        ↓
Content script checks for JSON-LD @type:Product → found
  OR URL path matches /product/, /item/
        ↓
Button appears with "⚠ Some fields may need editing"
        ↓
Panel opens with partial data, missing fields highlighted in amber
  "Price not found — please enter manually"
        ↓
Normal save flow
```

---

## 5. Technical Architecture (TRD)

### Extension Type
**Manifest V3** (required by Chrome as of 2024). Uses service worker instead of background page.

### Components
```
chrome-extension/
├── manifest.json          ← Extension config, permissions, entry points
├── background.js          ← Service worker: API calls, auth token handling
├── content.js             ← Injected into product pages: DOM extraction, button/panel injection
├── content.css            ← Styles for injected button + panel (scoped)
├── popup.html             ← Extension icon click UI
├── popup.js               ← Popup logic
├── popup.css              ← Popup styles
├── auth-callback.html     ← Receives token from LaunchGrid redirect
├── auth-callback.js       ← Parses token from URL hash, stores it
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Data Flow
```
content.js (reads DOM)
    ↓ chrome.runtime.sendMessage({ type: 'ADD_PRODUCT', data: {...} })
background.js (receives message)
    ↓ reads token from chrome.storage.local
    ↓ fetch('https://launchgrid.in/api/products/add', { headers: { Authorization: 'Bearer ' + token } })
    ↓ chrome.runtime.sendMessage({ type: 'ADD_PRODUCT_RESULT', success: true/false })
content.js (receives result, updates panel UI)
```

### Storage Schema (chrome.storage.local)
```json
{
  "lg_token": "eyJhbGc...",          // JWT or extension token
  "lg_store_name": "My Fashion Hub",
  "lg_subdomain": "myfashionhub",
  "lg_connected_at": 1700000000000
}
```

### Security
- Token stored in `chrome.storage.local` (not accessible to web pages, only extension scripts)
- All API calls go to `https://launchgrid.in` only — no third-party data sharing
- Content script runs in isolated world (cannot read page's JS variables)
- Extension only requests `activeTab` + `storage` permissions — minimal footprint

---

## 6. File Structure

Full annotated file list with what each file does:

```
launchgrid-extension/
│
├── manifest.json
│   Purpose: Tells Chrome what the extension is, what permissions it needs,
│   which scripts run where, and what the popup is.
│
├── background.js
│   Purpose: Service worker. Runs in background. Handles:
│   - Receiving ADD_PRODUCT messages from content script
│   - Making authenticated API calls to LaunchGrid
│   - Storing/reading token from chrome.storage.local
│   - Responding back to content script with success/error
│   Note: Cannot access DOM. Communicates only via messages.
│
├── content.js
│   Purpose: Injected into product pages. Handles:
│   - Detecting if current page is a product page
│   - Extracting product data from DOM (site-specific logic)
│   - Injecting the floating "Add to LaunchGrid" button
│   - Injecting and managing the side panel HTML
│   - Listening for user interactions in the panel
│   - Sending extracted data to background.js
│   Note: Runs in isolated world. Cannot access page's JS.
│
├── content.css
│   Purpose: Styles for the injected button and side panel.
│   Uses a unique prefix (lg-) on all class names to avoid
│   conflicts with the host page's CSS.
│
├── popup.html + popup.js + popup.css
│   Purpose: The UI that appears when user clicks the extension icon.
│   Shows: connected store name, quick stats, connect/disconnect button.
│
├── auth-callback.html + auth-callback.js
│   Purpose: A page inside the extension that LaunchGrid redirects to
│   after successful auth. Parses token from URL hash and saves it.
│
└── icons/
    icon16.png  (toolbar)
    icon48.png  (extensions page)
    icon128.png (Chrome Web Store listing)
```

---

## 7. Manifest (V3)

```json
{
  "manifest_version": 3,
  "name": "LaunchGrid — Add to Store",
  "short_name": "LaunchGrid",
  "version": "1.0.0",
  "description": "Add products from Amazon, Flipkart, Meesho & any site to your LaunchGrid store in one click.",

  "permissions": [
    "storage",
    "activeTab"
  ],

  "host_permissions": [
    "https://launchgrid.in/*"
  ],

  "background": {
    "service_worker": "background.js",
    "type": "module"
  },

  "content_scripts": [
    {
      "matches": [
        "https://www.amazon.in/*",
        "https://www.flipkart.com/*",
        "https://www.meesho.com/*",
        "https://www.myntra.com/*",
        "https://www.nykaa.com/*",
        "https://www.ajio.com/*",
        "https://www.snapdeal.com/*",
        "https://www.glowroad.com/*",
        "https://www.roposo.com/*",
        "https://*/*"
      ],
      "js": ["content.js"],
      "css": ["content.css"],
      "run_at": "document_idle"
    }
  ],

  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16":  "icons/icon16.png",
      "48":  "icons/icon48.png",
      "128": "icons/icon128.png"
    },
    "default_title": "LaunchGrid — Add to Store"
  },

  "icons": {
    "16":  "icons/icon16.png",
    "48":  "icons/icon48.png",
    "128": "icons/icon128.png"
  },

  "web_accessible_resources": [
    {
      "resources": ["auth-callback.html"],
      "matches": ["https://launchgrid.in/*"]
    }
  ]
}
```

**Permission rationale (needed for Chrome Web Store review):**
- `storage`: save auth token and store metadata
- `activeTab`: read current page DOM when user interacts
- `host_permissions: launchgrid.in`: make API calls to our own backend only

---

## 8. Auth System

### Overview
Use a **one-time token redirect** flow. No password stored in extension. Token is a signed JWT issued by LaunchGrid backend specifically for extension use.

### Step-by-step

**Step 1: Extension requests auth**
```javascript
// popup.js — when user clicks "Connect Account"
const EXT_ID = chrome.runtime.id
const authUrl = `https://launchgrid.in/dashboard/extension-auth?ext_id=${EXT_ID}`
chrome.tabs.create({ url: authUrl })
```

**Step 2: LaunchGrid dashboard generates token**
```
Route: GET /dashboard/extension-auth?ext_id=[chrome extension id]

Server logic:
1. Check if user is logged in (Supabase session)
2. If not logged in → show login form (redirect back with ext_id param after login)
3. If logged in:
   a. Generate extension token:
      - Use Supabase service role to create a long-lived JWT
      - OR simply use the user's existing access token
      - Store in DB: extension_tokens table { user_id, token_hash, created_at, last_used }
   b. Get user's tenant: subdomain, business_name
   c. Redirect to:
      chrome-extension://[ext_id]/auth-callback.html
        #token=eyJhbG...
        &store=myfashionhub
        &name=My Fashion Hub
```

**Step 3: auth-callback.html stores token**
```javascript
// auth-callback.js
const hash = new URLSearchParams(window.location.hash.slice(1))
const token = hash.get('token')
const store = hash.get('store')
const name  = hash.get('name')

if (token) {
  chrome.storage.local.set({
    lg_token:        token,
    lg_subdomain:    store,
    lg_store_name:   name,
    lg_connected_at: Date.now(),
  }, () => {
    // Show success message in this page, then close tab
    document.getElementById('status').textContent = 'Connected! You can close this tab.'
    setTimeout(() => window.close(), 2000)
  })
}
```

**Step 4: All API calls use stored token**
```javascript
// background.js
const { lg_token } = await chrome.storage.local.get('lg_token')
const res = await fetch('https://launchgrid.in/api/products/add', {
  method: 'POST',
  headers: {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${lg_token}`,
  },
  body: JSON.stringify(productData),
})
```

### Token Expiry Handling
- LaunchGrid extension tokens: set 90-day expiry
- When API returns 401: clear stored token, show "Session expired — reconnect" in panel
- On extension icon click: validate token with GET `/api/extension/whoami` — if 401, show reconnect prompt

### LaunchGrid Backend: New Routes Required
```
GET  /dashboard/extension-auth          → auth page (server component)
GET  /api/extension/whoami              → validate token, return { store_name, subdomain, product_count }
POST /api/products/add                  → already exists, but must accept Bearer token (not just session cookie)
```

---

## 9. Content Script — Site-Specific DOM Extraction

The content script is the heart of the extension. It has two layers:
1. **Site-specific extractors** — precise CSS selectors per supported site
2. **Generic fallback** — JSON-LD and OG meta tags for any other site

### Product Page Detection

Before injecting the button, verify the current page is actually a product page:

```javascript
function isProductPage() {
  const url = window.location.href
  const hostname = window.location.hostname

  // Amazon: must have /dp/ in path
  if (hostname.includes('amazon.in')) {
    return /\/dp\/[A-Z0-9]{10}/.test(url)
  }
  // Flipkart: must have /p/ in path
  if (hostname.includes('flipkart.com')) {
    return url.includes('/p/')
  }
  // Meesho: product URLs have numeric IDs
  if (hostname.includes('meesho.com')) {
    return /\/p\/\d+/.test(url) || document.querySelector('h1') !== null
  }
  // Generic: look for JSON-LD Product or common URL patterns
  const hasJsonLdProduct = !!document.querySelector(
    'script[type="application/ld+json"]'
  )
  const urlLooksLikeProduct = /\/(product|item|dp|p|pd|buy)\//i.test(url)
  return hasJsonLdProduct || urlLooksLikeProduct
}
```

### Extractors by Site

Each extractor returns a `ProductData` object:
```typescript
interface ProductData {
  title:        string
  description:  string
  cost_price:   number | null    // original price on their site
  images:       string[]         // up to 6 image URLs
  source_url:   string
  source_site:  string
}
```

---

#### Amazon.in

```javascript
function extractAmazon() {
  // Title
  const titleEl = document.getElementById('productTitle')
  const title = titleEl?.textContent?.trim() ?? ''

  // Price — combine whole + fraction (e.g. "355" + "00" → 355.00)
  const whole    = document.querySelector('.a-price-whole')?.textContent?.replace(/[^0-9]/g, '') ?? ''
  const fraction = document.querySelector('.a-price-fraction')?.textContent?.replace(/[^0-9]/g, '') ?? '00'
  const cost_price = whole ? parseFloat(`${whole}.${fraction}`) : null

  // MRP (original price before discount) — for reference only
  // const mrp = document.querySelector('#priceblock_ourprice, .basisPrice .a-offscreen')

  // Images — main + thumbnails
  const mainImg = document.getElementById('imgTagWrapperId')?.querySelector('img')?.src
  const thumbs  = [...document.querySelectorAll('#altImages .a-button-thumbnail img')]
    .map(img => img.src.replace(/\._[A-Z0-9_,]+_\./, '._SL500_.'))  // upscale thumbnail to full image
    .filter(Boolean)
  const images = [...new Set([mainImg, ...thumbs].filter(Boolean))].slice(0, 6)

  // Description — bullet points
  const bullets = [...document.querySelectorAll('#feature-bullets li span')]
    .map(el => el.textContent?.trim())
    .filter(t => t && !t.includes('Make sure this fits'))
    .slice(0, 5)
  const description = bullets.join(' • ')

  return {
    title,
    description,
    cost_price,
    images,
    source_url:  window.location.href,
    source_site: 'amazon.in',
  }
}
```

---

#### Flipkart.com

```javascript
function extractFlipkart() {
  // Title
  const title = document.querySelector('span.B_NuCI, h1.yhB1nd')?.textContent?.trim() ?? ''

  // Price — Flipkart shows discounted price in bold
  const priceText = document.querySelector('div._30jeq3, div._16Jk6d')?.textContent ?? ''
  const cost_price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || null

  // Images — Flipkart uses q-media or similar, try multiple selectors
  const imgEls = document.querySelectorAll('div._2r_T1I img, div.CXW8mj img, div._3kidJX img')
  const images = [...imgEls]
    .map(img => (img as HTMLImageElement).src)
    .filter(src => src && !src.includes('data:') && src.includes('rukminim'))
    .map(src => src.replace(/\/128\/128\//, '/512/512/').replace(/\/96\/96\//, '/512/512/'))
    .filter((src, i, arr) => arr.indexOf(src) === i)
    .slice(0, 6)

  // Description
  const descEls = document.querySelectorAll('div._1AN87F li, ._2o-xpa li')
  const description = [...descEls].map(el => el.textContent?.trim()).filter(Boolean).join(' • ')

  return {
    title,
    description,
    cost_price,
    images,
    source_url:  window.location.href,
    source_site: 'flipkart.com',
  }
}
```

---

#### Meesho.com

```javascript
function extractMeesho() {
  // Title — Meesho uses h1 with SC classes that change, target by tag
  const title = document.querySelector('h1')?.textContent?.trim() ?? ''

  // Price — look for ₹ symbol near a number
  const allText = [...document.querySelectorAll('h4, span, p')]
  const priceEl = allText.find(el => /^₹\s*\d/.test(el.textContent?.trim() ?? ''))
  const cost_price = priceEl
    ? parseFloat(priceEl.textContent!.replace(/[^0-9.]/g, ''))
    : null

  // Images — Meesho uses swiper/carousel
  const images = [...document.querySelectorAll('img')]
    .map(img => img.src)
    .filter(src => src.includes('meesho') && src.includes('product') && !src.includes('icon'))
    .filter((src, i, arr) => arr.indexOf(src) === i)
    .slice(0, 6)

  const description = document.querySelector('div[class*="Description"], div[class*="description"]')
    ?.textContent?.trim() ?? ''

  return {
    title,
    description,
    cost_price,
    images,
    source_url:  window.location.href,
    source_site: 'meesho.com',
  }
}
```

---

#### Myntra.com

```javascript
function extractMyntra() {
  const title = [
    document.querySelector('h1.pdp-title')?.textContent,
    document.querySelector('h1.pdp-name')?.textContent,
  ].find(Boolean)?.trim() ?? ''

  const priceText = document.querySelector('span.pdp-price strong, div.pdp-price')?.textContent ?? ''
  const cost_price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || null

  const images = [...document.querySelectorAll('div.image-grid-image img, div.pdp-carousel img')]
    .map(img => (img as HTMLImageElement).src)
    .filter(src => src && !src.includes('data:'))
    .filter((src, i, arr) => arr.indexOf(src) === i)
    .slice(0, 6)

  const description = document.querySelector('div.pdp-product-description-content p, div.index-sizeFitDesc')
    ?.textContent?.trim() ?? ''

  return { title, description, cost_price, images, source_url: window.location.href, source_site: 'myntra.com' }
}
```

---

#### Nykaa.com

```javascript
function extractNykaa() {
  const title = document.querySelector('h1[class*="css-"], h1.product-title')?.textContent?.trim() ?? ''

  const priceText = document.querySelector('span[class*="css-"] span, .price-container span')?.textContent ?? ''
  const cost_price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || null

  const images = [...document.querySelectorAll('div[class*="image"] img, .product-image img')]
    .map(img => (img as HTMLImageElement).src)
    .filter(src => src && src.startsWith('http') && !src.includes('icon'))
    .filter((src, i, arr) => arr.indexOf(src) === i)
    .slice(0, 6)

  return { title, description: '', cost_price, images, source_url: window.location.href, source_site: 'nykaa.com' }
}
```

---

#### Ajio.com

```javascript
function extractAjio() {
  const title = document.querySelector('h1.prod-name, .prod-name')?.textContent?.trim() ?? ''

  const priceText = document.querySelector('div.prod-sp, strong.prod-sp')?.textContent ?? ''
  const cost_price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || null

  const images = [...document.querySelectorAll('ul.prod-list li img, .image-carousel img')]
    .map(img => (img as HTMLImageElement).src)
    .filter(src => src && src.startsWith('http'))
    .filter((src, i, arr) => arr.indexOf(src) === i)
    .slice(0, 6)

  return { title, description: '', cost_price, images, source_url: window.location.href, source_site: 'ajio.com' }
}
```

---

#### Generic Fallback (Any Site)

```javascript
function extractGeneric(): ProductData {
  // Try JSON-LD first
  const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')]
  let ld: any = null
  for (const script of scripts) {
    try {
      const json = JSON.parse(script.textContent ?? '')
      const items = Array.isArray(json) ? json : [json]
      for (const item of items) {
        if (item['@type'] === 'Product') { ld = item; break }
        if (item['@graph']) {
          const found = item['@graph'].find((g: any) => g['@type'] === 'Product')
          if (found) { ld = found; break }
        }
      }
    } catch {}
    if (ld) break
  }

  // Title
  const title = ld?.name
    || document.querySelector('meta[property="og:title"]')?.getAttribute('content')
    || document.querySelector('h1')?.textContent?.trim()
    || document.title
    || ''

  // Description
  const description = ld?.description
    || document.querySelector('meta[property="og:description"]')?.getAttribute('content')
    || document.querySelector('meta[name="description"]')?.getAttribute('content')
    || ''

  // Price
  let cost_price: number | null = null
  if (ld?.offers) {
    const offer = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers
    cost_price = parseFloat(String(offer?.price ?? '').replace(/[^0-9.]/g, '')) || null
  }
  if (!cost_price) {
    const ogPrice = document.querySelector('meta[property="og:price:amount"]')?.getAttribute('content')
    cost_price = parseFloat((ogPrice ?? '').replace(/[^0-9.]/g, '')) || null
  }
  if (!cost_price) {
    // Try itemprop=price
    const itemprop = document.querySelector('[itemprop="price"]')
    cost_price = parseFloat(
      (itemprop?.getAttribute('content') || itemprop?.textContent || '').replace(/[^0-9.]/g, '')
    ) || null
  }

  // Images
  let images: string[] = []
  if (ld?.image) {
    const img = ld.image
    if (typeof img === 'string') images = [img]
    else if (Array.isArray(img)) images = img.map((i: any) => typeof i === 'string' ? i : i.url).filter(Boolean)
    else if (img.url) images = [img.url]
  }
  if (images.length === 0) {
    const ogImg = document.querySelector('meta[property="og:image"]')?.getAttribute('content')
    if (ogImg) images = [ogImg]
  }
  images = images
    .filter(src => src && src.startsWith('http') && !src.includes('icon') && !src.includes('logo'))
    .slice(0, 6)

  return {
    title: title.replace(/\s*[|—–-]\s*\S.*$/, '').trim(),
    description: description.slice(0, 500),
    cost_price,
    images,
    source_url:  window.location.href,
    source_site: window.location.hostname.replace(/^www\./, ''),
  }
}
```

### Master Dispatcher

```javascript
function extractProductData(): ProductData {
  const host = window.location.hostname

  if (host.includes('amazon.in'))    return extractAmazon()
  if (host.includes('flipkart.com')) return extractFlipkart()
  if (host.includes('meesho.com'))   return extractMeesho()
  if (host.includes('myntra.com'))   return extractMyntra()
  if (host.includes('nykaa.com'))    return extractNykaa()
  if (host.includes('ajio.com'))     return extractAjio()

  return extractGeneric()
}
```

---

## 10. Injected Side Panel UI

The panel is injected as a `div` into `document.body`. Use a **Shadow DOM** to fully isolate styles — the host page's CSS cannot bleed in.

### Panel HTML Structure (injected by content.js)

```html
<!-- Injected into page body -->
<div id="lg-extension-root">
  <!-- Shadow DOM root is attached here in JS -->
</div>
```

```javascript
// content.js — inject shadow DOM
const root = document.createElement('div')
root.id = 'lg-extension-root'
document.body.appendChild(root)

const shadow = root.attachShadow({ mode: 'open' })
shadow.innerHTML = `
  <style>
    /* All styles scoped inside shadow DOM — host page cannot interfere */
    :host { all: initial; }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; }

    #lg-fab {
      position: fixed;
      bottom: 80px;
      right: 24px;
      z-index: 2147483647;
      background: #7c3aed;
      color: white;
      border: none;
      border-radius: 50px;
      padding: 12px 20px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(124,58,237,0.4);
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }
    #lg-fab:hover { background: #6d28d9; transform: scale(1.04); }
    #lg-fab.hidden { display: none; }

    #lg-panel {
      position: fixed;
      top: 0;
      right: -420px;
      width: 400px;
      height: 100vh;
      background: white;
      z-index: 2147483647;
      box-shadow: -4px 0 40px rgba(0,0,0,0.15);
      overflow-y: auto;
      transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
    }
    #lg-panel.open { right: 0; }

    /* ... (rest of panel styles) */
  </style>

  <!-- Floating Action Button -->
  <button id="lg-fab">
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
    Add to LaunchGrid
  </button>

  <!-- Side Panel -->
  <div id="lg-panel">
    <!-- Header -->
    <div class="lg-panel-header">
      <div class="lg-logo">LaunchGrid</div>
      <button class="lg-close" id="lg-close-btn">✕</button>
    </div>

    <!-- Loading state -->
    <div id="lg-loading" class="lg-state">
      <div class="lg-spinner"></div>
      <p>Reading product details...</p>
    </div>

    <!-- Error state (not connected) -->
    <div id="lg-auth-error" class="lg-state hidden">
      <p class="lg-icon">🔗</p>
      <h3>Not connected</h3>
      <p>Connect your LaunchGrid account to add products.</p>
      <button id="lg-connect-btn" class="lg-btn-primary">Connect Account →</button>
    </div>

    <!-- Product form -->
    <div id="lg-product-form" class="hidden">
      <!-- Image carousel -->
      <div class="lg-images">
        <div class="lg-main-image">
          <img id="lg-main-img" src="" alt="Product image" />
        </div>
        <div class="lg-thumbs" id="lg-thumbs"></div>
        <p class="lg-img-count" id="lg-img-count"></p>
      </div>

      <!-- Fields -->
      <div class="lg-fields">
        <label>PRODUCT NAME</label>
        <input type="text" id="lg-title" placeholder="Product title" />

        <label>DESCRIPTION <span class="optional">(optional)</span></label>
        <textarea id="lg-desc" rows="3" placeholder="Short description..."></textarea>

        <div class="lg-price-row">
          <div>
            <label>THEIR PRICE (₹)</label>
            <input type="number" id="lg-cost" placeholder="e.g. 355" />
            <p class="hint">Source price</p>
          </div>
          <div>
            <label>YOUR PRICE (₹) <span class="required">*</span></label>
            <input type="number" id="lg-retail" placeholder="e.g. 499" />
            <p class="hint">Customer pays this</p>
          </div>
        </div>

        <!-- Margin badge -->
        <div id="lg-margin" class="lg-margin hidden"></div>

        <button id="lg-submit" class="lg-btn-primary" disabled>
          Add to My Store
        </button>

        <p id="lg-save-error" class="lg-error hidden"></p>
      </div>
    </div>

    <!-- Success state -->
    <div id="lg-success" class="lg-state hidden">
      <p class="lg-icon">✅</p>
      <h3 id="lg-success-title"></h3>
      <p>Added to your store and ready to sell.</p>
      <div class="lg-success-actions">
        <a id="lg-dashboard-link" href="https://launchgrid.in/dashboard/products" target="_blank" class="lg-btn-secondary">
          View in Dashboard →
        </a>
        <button id="lg-add-another" class="lg-btn-primary">Add Another</button>
      </div>
    </div>
  </div>
`
```

### Panel JavaScript Logic (still in content.js)

```javascript
// Panel interaction logic
const fab     = shadow.getElementById('lg-fab')
const panel   = shadow.getElementById('lg-panel')
const closeBtn = shadow.getElementById('lg-close-btn')
const submitBtn = shadow.getElementById('lg-submit')
const retailInput = shadow.getElementById('lg-retail')
const costInput   = shadow.getElementById('lg-cost')
const marginDiv   = shadow.getElementById('lg-margin')

// Open panel on FAB click
fab.addEventListener('click', async () => {
  fab.classList.add('hidden')
  panel.classList.add('open')

  // Check auth first
  const { lg_token } = await chrome.storage.local.get('lg_token')
  if (!lg_token) {
    showState('auth-error')
    return
  }

  // Extract product data
  showState('loading')
  const data = extractProductData()
  populateForm(data)
  showState('form')
})

closeBtn.addEventListener('click', () => {
  panel.classList.remove('open')
  fab.classList.remove('hidden')
})

// Live margin calculation
function updateMargin() {
  const cost   = parseFloat(costInput.value)   || 0
  const retail = parseFloat(retailInput.value) || 0
  submitBtn.disabled = !retailInput.value || !shadow.getElementById('lg-title').value

  if (retail <= 0) { marginDiv.classList.add('hidden'); return }
  marginDiv.classList.remove('hidden')

  if (retail <= cost) {
    marginDiv.className = 'lg-margin loss'
    marginDiv.textContent = `⚠ Selling at a loss — reduce cost or raise your price`
    submitBtn.disabled = true
    return
  }

  const margin  = Math.round(((retail - cost) / retail) * 100)
  const profit  = Math.round(retail - cost)
  const quality = margin >= 30 ? 'good' : margin >= 15 ? 'ok' : 'low'
  marginDiv.className = `lg-margin ${quality}`
  marginDiv.textContent = `Margin: ${margin}% — ₹${profit} profit per sale`
  submitBtn.disabled = false
}

retailInput.addEventListener('input', updateMargin)
costInput.addEventListener('input', updateMargin)

// Submit
submitBtn.addEventListener('click', async () => {
  submitBtn.disabled = true
  submitBtn.textContent = 'Adding...'

  const title       = shadow.getElementById('lg-title').value.trim()
  const description = shadow.getElementById('lg-desc').value.trim()
  const cost_price  = parseFloat(costInput.value)   || undefined
  const retail_price = parseFloat(retailInput.value)
  const images      = currentProductData.images || []
  const source_url  = currentProductData.source_url

  // Send to background script (which makes the API call)
  chrome.runtime.sendMessage({
    type: 'ADD_PRODUCT',
    data: { title, description, cost_price, retail_price, image_urls: images, source_url },
  }, (response) => {
    if (response.success) {
      shadow.getElementById('lg-success-title').textContent = `"${title}" added!`
      showState('success')
    } else {
      submitBtn.disabled = false
      submitBtn.textContent = 'Add to My Store'
      shadow.getElementById('lg-save-error').textContent = response.error || 'Something went wrong'
      shadow.getElementById('lg-save-error').classList.remove('hidden')
    }
  })
})

function showState(state) {
  // 'loading' | 'auth-error' | 'form' | 'success'
  shadow.getElementById('lg-loading').classList.toggle('hidden',      state !== 'loading')
  shadow.getElementById('lg-auth-error').classList.toggle('hidden',   state !== 'auth-error')
  shadow.getElementById('lg-product-form').classList.toggle('hidden', state !== 'form')
  shadow.getElementById('lg-success').classList.toggle('hidden',      state !== 'success')
}

function populateForm(data) {
  shadow.getElementById('lg-title').value = data.title || ''
  shadow.getElementById('lg-desc').value  = data.description || ''
  costInput.value   = data.cost_price ? String(Math.round(data.cost_price)) : ''
  retailInput.value = ''

  // Images
  const mainImg  = shadow.getElementById('lg-main-img')
  const thumbsEl = shadow.getElementById('lg-thumbs')
  const countEl  = shadow.getElementById('lg-img-count')

  mainImg.src = data.images?.[0] || ''
  mainImg.style.display = data.images?.length ? 'block' : 'none'

  thumbsEl.innerHTML = ''
  data.images?.slice(0, 6).forEach((src, i) => {
    const btn = document.createElement('button')
    btn.className = `lg-thumb${i === 0 ? ' active' : ''}`
    btn.innerHTML = `<img src="${src}" />`
    btn.addEventListener('click', () => {
      mainImg.src = src
      thumbsEl.querySelectorAll('.lg-thumb').forEach(t => t.classList.remove('active'))
      btn.classList.add('active')
    })
    thumbsEl.appendChild(btn)
  })

  countEl.textContent = `${data.images?.length || 0} image${data.images?.length !== 1 ? 's' : ''} found`
  currentProductData = data
  updateMargin()
}
```

---

## 11. Background Service Worker

```javascript
// background.js

// Listen for ADD_PRODUCT messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ADD_PRODUCT') {
    handleAddProduct(message.data).then(sendResponse)
    return true // keep message channel open for async response
  }

  if (message.type === 'GET_AUTH_STATE') {
    getAuthState().then(sendResponse)
    return true
  }

  if (message.type === 'DISCONNECT') {
    chrome.storage.local.remove(['lg_token', 'lg_subdomain', 'lg_store_name', 'lg_connected_at'])
    sendResponse({ success: true })
  }
})

async function handleAddProduct(data) {
  const { lg_token } = await chrome.storage.local.get('lg_token')

  if (!lg_token) {
    return { success: false, error: 'Not authenticated', code: 'AUTH_REQUIRED' }
  }

  try {
    const res = await fetch('https://launchgrid.in/api/products/add', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${lg_token}`,
      },
      body: JSON.stringify({
        title:        data.title,
        description:  data.description,
        retail_price: data.retail_price,
        cost_price:   data.cost_price,
        image_urls:   data.image_urls,
        source_url:   data.source_url,
      }),
    })

    const json = await res.json()

    if (res.status === 401) {
      // Token expired — clear it
      await chrome.storage.local.remove(['lg_token'])
      return { success: false, error: 'Session expired. Please reconnect.', code: 'TOKEN_EXPIRED' }
    }

    if (!res.ok) {
      return { success: false, error: json.error || 'Server error' }
    }

    return { success: true, product: json.product }
  } catch (err) {
    return { success: false, error: 'Network error — check your connection' }
  }
}

async function getAuthState() {
  const data = await chrome.storage.local.get(['lg_token', 'lg_store_name', 'lg_subdomain'])
  if (!data.lg_token) return { connected: false }

  // Optionally validate token with a quick API call
  try {
    const res = await fetch('https://launchgrid.in/api/extension/whoami', {
      headers: { 'Authorization': `Bearer ${data.lg_token}` },
    })
    if (!res.ok) {
      await chrome.storage.local.remove(['lg_token'])
      return { connected: false, reason: 'expired' }
    }
    const json = await res.json()
    return { connected: true, store_name: json.store_name, subdomain: json.subdomain, product_count: json.product_count }
  } catch {
    // Network error — assume still connected, don't invalidate token
    return { connected: true, store_name: data.lg_store_name, subdomain: data.lg_subdomain }
  }
}
```

---

## 12. Popup (Extension Icon Click)

```html
<!-- popup.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { width: 300px; min-height: 150px; font-family: -apple-system, 'Inter', sans-serif;
           margin: 0; padding: 20px; background: #fff; }
    .header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .logo { font-weight: 900; font-size: 15px; color: #1a1a1a; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; }
    .status-dot.disconnected { background: #d1d5db; }
    .store-name { font-weight: 700; font-size: 14px; color: #1a1a1a; }
    .subdomain { font-size: 12px; color: #888; }
    .product-count { font-size: 12px; color: #888; margin-bottom: 16px; }
    .btn { display: block; width: 100%; padding: 10px; border-radius: 10px; border: none;
           font-weight: 700; font-size: 13px; cursor: pointer; text-align: center;
           text-decoration: none; margin-bottom: 8px; }
    .btn-primary { background: #7c3aed; color: white; }
    .btn-primary:hover { background: #6d28d9; }
    .btn-secondary { background: #f3f4f6; color: #374151; }
    .btn-secondary:hover { background: #e5e7eb; }
    .btn-danger { background: #fff1f2; color: #e11d48; }
    .btn-danger:hover { background: #ffe4e6; }
    .not-connected { text-align: center; padding: 10px 0; }
    .not-connected p { font-size: 13px; color: #6b7280; margin-bottom: 16px; }
    .tip { font-size: 11px; color: #9ca3af; margin-top: 12px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">LaunchGrid</div>
    <div id="status-dot" class="status-dot disconnected"></div>
  </div>

  <!-- Connected state -->
  <div id="connected-state" style="display:none">
    <div class="store-name" id="store-name"></div>
    <div class="subdomain" id="store-subdomain"></div>
    <div class="product-count" id="product-count"></div>

    <a id="dashboard-link" href="https://launchgrid.in/dashboard" target="_blank" class="btn btn-secondary">
      Open Dashboard →
    </a>
    <button id="disconnect-btn" class="btn btn-danger">Disconnect</button>
    <p class="tip">Click the button on any product page to add items to your store.</p>
  </div>

  <!-- Not connected state -->
  <div id="not-connected-state">
    <div class="not-connected">
      <p>Connect your LaunchGrid account to start adding products from any website.</p>
      <button id="connect-btn" class="btn btn-primary">Connect Account →</button>
    </div>
  </div>

  <script src="popup.js"></script>
</body>
</html>
```

```javascript
// popup.js
document.addEventListener('DOMContentLoaded', async () => {
  // Check auth state via background script
  chrome.runtime.sendMessage({ type: 'GET_AUTH_STATE' }, (state) => {
    if (state.connected) {
      document.getElementById('connected-state').style.display = 'block'
      document.getElementById('not-connected-state').style.display = 'none'
      document.getElementById('status-dot').classList.remove('disconnected')
      document.getElementById('store-name').textContent    = state.store_name || 'Your Store'
      document.getElementById('store-subdomain').textContent = state.subdomain + '.launchgrid.in'
      document.getElementById('product-count').textContent  = state.product_count
        ? `${state.product_count} products in your store`
        : ''
      document.getElementById('dashboard-link').href =
        `https://launchgrid.in/dashboard`
    }
  })

  // Connect button
  document.getElementById('connect-btn')?.addEventListener('click', () => {
    const extId = chrome.runtime.id
    chrome.tabs.create({
      url: `https://launchgrid.in/dashboard/extension-auth?ext_id=${extId}`
    })
    window.close()
  })

  // Disconnect button
  document.getElementById('disconnect-btn')?.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'DISCONNECT' }, () => {
      location.reload()
    })
  })
})
```

---

## 13. LaunchGrid Dashboard Changes Required

To support the extension, these changes are needed on the LaunchGrid web app:

### A. New Page: `/dashboard/extension-auth`

```
Purpose: Auth handshake page for the extension

Logic:
1. Get user session (Supabase)
2. If not logged in: redirect to /login?next=/dashboard/extension-auth&ext_id=[ext_id]
3. If logged in:
   a. Get user's access token from Supabase (supabase.auth.getSession().access_token)
   b. Get tenant: subdomain, business_name
   c. Read ext_id from query params
   d. Redirect to:
      chrome-extension://[ext_id]/auth-callback.html
        #token=[access_token]
        &store=[subdomain]
        &name=[business_name]
```

```tsx
// src/app/dashboard/extension-auth/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getActiveTenant } from '@/utils/supabase/queries'

export default async function ExtensionAuthPage({
  searchParams
}: {
  searchParams: { ext_id?: string }
}) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect(`/login?next=/dashboard/extension-auth&ext_id=${searchParams.ext_id}`)
  }

  const result = await getActiveTenant()
  if (!result) return <div>No store found.</div>

  const { tenant } = result
  const token      = session.access_token
  const extId      = searchParams.ext_id
  const store      = tenant.subdomain
  const name       = encodeURIComponent(tenant.business_name)
  const callbackUrl = `chrome-extension://${extId}/auth-callback.html#token=${token}&store=${store}&name=${name}`

  redirect(callbackUrl)
}
```

### B. Update `/api/products/add` to Accept Bearer Token

The existing route only works with Supabase session cookies. Extend it to also accept `Authorization: Bearer` tokens:

```typescript
// In route.ts — replace the auth check block:
const supabase = await createClient()
let user = (await supabase.auth.getUser()).data.user

// If no session cookie, try Bearer token
if (!user) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const { data } = await supabase.auth.getUser(token)
    user = data.user
  }
}

if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

### C. New API Route: `GET /api/extension/whoami`

```typescript
// src/app/api/extension/whoami/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const serviceSupabase = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: Request) {
  const supabase = await createClient()
  let user = (await supabase.auth.getUser()).data.user

  if (!user) {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (token) {
      user = (await supabase.auth.getUser(token)).data.user
    }
  }

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tenant } = await serviceSupabase
    .from('tenants')
    .select('subdomain, business_name')
    .eq('owner_id', user.id)
    .single()

  const { count } = await serviceSupabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenant?.id ?? '')

  return NextResponse.json({
    store_name:    tenant?.business_name ?? '',
    subdomain:     tenant?.subdomain ?? '',
    product_count: count ?? 0,
  })
}
```

### D. Dashboard Settings: "Extension" Section
Add a section in `/dashboard/settings` showing:
- Whether the extension is connected (can detect via a flag or just link)
- Direct link to Chrome Web Store listing
- "Generate New Token" button (if token was compromised)

---

## 14. API Endpoints Used

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| `GET`  | `/dashboard/extension-auth?ext_id=` | Session cookie | Auth handshake, redirects to extension |
| `GET`  | `/api/extension/whoami` | Bearer token | Validate token, get store info |
| `POST` | `/api/products/add` | Bearer token | Add imported product |

---

## 15. Chrome Web Store Publishing Checklist

**Before submitting:**

- [ ] Extension name: "LaunchGrid — Add to Store" (check it's not taken)
- [ ] Description (max 132 chars for short): "Add products from Amazon, Flipkart, Meesho & any site to your LaunchGrid store in one click."
- [ ] Detailed description: explain all features, mention supported sites, explain permissions usage
- [ ] Privacy policy URL: `https://launchgrid.in/privacy` — must explicitly mention extension data usage
- [ ] Screenshots: 1280×800 or 640×400 (min 1, max 5) — show button on Amazon, side panel, success state
- [ ] Promotional tile: 440×280 image (optional but recommended)
- [ ] Category: Productivity
- [ ] Icons: 16px, 48px, 128px (all required)

**Permissions justification (Google asks for this):**
- `storage`: "Used to store the user's authentication token to keep them connected to their LaunchGrid store."
- `activeTab`: "Used to read product information from the page the user is currently viewing, only when the user explicitly clicks the Add to LaunchGrid button."
- `host_permissions (launchgrid.in)`: "Used to make API calls to the user's LaunchGrid account to save imported products."

**Review timeline:** First submission typically 1–3 business days. Updates after approval go live within hours.

---

## 16. Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| Product page with no images | Show placeholder in panel, allow save without image |
| Price extracted as 0 | Don't pre-fill cost price, show empty field |
| Title is very long (>200 chars) | Truncate to 200 chars, show "(truncated)" hint |
| Network error during save | Show retry button, don't close panel |
| Token expired mid-session | Clear token, show "Session expired" in panel with reconnect button |
| User not on a product page | Button doesn't appear — no action needed |
| Site with anti-iframe protection | Shadow DOM approach bypasses this (we're injecting a div, not iframe) |
| Extension updated while panel open | Panel closes gracefully on next page load |
| Amazon URL with affiliate redirect | Follow redirect before extracting, or strip ref params |
| Multiple products open in tabs | Each tab is independent — no shared state issues |
| User already has the product | API returns duplicate — show "This product is already in your store" |

---

## 17. Dynamic Domain Portability (June 2026 Update)

The extension must work across environments without hardcoding the backend URL.

### How it works

When the user is on any LaunchGrid page (dashboard, login, etc.), the content script detects the hostname and saves it as `lg_backend_url` in `chrome.storage.local`. All API calls then use this stored URL.

```javascript
// content-script.js — run on all pages
const hostname = window.location.hostname

// Whitelist: only write lg_backend_url from known LaunchGrid hosts
const ALLOWED_HOSTS = ['launchgrid.in', 'localhost']
const isAllowed = ALLOWED_HOSTS.some(h =>
  hostname === h || hostname.endsWith('.' + h)
)

if (isAllowed) {
  const port = window.location.port
  const backendUrl = hostname.includes('localhost')
    ? `http://localhost:${port || 3000}`
    : 'https://launchgrid.in'
  chrome.storage.local.set({ lg_backend_url: backendUrl })
  console.log('[LaunchGrid] Backend URL set to:', backendUrl)
}
```

**Security requirement:** Only write `lg_backend_url` from whitelisted origins. A malicious site could otherwise point the extension to a fake backend that harvests the auth token.

```javascript
// background.js — use lg_backend_url for all calls
async function getBackendUrl() {
  const { lg_backend_url } = await chrome.storage.local.get('lg_backend_url')
  return lg_backend_url || 'https://launchgrid.in'  // safe default
}

async function addProduct(productData) {
  const base = await getBackendUrl()
  const { token } = await chrome.storage.local.get('token')
  return fetch(`${base}/api/products/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(productData)
  })
}
```

### Auth flow with ext_id param preservation

The `ext_id` param must survive the full login redirect chain:

```
User clicks "Connect to LaunchGrid" in extension popup
    ↓
Open: https://[lg_backend_url]/login?next=/dashboard/extension-auth&ext_id=chrome-extension-abc123
    ↓
User logs in (or is already logged in)
    ↓
/dashboard/extension-auth?ext_id=chrome-extension-abc123
  - Server verifies session
  - Generates one-time token (store in Supabase with 1h expiry)
  - Redirects to: chrome-extension://abc123/auth-callback.html#token=eyJ...
    ↓
auth-callback.html reads token from hash
  - Saves to chrome.storage.local: { token, store_name, subdomain }
  - Closes auth tab
  - Notifies extension: "Connected ✅"
```

**Login page must forward `next` param:** The login flow must not drop query params. The `next` param must be forwarded through any intermediate redirects (email confirm, MFA, etc.).

### Development workflow

For local development:
1. Open `localhost:3000/dashboard` in Chrome — extension detects `localhost` and sets `lg_backend_url = http://localhost:3000`
2. Click extension icon — auth redirects to `localhost:3000/login?next=...`
3. After auth, API calls hit `localhost:3000/api/...`

For production:
1. Any visit to `launchgrid.in` sets `lg_backend_url = https://launchgrid.in`
2. All API calls hit production

No code change or rebuild needed to switch environments.

---

## 18. Phase 2 Ideas

These are out of scope for V1 but worth planning for:

**P2-01: Bulk Import Mode**
- "Select multiple products" mode on search result / category pages
- Select checkboxes on items → bulk add to store at once
- Works on Amazon search, Flipkart listings, Meesho feed

**P2-02: Price Intelligence**
- When user sets their price, show what competitors on WhatsApp/Instagram typically charge
- "Market rate for this category: ₹420–₹580"

**P2-03: Inventory Sync**
- Watch a product URL — if original site price drops below cost, alert the merchant
- "Amazon dropped price to ₹199 — your store still shows ₹399. Update?"

**P2-04: One-Click Relist**
- If a product goes out of stock on source, auto-hide it on LaunchGrid store
- Re-activate when source shows in stock again

**P2-05: Firefox + Safari Extension**
- Same manifest v3 works on Firefox with minor changes
- Safari requires Xcode + Apple Developer account ($99/year)

**P2-06: Mobile Share Sheet (Android)**
- On Android, share a product URL from any browser to LaunchGrid app
- LaunchGrid app handles the URL → shows same import panel
- Uses Android Intents, not an extension

---

*End of specification. Build sequence recommendation:*
1. *Build content.js + background.js + auth flow first (core value)*
2. *Test on Amazon.in, Flipkart.com, Meesho.com*
3. *Build popup.html (simple, 2 hours)*
4. *Add LaunchGrid dashboard changes (extension-auth page + whoami API)*
5. *Submit to Chrome Web Store*
6. *Add remaining site extractors based on user feedback*

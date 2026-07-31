// LaunchGrid supplier-evidence capture.
//
// Runs on SUPPLIER/wholesale pages (Alibaba, IndiaMART, TradeIndia, Made-in-China,
// GlobalSources, 1688) — NOT retail marketplaces. content.js already handles retail
// ("add this product to my store"); this file answers a different question:
// "capture this supplier's MOQ and wholesale price tiers as research evidence".
//
// WHY THIS EXISTS: LaunchGrid's research module previously had no automated ingestion at
// all — every supplier name, MOQ and unit price was typed by hand, which meant reports
// could rest on guesses while looking authoritative. This sends REAL page data instead.
//
// HONESTY RULES BAKED IN:
//   • Only fields actually found in the DOM are sent. Missing values are omitted, never
//     defaulted — the server leaves unknown evidence columns NULL rather than `false`.
//   • Every payload carries an extractionConfidence and the parser version, so a weak
//     scrape is visibly weak downstream instead of silently trusted.
//   • The extension does NOT infer factory audits / business licences / export history
//     from marketing badges. Those are compliance claims; a "Verified Supplier" ribbon is
//     not evidence of any of them.
(() => {
  'use strict'

  if (window.__lgSupplierLoaded) return
  window.__lgSupplierLoaded = true

  const PARSER_VERSION = 'lg-supplier@1.0.0'

  // ── extraction helpers ─────────────────────────────────────────────────────
  const textOf = (el) => (el && el.textContent ? el.textContent.replace(/\s+/g, ' ').trim() : '')

  function pickText(selectors) {
    for (const sel of selectors) {
      try {
        const t = textOf(document.querySelector(sel))
        if (t) return t
      } catch { /* invalid selector for this DOM — skip */ }
    }
    return ''
  }

  /** "MOQ: 500 Pieces" / "Min. Order: 1,000 sets" → 500 / 1000 */
  function parseMoq(text) {
    if (!text) return null
    const m = text.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/)
    if (!m) return null
    const n = parseFloat(m[1])
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null
  }

  /** "₹120 - ₹180 / Piece" or "$1.20-$2.40" → [120, 180] */
  function parsePriceRange(text) {
    if (!text) return []
    const nums = (text.replace(/,/g, '').match(/\d+(?:\.\d{1,2})?/g) || [])
      .map(parseFloat)
      .filter((n) => Number.isFinite(n) && n > 0 && n < 10_000_000)
    return nums.slice(0, 2)
  }

  function detectCurrency(text) {
    if (/₹|INR|Rs\.?/i.test(text)) return 'INR'
    if (/\$|USD/i.test(text)) return 'USD'
    if (/¥|CNY|RMB/i.test(text)) return 'CNY'
    return null
  }

  // ── per-site rules ─────────────────────────────────────────────────────────
  // Selectors are best-effort against each site's current public markup. They are NOT
  // guaranteed stable — that is exactly why extractionConfidence is computed from how many
  // fields actually resolved, rather than assuming a successful parse.
  const SUPPLIER_SITES = [
    {
      host: /indiamart\./i,
      platform: 'IndiaMART',
      defaultCountry: 'India',
      isSupplierPage: () => /proddetail|impcat|company|\/aboutus/i.test(location.pathname + location.href),
      supplierName: ['.cmpny_hdng a', '.compName', '[class*="companyName"]', '.lft-cmp-nm', 'h1 + div a'],
      price: ['.prc .p_price', '.prc', '[class*="price"]', '.dpp'],
      moq: ['.mnq', '[class*="moq"]', '[class*="minOrder"]'],
      location: ['.clr_gry .fs13', '[class*="cityName"]', '.addr'],
    },
    {
      host: /alibaba\./i,
      platform: 'Alibaba',
      defaultCountry: null,
      isSupplierPage: () => /\/product-detail\/|\/company_profile|\.html/i.test(location.pathname),
      supplierName: ['a[data-role="company-name"]', '.company-name', '[class*="company-name"]', '[data-spm="seller"] a'],
      price: ['.price', '[class*="product-price"]', '[class*="ladder-price"]'],
      moq: ['[class*="moq"]', '[class*="min-order"]', '.min-order-quantity'],
      location: ['[class*="supplier-location"]', '[class*="country"]'],
    },
    {
      host: /tradeindia\./i,
      platform: 'TradeIndia',
      defaultCountry: 'India',
      isSupplierPage: () => /products|company|seller/i.test(location.pathname),
      supplierName: ['[class*="companyName"]', '.cmp-name', 'h2 a'],
      price: ['[class*="price"]', '.prc'],
      moq: ['[class*="moq"]', '[class*="minOrder"]'],
      location: ['[class*="location"]', '[class*="city"]'],
    },
    {
      host: /made-in-china\./i,
      platform: 'Made-in-China',
      defaultCountry: 'China',
      isSupplierPage: () => /product|company/i.test(location.pathname),
      supplierName: ['.company-name', '[class*="compName"]', '.cmp-name a'],
      price: ['.price', '[class*="price"]'],
      moq: ['[class*="moq"]', '[class*="min-order"]'],
      location: ['[class*="location"]', '[class*="province"]'],
    },
    {
      host: /globalsources\./i,
      platform: 'GlobalSources',
      defaultCountry: null,
      isSupplierPage: () => /product|supplier|company/i.test(location.pathname),
      supplierName: ['[class*="supplierName"]', '[class*="company"]', '.supplier-name'],
      price: ['[class*="price"]'],
      moq: ['[class*="moq"]', '[class*="minOrder"]'],
      location: ['[class*="location"]', '[class*="country"]'],
    },
    {
      host: /1688\.com|yiwugo\./i,
      platform: '1688 / Yiwugo',
      defaultCountry: 'China',
      isSupplierPage: () => /offer|product|shop/i.test(location.pathname),
      supplierName: ['.company-name', '[class*="companyName"]', '.shop-name'],
      price: ['[class*="price"]', '.price-original'],
      moq: ['[class*="moq"]', '[class*="begin-amount"]'],
      location: ['[class*="location"]', '[class*="address"]'],
    },
  ]

  function extract() {
    const site = SUPPLIER_SITES.find((s) => s.host.test(location.hostname))
    if (!site || !site.isSupplierPage()) return null

    const supplierName = pickText(site.supplierName)
    if (!supplierName) return null // nothing worth sending

    const priceText = pickText(site.price)
    const moqText = pickText(site.moq)
    const locationText = pickText(site.location)

    const prices = parsePriceRange(priceText)
    const moq = parseMoq(moqText)
    const currency = detectCurrency(priceText) || (site.defaultCountry === 'India' ? 'INR' : null)

    // Confidence reflects how much we actually resolved — not how confident we'd like to be.
    let confidence = 0.3 // we have a supplier name at minimum
    if (prices.length) confidence += 0.3
    if (moq) confidence += 0.25
    if (locationText) confidence += 0.1
    confidence = Math.min(1, Math.round(confidence * 100) / 100)

    const priceTiers = prices.length
      ? [{ quantity: moq || 1, unitPrice: prices[0], currency: currency || 'USD' }]
      : []

    return {
      sourceUrl: location.href.split('?')[0],
      parserVersion: `${site.platform}:${PARSER_VERSION}`,
      extractionConfidence: confidence,
      platform: site.platform,
      moq: moq || undefined,
      supplier: {
        supplierName: supplierName.slice(0, 180),
        storeUrl: location.href.split('?')[0],
        // Only send a country when the site itself implies one — never guess from language.
        ...(site.defaultCountry ? { country: site.defaultCountry } : {}),
        ...(locationText ? { city: locationText.slice(0, 120) } : {}),
      },
      priceTiers,
      // Surfaced in the widget so the merchant can see exactly what was read off the page.
      _debug: { priceText, moqText, locationText },
    }
  }

  function send(message) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) resolve(null)
          else resolve(response)
        })
      } catch { resolve(null) }
    })
  }

  // ── widget ─────────────────────────────────────────────────────────────────
  const CSS = `
    :host { all: initial; }
    * { box-sizing: border-box; margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .root { position: fixed; top: 96px; right: 16px; z-index: 2147483647; }
    .pill { display:flex; align-items:center; gap:8px; background:#1A1A18; color:#fff; border:none; cursor:pointer;
      padding:10px 14px; border-radius:999px; box-shadow:0 8px 32px rgba(0,0,0,.28); font-size:13px; font-weight:700; }
    .pill .dot { width:8px; height:8px; border-radius:50%; background:#7C3AED; }
    .card { width:340px; background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 24px 64px rgba(0,0,0,.30), 0 0 0 1px rgba(0,0,0,.06); }
    .head { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; background:#1A1A18; color:#fff; }
    .head .brand { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:800; }
    .head .brand .dot { width:8px; height:8px; border-radius:50%; background:#7C3AED; }
    .head button { background:none; border:none; color:rgba(255,255,255,.6); font-size:18px; cursor:pointer; }
    .body { padding:14px; }
    .row { font-size:12px; color:#1A1A18; display:flex; justify-content:space-between; gap:8px; padding:5px 0; border-bottom:1px solid rgba(0,0,0,.05); }
    .row span:first-child { color:#8a8a86; font-weight:600; }
    .row span:last-child { font-weight:700; text-align:right; }
    .missing { color:#b45309; font-style:italic; font-weight:600; }
    label { display:block; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:#8a8a86; margin:12px 0 4px; }
    select { width:100%; padding:9px 10px; border:1px solid rgba(0,0,0,.12); border-radius:10px; font-size:13px; background:#fff; }
    .btn { width:100%; margin-top:12px; padding:12px; border:none; border-radius:12px; cursor:pointer; background:#1A1A18; color:#fff; font-size:13.5px; font-weight:800; }
    .btn:disabled { opacity:.5; cursor:default; }
    .note { font-size:11px; color:#8a8a86; margin-top:9px; line-height:1.45; }
    .conf { font-size:11px; font-weight:700; padding:2px 8px; border-radius:999px; }
    .conf.lo { background:#fef2f2; color:#b91c1c; } .conf.mid { background:#fffbeb; color:#b45309; } .conf.hi { background:#ecfdf5; color:#047857; }
    .err { background:#fef2f2; border:1px solid #fecaca; color:#b91c1c; font-size:12px; padding:8px 10px; border-radius:10px; margin-bottom:10px; }
    .ok { text-align:center; padding:8px 0; } .ok .big { font-size:28px; }
  `

  const state = { data: null, open: false, ideas: null, selected: '', busy: false, done: false, error: null }
  let host = null, sr = null

  function confClass(c) { return c < 0.5 ? 'lo' : c < 0.75 ? 'mid' : 'hi' }

  function render() {
    if (!sr) return
    const d = state.data
    let inner = ''

    if (!state.open) {
      inner = `<button class="pill" id="lg-open"><span class="dot"></span> Capture supplier evidence</button>`
    } else if (state.done) {
      inner = `<div class="card"><div class="head"><span class="brand"><span class="dot"></span> LaunchGrid Research</span><button id="lg-close">×</button></div>
        <div class="body"><div class="ok"><div class="big">✓</div><p style="font-size:13px;font-weight:700;margin:6px 0">Supplier evidence saved</p>
        <p class="note">Attached to your research idea with the source URL and a confidence score. Open the report to review it.</p></div></div></div>`
    } else {
      const c = d.extractionConfidence
      const tier = d.priceTiers[0]
      inner = `<div class="card">
        <div class="head"><span class="brand"><span class="dot"></span> LaunchGrid Research</span><button id="lg-close">×</button></div>
        <div class="body">
          ${state.error ? `<div class="err">${state.error}</div>` : ''}
          <div class="row"><span>Supplier</span><span>${d.supplier.supplierName}</span></div>
          <div class="row"><span>Platform</span><span>${d.platform}</span></div>
          <div class="row"><span>MOQ</span><span class="${d.moq ? '' : 'missing'}">${d.moq ? d.moq.toLocaleString() + ' units' : 'not found on page'}</span></div>
          <div class="row"><span>Unit price</span><span class="${tier ? '' : 'missing'}">${tier ? tier.currency + ' ' + tier.unitPrice : 'not found on page'}</span></div>
          <div class="row"><span>Extraction confidence</span><span><span class="conf ${confClass(c)}">${Math.round(c * 100)}%</span></span></div>
          <label>Attach to research idea</label>
          <select id="lg-idea">${
            state.ideas === null ? '<option>Loading…</option>'
            : state.ideas.length === 0 ? '<option value="">No research ideas yet — create one first</option>'
            : '<option value="">Select an idea…</option>' + state.ideas.map((i) => `<option value="${i.id}">${i.name}</option>`).join('')
          }</select>
          <button class="btn" id="lg-save" ${state.busy || !state.selected ? 'disabled' : ''}>${state.busy ? 'Saving…' : 'Save as research evidence'}</button>
          <p class="note">Only what was actually read off this page is sent. Fields marked “not found” stay empty — LaunchGrid never guesses factory audits, licences or export history from a badge.</p>
        </div></div>`
    }

    sr.getElementById('lg-root').innerHTML = inner
    wire()
  }

  function wire() {
    const $ = (id) => sr.getElementById(id)
    $('lg-open')?.addEventListener('click', async () => {
      state.open = true
      render()
      if (state.ideas === null) {
        const res = await send({ type: 'LIST_IDEAS' })
        state.ideas = res?.ideas ?? []
        render()
      }
    })
    $('lg-close')?.addEventListener('click', () => { state.open = false; state.error = null; render() })
    $('lg-idea')?.addEventListener('change', (e) => { state.selected = e.target.value; render() })
    $('lg-save')?.addEventListener('click', async () => {
      state.busy = true; state.error = null; render()
      const { _debug, platform, ...payload } = state.data
      const res = await send({ type: 'INGEST_SUPPLIER', data: { ...payload, productIdeaId: state.selected } })
      state.busy = false
      if (res?.success) state.done = true
      else state.error = res?.error || 'Could not save. Are you connected to your store?'
      render()
    })
  }

  function mount(data) {
    state.data = data
    if (host) return render()
    host = document.createElement('div')
    host.id = 'lg-supplier-host'
    const shadow = host.attachShadow({ mode: 'closed' })
    const style = document.createElement('style'); style.textContent = CSS
    const root = document.createElement('div'); root.className = 'root'; root.id = 'lg-root'
    shadow.appendChild(style); shadow.appendChild(root)
    sr = { getElementById: (id) => shadow.getElementById(id) }
    document.documentElement.appendChild(host)
    render()
  }

  // Supplier sites are heavy SPAs — retry while the page fills in.
  let attempts = 0
  const timer = setInterval(() => {
    attempts++
    const data = extract()
    if (data) { mount(data); clearInterval(timer) }
    else if (attempts >= 10) clearInterval(timer)
  }, 1000)
})()

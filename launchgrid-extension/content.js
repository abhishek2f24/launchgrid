// LaunchGrid content script — Honey-style corner widget on product pages.
// Detection order: JSON-LD Product → OpenGraph/meta → site-specific selectors.
// UI lives entirely inside a Shadow DOM so host-page CSS can never break it.
(() => {
  'use strict'

  if (window.__lgWidgetLoaded) return
  window.__lgWidgetLoaded = true

  // ───────────────────────── Product detection ─────────────────────────

  function parsePrice(raw) {
    if (raw == null) return null
    if (typeof raw === 'number') return raw > 0 ? Math.round(raw) : null
    const m = String(raw).replace(/[,\s]/g, '').match(/(\d+(?:\.\d{1,2})?)/)
    if (!m) return null
    const n = parseFloat(m[1])
    return n > 0 && n < 10000000 ? Math.round(n) : null
  }

  function firstImage(img) {
    if (!img) return null
    if (Array.isArray(img)) img = img[0]
    if (typeof img === 'object' && img !== null) img = img.url || img.contentUrl || null
    if (typeof img !== 'string') return null
    try { return new URL(img, location.href).href } catch { return null }
  }

  function fromJsonLd() {
    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      let data
      try { data = JSON.parse(script.textContent) } catch { continue }
      const nodes = []
      const collect = (n) => {
        if (!n || typeof n !== 'object') return
        if (Array.isArray(n)) return n.forEach(collect)
        nodes.push(n)
        if (n['@graph']) collect(n['@graph'])
      }
      collect(data)
      for (const node of nodes) {
        const type = [].concat(node['@type'] || [])
        if (!type.includes('Product')) continue
        const offers = [].concat(node.offers || [])[0] || {}
        const price = parsePrice(offers.price ?? offers.lowPrice ?? offers.highPrice)
        if (!node.name) continue
        return {
          title: String(node.name).trim().slice(0, 200),
          price,
          image: firstImage(node.image),
          description: typeof node.description === 'string' ? node.description.trim().slice(0, 600) : '',
          confidence: 'high',
        }
      }
    }
    return null
  }

  function meta(sel) {
    const el = document.querySelector(sel)
    return el ? (el.getAttribute('content') || '').trim() : ''
  }

  function fromOpenGraph() {
    const ogType = meta('meta[property="og:type"]')
    const title = meta('meta[property="og:title"]') || meta('meta[name="twitter:title"]')
    const image = meta('meta[property="og:image"]') || meta('meta[name="twitter:image"]')
    const price = parsePrice(
      meta('meta[property="product:price:amount"]') ||
      meta('meta[property="og:price:amount"]') ||
      meta('meta[itemprop="price"]')
    )
    if (!title) return null
    // Only trust OG alone when it self-declares a product, or we found a price
    if (!/product/i.test(ogType) && !price) return null
    return {
      title: title.slice(0, 200),
      price,
      image: image || null,
      description: meta('meta[property="og:description"]').slice(0, 600),
      confidence: price ? 'high' : 'medium',
    }
  }

  const SITE_RULES = [
    {
      host: /amazon\./,
      isProduct: () => /\/(dp|gp\/product)\//.test(location.pathname),
      title: ['#productTitle'],
      price: ['.a-price .a-offscreen', '#priceblock_dealprice', '#priceblock_ourprice'],
      image: ['#landingImage', '#imgBlkFront'],
    },
    {
      host: /flipkart\./,
      isProduct: () => /\/p\//.test(location.pathname),
      title: ['h1 span', 'h1'],
      price: ['div._30jeq3._16Jk6d', 'div._30jeq3', '[class*="price"] div'],
      image: ['img[loading="eager"]', 'img._396cs4', 'img._2r_T1I'],
    },
    {
      host: /meesho\./,
      isProduct: () => /\/p\//.test(location.pathname) || /\/product\//.test(location.pathname),
      title: ['h1'],
      price: ['h4', '[class*="DesktopPrice"]', '[class*="discounted"]'],
      image: ['img[alt][src*="images.meesho"]', 'main img'],
    },
    {
      host: /myntra\./,
      isProduct: () => /\/\d+\/buy/.test(location.pathname) || /\/buy$/.test(location.pathname),
      title: ['.pdp-title', 'h1.pdp-name', 'h1'],
      price: ['.pdp-price strong', '.pdp-price'],
      image: ['.image-grid-image', '.image-grid-imageContainer img'],
    },
    {
      host: /nykaa\./,
      isProduct: () => /\/p\//.test(location.pathname),
      title: ['h1'],
      price: ['[class*="css-1jczs19"]', '[class*="price"] span'],
      image: ['img[src*="images-static.nykaa"]'],
    },
    {
      host: /ajio\./,
      isProduct: () => /\/p\//.test(location.pathname),
      title: ['h1.prod-name', 'h1'],
      price: ['.prod-sp', '.prod-price-section .prod-sp'],
      image: ['.img-container img', '.rilrtl-lazy-img'],
    },
    {
      host: /snapdeal\./,
      isProduct: () => /\/product\//.test(location.pathname),
      title: ['h1[itemprop="name"]', 'h1'],
      price: ['.payBlkBig', '[itemprop="price"]'],
      image: ['#bx-pager img', '.cloudzoom'],
    },
    {
      host: /glowroad\./,
      isProduct: () => /\/product/.test(location.pathname),
      title: ['h1'],
      price: ['[class*="price"]'],
      image: ['main img'],
    },
    {
      host: /indiamart\./,
      isProduct: () => /\/proddetail\//.test(location.pathname),
      title: ['h1'],
      price: ['.bo.price-unit', '[class*="price"]'],
      image: ['#big_img', '.bigImg img'],
    },
  ]

  function pickText(selectors) {
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel)
        const t = el && (el.textContent || '').trim()
        if (t) return t
      } catch { /* invalid selector — skip */ }
    }
    return ''
  }

  function pickImage(selectors) {
    for (const sel of selectors) {
      try {
        const el = document.querySelector(sel)
        const src = el && (el.currentSrc || el.src)
        if (src && src.startsWith('http')) return src
      } catch { /* skip */ }
    }
    return null
  }

  function fromSiteRules() {
    const rule = SITE_RULES.find(r => r.host.test(location.hostname))
    if (!rule || !rule.isProduct()) return null
    const title = pickText(rule.title)
    if (!title) return null
    return {
      title: title.slice(0, 200),
      price: parsePrice(pickText(rule.price)),
      image: pickImage(rule.image),
      description: '',
      confidence: 'medium',
    }
  }

  function detectProduct() {
    const product = fromJsonLd() || fromOpenGraph() || fromSiteRules()
    if (!product) return null
    // Fill gaps across strategies
    if (!product.image) product.image = meta('meta[property="og:image"]') || null
    if (!product.description) product.description = meta('meta[property="og:description"]').slice(0, 600)
    return product
  }

  // ───────────────────────── Widget UI (Shadow DOM) ─────────────────────────

  const CSS = `
    :host { all: initial; }
    * { box-sizing: border-box; margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }

    .root { position: fixed; top: 96px; right: 16px; z-index: 2147483647; }

    .pill {
      display: flex; align-items: center; gap: 8px;
      background: #1A1A18; color: #fff; border: none; cursor: pointer;
      padding: 10px 14px; border-radius: 999px;
      box-shadow: 0 8px 32px rgba(0,0,0,.28);
      font-size: 13px; font-weight: 700; letter-spacing: .01em;
      transition: transform .15s ease, box-shadow .15s ease;
    }
    .pill:hover { transform: translateY(-1px); box-shadow: 0 12px 36px rgba(0,0,0,.32); }
    .pill .dot { width: 8px; height: 8px; border-radius: 50%; background: #FF8A00; }

    .card {
      width: 320px; background: #fff; border-radius: 16px; overflow: hidden;
      box-shadow: 0 24px 64px rgba(0,0,0,.30), 0 0 0 1px rgba(0,0,0,.06);
      animation: lgIn .18s ease;
    }
    @keyframes lgIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }

    .head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 14px; background: #1A1A18; color: #fff;
    }
    .head .brand { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 800; }
    .head .brand .dot { width: 8px; height: 8px; border-radius: 50%; background: #FF8A00; }
    .head button { background: none; border: none; color: rgba(255,255,255,.6); font-size: 18px; line-height: 1; cursor: pointer; padding: 2px 4px; }
    .head button:hover { color: #fff; }

    .body { padding: 14px; }

    .prod { display: flex; gap: 10px; margin-bottom: 12px; }
    .prod img { width: 56px; height: 56px; border-radius: 10px; object-fit: cover; background: #f3f3f1; flex: none; }
    .prod .ph { width: 56px; height: 56px; border-radius: 10px; background: #f3f3f1; display: flex; align-items: center; justify-content: center; color: #999; font-size: 22px; flex: none; }
    .prod .t { font-size: 12.5px; font-weight: 600; color: #1A1A18; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
    .prod .src { font-size: 11px; color: #8a8a86; margin-top: 3px; }

    .row { display: flex; gap: 8px; margin-bottom: 10px; }
    .field { flex: 1; }
    .field label { display: block; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: #8a8a86; margin-bottom: 4px; }
    .field input {
      width: 100%; padding: 9px 10px; border: 1px solid rgba(0,0,0,.12); border-radius: 10px;
      font-size: 14px; font-weight: 700; color: #1A1A18; outline: none; background: #fff;
    }
    .field input:focus { border-color: #FF8A00; box-shadow: 0 0 0 3px rgba(255,138,0,.15); }
    .field input[readonly] { background: #f7f7f5; color: #6b6b67; }

    .profit { font-size: 12px; font-weight: 600; color: #15803d; margin: -2px 0 12px; min-height: 15px; }
    .profit.neg { color: #b91c1c; }

    .btn {
      width: 100%; padding: 12px; border: none; border-radius: 12px; cursor: pointer;
      background: #1A1A18; color: #fff; font-size: 13.5px; font-weight: 800;
      transition: background .15s ease, transform .1s ease;
    }
    .btn:hover { background: #000; }
    .btn:active { transform: scale(.985); }
    .btn:disabled { opacity: .55; cursor: default; }
    .btn.orange { background: #FF8A00; }
    .btn.orange:hover { background: #e67c00; }

    .note { font-size: 11px; color: #8a8a86; text-align: center; margin-top: 9px; line-height: 1.4; }
    .note a, .link { color: #1A1A18; font-weight: 700; cursor: pointer; text-decoration: underline; }

    .state { text-align: center; padding: 6px 4px 2px; }
    .state .big { font-size: 30px; margin-bottom: 8px; }
    .state .msg { font-size: 13.5px; font-weight: 700; color: #1A1A18; margin-bottom: 4px; }
    .state .sub { font-size: 12px; color: #8a8a86; line-height: 1.45; margin-bottom: 12px; }

    .err { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; font-size: 12px; font-weight: 600; padding: 8px 10px; border-radius: 10px; margin-bottom: 10px; line-height: 1.4; }

    .spin { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 50%; animation: lgSpin .7s linear infinite; vertical-align: -2px; margin-right: 6px; }
    @keyframes lgSpin { to { transform: rotate(360deg); } }
  `

  const state = {
    product: null,
    open: false,
    auth: null,        // null = unknown, {connected, store_name, subdomain}
    adding: false,
    added: false,
    error: null,
    dismissed: false,
  }

  let host = null
  let shadow = null

  function suggestSellPrice(cost) {
    if (!cost) return ''
    // +30% margin, rounded up to a price ending in 9 (₹649, ₹1,299 style)
    const raw = cost * 1.3
    return Math.max(cost + 10, Math.ceil(raw / 10) * 10 - 1)
  }

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  }

  function render() {
    if (!shadow) return
    const p = state.product
    let inner = ''

    if (!state.open) {
      inner = `
        <button class="pill" id="lg-open" title="Add this product to your LaunchGrid store">
          <span class="dot"></span> Add to my store
        </button>`
    } else if (state.added) {
      inner = `
        <div class="card">
          <div class="head">
            <span class="brand"><span class="dot"></span> LaunchGrid</span>
            <button id="lg-close" aria-label="Close">×</button>
          </div>
          <div class="body">
            <div class="state">
              <div class="big">✓</div>
              <div class="msg">Added to ${esc(state.auth?.store_name || 'your store')}</div>
              <div class="sub">It's live in your catalog. Set photos &amp; details in the dashboard if needed.</div>
              <button class="btn" id="lg-dash">Open my dashboard</button>
              <div class="note"><span class="link" id="lg-again">Add another product</span></div>
            </div>
          </div>
        </div>`
    } else if (state.auth && !state.auth.connected) {
      inner = `
        <div class="card">
          <div class="head">
            <span class="brand"><span class="dot"></span> LaunchGrid</span>
            <button id="lg-close" aria-label="Close">×</button>
          </div>
          <div class="body">
            <div class="state">
              <div class="big">🔗</div>
              <div class="msg">Connect your store</div>
              <div class="sub">One-time login links this extension to your LaunchGrid store. Takes 10 seconds.</div>
              <button class="btn orange" id="lg-connect">Connect my store</button>
              <div class="note">No store yet? <a href="https://launchgrid.in/onboarding?utm_source=extension" target="_blank" rel="noopener">Create one free</a></div>
            </div>
          </div>
        </div>`
    } else {
      const cost = p.price || ''
      const sell = suggestSellPrice(p.price)
      inner = `
        <div class="card">
          <div class="head">
            <span class="brand"><span class="dot"></span> LaunchGrid</span>
            <button id="lg-close" aria-label="Close">×</button>
          </div>
          <div class="body">
            ${state.error ? `<div class="err">${esc(state.error)}</div>` : ''}
            <div class="prod">
              ${p.image ? `<img src="${esc(p.image)}" alt="">` : `<div class="ph">📦</div>`}
              <div>
                <div class="t">${esc(p.title)}</div>
                <div class="src">${esc(location.hostname.replace('www.', ''))}</div>
              </div>
            </div>
            <div class="row">
              <div class="field">
                <label>Source price</label>
                <input id="lg-cost" type="number" min="0" inputmode="numeric" value="${cost}" placeholder="—">
              </div>
              <div class="field">
                <label>Your selling price</label>
                <input id="lg-sell" type="number" min="0" inputmode="numeric" value="${sell}" placeholder="e.g. 499">
              </div>
            </div>
            <div class="profit" id="lg-profit"></div>
            <button class="btn" id="lg-add" ${state.adding ? 'disabled' : ''}>
              ${state.adding ? '<span class="spin"></span>Adding…' : `Add to ${esc(state.auth?.store_name || 'my store')}`}
            </button>
            <div class="note">Photos &amp; description import automatically</div>
          </div>
        </div>`
    }

    shadow.getElementById('lg-root').innerHTML = inner
    wire()
  }

  function updateProfit() {
    const out = shadow.getElementById('lg-profit')
    if (!out) return
    const cost = parseFloat(shadow.getElementById('lg-cost')?.value) || 0
    const sell = parseFloat(shadow.getElementById('lg-sell')?.value) || 0
    if (!sell) { out.textContent = ''; return }
    const profit = sell - cost
    out.classList.toggle('neg', profit < 0)
    out.textContent = cost
      ? `Profit per sale: ₹${profit.toLocaleString('en-IN')}`
      : `Selling at ₹${sell.toLocaleString('en-IN')}`
  }

  function wire() {
    const $ = (id) => shadow.getElementById(id)

    $('lg-open')?.addEventListener('click', async () => {
      state.open = true
      render()
      // Lazy auth check on first open
      if (state.auth === null) {
        state.auth = await send({ type: 'GET_AUTH_STATE' }) || { connected: false }
        render()
      }
    })

    $('lg-close')?.addEventListener('click', () => {
      state.open = false
      state.error = null
      render()
    })

    $('lg-connect')?.addEventListener('click', async () => {
      await send({ type: 'OPEN_AUTH' })
      // Poll for the auth to complete while the user logs in on the other tab
      const poll = setInterval(async () => {
        const auth = await send({ type: 'GET_AUTH_STATE' })
        if (auth?.connected) {
          clearInterval(poll)
          state.auth = auth
          render()
        }
      }, 1500)
      setTimeout(() => clearInterval(poll), 120000)
    })

    $('lg-dash')?.addEventListener('click', () => {
      window.open('https://launchgrid.in/dashboard/products', '_blank', 'noopener')
    })

    $('lg-again')?.addEventListener('click', () => {
      state.added = false
      render()
    })

    $('lg-cost')?.addEventListener('input', updateProfit)
    $('lg-sell')?.addEventListener('input', updateProfit)
    updateProfit()

    $('lg-add')?.addEventListener('click', async () => {
      const cost = parseFloat($('lg-cost')?.value) || null
      const sell = parseFloat($('lg-sell')?.value) || null
      if (!sell || sell <= 0) {
        state.error = 'Set your selling price first.'
        render()
        return
      }
      state.adding = true
      state.error = null
      render()

      const result = await send({
        type: 'ADD_PRODUCT',
        data: {
          title: state.product.title,
          description: state.product.description || '',
          retail_price: sell,
          cost_price: cost,
          image_urls: state.product.image ? [state.product.image] : [],
          source_url: location.href.split('?')[0],
        },
      })

      state.adding = false
      if (result?.success) {
        state.added = true
      } else if (result?.code === 'AUTH_REQUIRED') {
        state.auth = { connected: false }
      } else {
        state.error = result?.error || 'Something went wrong. Try again.'
      }
      render()
    })
  }

  function send(message) {
    return new Promise(resolve => {
      try {
        chrome.runtime.sendMessage(message, response => {
          if (chrome.runtime.lastError) resolve(null)
          else resolve(response)
        })
      } catch { resolve(null) }
    })
  }

  function mount(product) {
    state.product = product
    if (host) { render(); return }
    host = document.createElement('div')
    host.id = 'lg-widget-host'
    const sr = host.attachShadow({ mode: 'closed' })
    const style = document.createElement('style')
    style.textContent = CSS
    const root = document.createElement('div')
    root.className = 'root'
    root.id = 'lg-root'
    sr.appendChild(style)
    sr.appendChild(root)
    // ShadowRoot supports getElementById (DocumentFragment interface)
    shadow = { getElementById: (id) => sr.getElementById(id) }
    document.documentElement.appendChild(host)
    render()
  }

  function unmount() {
    if (host) { host.remove(); host = null; shadow = null }
    state.open = false
    state.added = false
    state.error = null
  }

  // ───────────────────────── SPA-aware lifecycle ─────────────────────────
  // Meesho/Flipkart/Myntra are SPAs: re-detect on URL change and late renders.

  let lastUrl = location.href
  let attempts = 0

  function tryDetect() {
    const product = detectProduct()
    if (product && product.title) {
      mount(product)
      return true
    }
    unmount()
    return false
  }

  function scheduleDetection() {
    attempts = 0
    const timer = setInterval(() => {
      attempts++
      if (tryDetect() || attempts >= 8) clearInterval(timer) // retry up to ~8s for late SPA renders
    }, 1000)
    tryDetect()
  }

  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href
      unmount()
      scheduleDetection()
    }
  }, 800)

  scheduleDetection()
})()

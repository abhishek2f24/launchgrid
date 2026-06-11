function isProductPage() {
  const url = window.location.href
  const hostname = window.location.hostname

  if (hostname.includes('amazon.in')) return url.includes('/dp/') || url.includes('/gp/product/')
  if (hostname.includes('flipkart.com')) return url.includes('/p/') || url.includes('pid=')
  if (hostname.includes('meesho.com')) return url.includes('/p/') || url.includes('detail')
  if (hostname.includes('myntra.com')) return true // Myntra product pages often don't have a clear path pattern, just allow on Myntra
  if (hostname.includes('nykaa.com')) return url.includes('/p/') || url.includes('product')
  if (hostname.includes('ajio.com')) return url.includes('/p/') || url.includes('product')
  
  // For generic fallback, we could check if ld+json has Product, but for now let's just show it on any page 
  // where the extension is manually triggered, or just show the FAB everywhere for now.
  // Actually, to avoid clutter, let's just return true for any page since the user has to click the extension icon to trigger the generic fallback, wait no, it injects a FAB.
  // Let's just return true to make sure the user can always see the FAB on the pages they want to import from.
  return true
}

function extractAmazon() {
  const titleEl = document.getElementById('productTitle')
  const title = titleEl?.textContent?.trim() ?? ''

  const whole    = document.querySelector('.a-price-whole')?.textContent?.replace(/[^0-9]/g, '') ?? ''
  const fraction = document.querySelector('.a-price-fraction')?.textContent?.replace(/[^0-9]/g, '') ?? '00'
  const cost_price = whole ? parseFloat(`${whole}.${fraction}`) : null

  const mainImg = document.getElementById('imgTagWrapperId')?.querySelector('img')?.src
  const thumbs  = [...document.querySelectorAll('#altImages .a-button-thumbnail img')]
    .map(img => img.src.replace(/\._[A-Z0-9_,]+_\./, '._SL500_.'))
    .filter(Boolean)
  const images = [...new Set([mainImg, ...thumbs].filter(Boolean))].slice(0, 6)

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

function extractFlipkart() {
  const title = document.querySelector('span.B_NuCI, h1.yhB1nd')?.textContent?.trim() ?? ''
  const priceText = document.querySelector('div._30jeq3, div._16Jk6d')?.textContent ?? ''
  const cost_price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || null
  const imgEls = document.querySelectorAll('div._2r_T1I img, div.CXW8mj img, div._3kidJX img')
  const images = [...imgEls]
    .map(img => img.src)
    .filter(src => src && !src.includes('data:') && src.includes('rukminim'))
    .map(src => src.replace(/\/128\/128\//, '/512/512/').replace(/\/96\/96\//, '/512/512/'))
    .filter((src, i, arr) => arr.indexOf(src) === i)
    .slice(0, 6)
  const descEls = document.querySelectorAll('div._1AN87F li, ._2o-xpa li')
  const description = [...descEls].map(el => el.textContent?.trim()).filter(Boolean).join(' • ')

  return { title, description, cost_price, images, source_url: window.location.href, source_site: 'flipkart.com' }
}

function extractMeesho() {
  const title = document.querySelector('h1')?.textContent?.trim() ?? ''
  const allText = [...document.querySelectorAll('h4, span, p')]
  const priceEl = allText.find(el => /^₹\s*\d/.test(el.textContent?.trim() ?? ''))
  const cost_price = priceEl ? parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) : null
  const images = [...document.querySelectorAll('img')]
    .map(img => img.src)
    .filter(src => src.includes('meesho') && src.includes('product') && !src.includes('icon'))
    .filter((src, i, arr) => arr.indexOf(src) === i)
    .slice(0, 6)
  const description = document.querySelector('div[class*="Description"], div[class*="description"]')?.textContent?.trim() ?? ''

  return { title, description, cost_price, images, source_url: window.location.href, source_site: 'meesho.com' }
}

function extractMyntra() {
  const title = [document.querySelector('h1.pdp-title')?.textContent, document.querySelector('h1.pdp-name')?.textContent].find(Boolean)?.trim() ?? ''
  const priceText = document.querySelector('span.pdp-price strong, div.pdp-price')?.textContent ?? ''
  const cost_price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || null
  const images = [...document.querySelectorAll('div.image-grid-image img, div.pdp-carousel img')]
    .map(img => img.src).filter(src => src && !src.includes('data:')).filter((src, i, arr) => arr.indexOf(src) === i).slice(0, 6)
  const description = document.querySelector('div.pdp-product-description-content p, div.index-sizeFitDesc')?.textContent?.trim() ?? ''

  return { title, description, cost_price, images, source_url: window.location.href, source_site: 'myntra.com' }
}

function extractNykaa() {
  const title = document.querySelector('h1[class*="css-"], h1.product-title')?.textContent?.trim() ?? ''
  const priceText = document.querySelector('span[class*="css-"] span, .price-container span')?.textContent ?? ''
  const cost_price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || null
  const images = [...document.querySelectorAll('div[class*="image"] img, .product-image img')]
    .map(img => img.src).filter(src => src && src.startsWith('http') && !src.includes('icon'))
    .filter((src, i, arr) => arr.indexOf(src) === i).slice(0, 6)

  return { title, description: '', cost_price, images, source_url: window.location.href, source_site: 'nykaa.com' }
}

function extractAjio() {
  const title = document.querySelector('h1.prod-name, .prod-name')?.textContent?.trim() ?? ''
  const priceText = document.querySelector('div.prod-sp, strong.prod-sp')?.textContent ?? ''
  const cost_price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || null
  const images = [...document.querySelectorAll('ul.prod-list li img, .image-carousel img')]
    .map(img => img.src).filter(src => src && src.startsWith('http'))
    .filter((src, i, arr) => arr.indexOf(src) === i).slice(0, 6)

  return { title, description: '', cost_price, images, source_url: window.location.href, source_site: 'ajio.com' }
}

function extractGeneric() {
  const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')]
  let ld = null
  for (const script of scripts) {
    try {
      const json = JSON.parse(script.textContent ?? '')
      const items = Array.isArray(json) ? json : [json]
      for (const item of items) {
        if (item['@type'] === 'Product') { ld = item; break }
        if (item['@graph']) {
          const found = item['@graph'].find(g => g['@type'] === 'Product')
          if (found) { ld = found; break }
        }
      }
    } catch {}
    if (ld) break
  }

  const title = ld?.name || document.querySelector('meta[property="og:title"]')?.getAttribute('content') || document.querySelector('h1')?.textContent?.trim() || document.title || ''
  const description = ld?.description || document.querySelector('meta[property="og:description"]')?.getAttribute('content') || document.querySelector('meta[name="description"]')?.getAttribute('content') || ''
  
  let cost_price = null
  if (ld?.offers) {
    const offer = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers
    cost_price = parseFloat(String(offer?.price ?? '').replace(/[^0-9.]/g, '')) || null
  }
  if (!cost_price) {
    const ogPrice = document.querySelector('meta[property="og:price:amount"]')?.getAttribute('content')
    cost_price = parseFloat((ogPrice ?? '').replace(/[^0-9.]/g, '')) || null
  }

  let images = []
  if (ld?.image) {
    const img = ld.image
    if (typeof img === 'string') images = [img]
    else if (Array.isArray(img)) images = img.map(i => typeof i === 'string' ? i : i.url).filter(Boolean)
    else if (img.url) images = [img.url]
  }
  if (images.length === 0) {
    const ogImg = document.querySelector('meta[property="og:image"]')?.getAttribute('content')
    if (ogImg) images = [ogImg]
  }
  images = images.filter(src => src && src.startsWith('http') && !src.includes('icon') && !src.includes('logo')).slice(0, 6)

  return { title: title.replace(/\s*[|—–-]\s*\S.*$/, '').trim(), description: description.slice(0, 500), cost_price, images, source_url: window.location.href, source_site: window.location.hostname.replace(/^www\./, '') }
}

function extractProductData() {
  const host = window.location.hostname
  if (host.includes('amazon.in')) return extractAmazon()
  if (host.includes('flipkart.com')) return extractFlipkart()
  if (host.includes('meesho.com')) return extractMeesho()
  if (host.includes('myntra.com')) return extractMyntra()
  if (host.includes('nykaa.com')) return extractNykaa()
  if (host.includes('ajio.com')) return extractAjio()
  
  return extractGeneric()
}

// Ensure we only inject once
if (!document.getElementById('lg-extension-root')) {
  initExtension();
}

function initExtension() {
  if (!isProductPage()) return;

  const root = document.createElement('div')
  root.id = 'lg-extension-root'
  document.body.appendChild(root)

  const shadow = root.attachShadow({ mode: 'open' })
  
  // Fetch CSS file contents and inject as a style block so it applies within shadow DOM
  const styleLink = document.createElement('link')
  styleLink.setAttribute('rel', 'stylesheet')
  styleLink.setAttribute('href', chrome.runtime.getURL('content.css'))
  shadow.appendChild(styleLink)

  const container = document.createElement('div')
  container.innerHTML = `
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
          <a id="lg-dashboard-link" href="http://localhost:3000/dashboard/products" target="_blank" class="lg-btn-secondary">
            View in Dashboard →
          </a>
          <button id="lg-add-another" class="lg-btn-primary">Add Another</button>
        </div>
      </div>
    </div>
  `
  shadow.appendChild(container)

  let currentProductData = null;

  // Panel interaction logic
  const fab     = shadow.getElementById('lg-fab')
  const panel   = shadow.getElementById('lg-panel')
  const closeBtn = shadow.getElementById('lg-close-btn')
  const submitBtn = shadow.getElementById('lg-submit')
  const retailInput = shadow.getElementById('lg-retail')
  const costInput   = shadow.getElementById('lg-cost')
  const marginDiv   = shadow.getElementById('lg-margin')
  const connectBtn  = shadow.getElementById('lg-connect-btn')

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

  connectBtn.addEventListener('click', async () => {
    // Attempt to open the auth window using dynamic backend URL
    const { lg_backend_url } = await chrome.storage.local.get('lg_backend_url')
    const baseUrl = lg_backend_url || 'http://localhost:3000'
    window.open(`${baseUrl}/dashboard/extension-auth?ext_id=${chrome.runtime.id}`, '_blank')
  })

  shadow.getElementById('lg-add-another').addEventListener('click', () => {
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
      if (response && response.success) {
        shadow.getElementById('lg-success-title').textContent = `"${title}" added!`
        showState('success')
      } else {
        submitBtn.disabled = false
        submitBtn.textContent = 'Add to My Store'
        shadow.getElementById('lg-save-error').textContent = response?.error || 'Something went wrong'
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
    shadow.getElementById('lg-save-error').classList.add('hidden')

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
}

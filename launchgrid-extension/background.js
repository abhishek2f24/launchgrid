// background.js

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
  const { lg_token, lg_backend_url } = await chrome.storage.local.get(['lg_token', 'lg_backend_url'])
  const baseUrl = lg_backend_url || 'http://localhost:3000'

  if (!lg_token) {
    return { success: false, error: 'Not authenticated', code: 'AUTH_REQUIRED' }
  }

  try {
    const res = await fetch(`${baseUrl}/api/products/add`, {
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
  const data = await chrome.storage.local.get(['lg_token', 'lg_store_name', 'lg_subdomain', 'lg_backend_url'])
  if (!data.lg_token) return { connected: false }

  const baseUrl = data.lg_backend_url || 'http://localhost:3000'

  // Optionally validate token with a quick API call
  try {
    const res = await fetch(`${baseUrl}/api/extension/whoami`, {
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

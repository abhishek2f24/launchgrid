// LaunchGrid extension — service worker
// Message contract (unchanged from v1, so existing tokens keep working):
//   ADD_PRODUCT    {data}  -> { success, product? , error?, code? }
//   GET_AUTH_STATE         -> { connected, store_name?, subdomain?, product_count? }
//   DISCONNECT             -> { success }
//   OPEN_AUTH              -> opens the dashboard auth page in a new tab

const DEFAULT_BACKEND = 'https://launchgrid.in'

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ADD_PRODUCT') {
    handleAddProduct(message.data).then(sendResponse)
    return true // async
  }
  if (message.type === 'GET_AUTH_STATE') {
    getAuthState().then(sendResponse)
    return true
  }
  if (message.type === 'DISCONNECT') {
    chrome.storage.local
      .remove(['lg_token', 'lg_subdomain', 'lg_store_name', 'lg_connected_at'])
      .then(() => sendResponse({ success: true }))
    return true
  }
  if (message.type === 'OPEN_AUTH') {
    openAuth().then(sendResponse)
    return true
  }
})

async function getBackend() {
  const { lg_backend_url } = await chrome.storage.local.get(['lg_backend_url'])
  return lg_backend_url || DEFAULT_BACKEND
}

async function openAuth() {
  const baseUrl = await getBackend()
  const url = `${baseUrl}/dashboard/extension-auth?ext_id=${chrome.runtime.id}`
  await chrome.tabs.create({ url })
  return { success: true }
}

async function handleAddProduct(data) {
  const { lg_token } = await chrome.storage.local.get(['lg_token'])
  const baseUrl = await getBackend()

  if (!lg_token) {
    return { success: false, error: 'Not connected to your store', code: 'AUTH_REQUIRED' }
  }

  try {
    const res = await fetch(`${baseUrl}/api/products/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lg_token}`,
      },
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        retail_price: data.retail_price,
        cost_price: data.cost_price,
        image_urls: data.image_urls,
        source_url: data.source_url,
      }),
    })

    if (res.status === 401) {
      await chrome.storage.local.remove(['lg_token'])
      return { success: false, error: 'Session expired — reconnect your store', code: 'AUTH_REQUIRED' }
    }

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      return { success: false, error: json.error || `Server error (${res.status})` }
    }

    // Track recent adds for the popup
    const { lg_recent = [] } = await chrome.storage.local.get(['lg_recent'])
    lg_recent.unshift({ title: data.title, price: data.retail_price, at: Date.now() })
    await chrome.storage.local.set({ lg_recent: lg_recent.slice(0, 5) })

    return { success: true, product: json.product }
  } catch {
    return { success: false, error: 'Network error — is your store reachable?' }
  }
}

async function getAuthState() {
  const data = await chrome.storage.local.get(['lg_token', 'lg_store_name', 'lg_subdomain'])
  if (!data.lg_token) return { connected: false }

  const baseUrl = await getBackend()

  try {
    const res = await fetch(`${baseUrl}/api/extension/whoami`, {
      headers: { 'Authorization': `Bearer ${data.lg_token}` },
    })
    if (res.status === 401 || res.status === 404) {
      await chrome.storage.local.remove(['lg_token'])
      return { connected: false, reason: 'expired' }
    }
    if (!res.ok) {
      // Server hiccup — trust cached identity rather than logging the user out
      return { connected: true, store_name: data.lg_store_name, subdomain: data.lg_subdomain, stale: true }
    }
    const json = await res.json()
    await chrome.storage.local.set({ lg_store_name: json.store_name, lg_subdomain: json.subdomain })
    return { connected: true, store_name: json.store_name, subdomain: json.subdomain, product_count: json.product_count }
  } catch {
    // Offline — keep cached state
    return { connected: true, store_name: data.lg_store_name, subdomain: data.lg_subdomain, stale: true }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Auto-detect backend URL from active tab if possible
  let backendUrl = 'http://localhost:3000'
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (activeTab && activeTab.url) {
      const urlObj = new URL(activeTab.url)
      if (urlObj.hostname === 'localhost' || urlObj.hostname.endsWith('launchgrid.in')) {
        backendUrl = `${urlObj.protocol}//${urlObj.host}`
        await chrome.storage.local.set({ lg_backend_url: backendUrl })
      }
    }
  } catch (err) {
    console.error('Failed to detect active tab URL:', err)
  }

  // 2. Fetch stored backend URL (fallback to detected URL)
  const stored = await chrome.storage.local.get('lg_backend_url')
  const finalBackendUrl = stored.lg_backend_url || backendUrl

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
      document.getElementById('dashboard-link').href = `${finalBackendUrl}/dashboard`
    }
  })

  // Connect button
  const connectBtn = document.getElementById('connect-btn');
  if (connectBtn) {
    connectBtn.addEventListener('click', () => {
      const extId = chrome.runtime.id
      chrome.tabs.create({
        url: `${finalBackendUrl}/dashboard/extension-auth?ext_id=${extId}`
      })
      window.close()
    })
  }

  // Disconnect button
  const disconnectBtn = document.getElementById('disconnect-btn');
  if (disconnectBtn) {
    disconnectBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'DISCONNECT' }, () => {
        location.reload()
      })
    })
  }
})

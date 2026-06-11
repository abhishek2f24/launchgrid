const hash = new URLSearchParams(window.location.hash.slice(1))
const token = hash.get('token')
const store = hash.get('store')
const name  = hash.get('name')
const backendUrl = hash.get('backend_url')

if (token) {
  chrome.storage.local.set({
    lg_token:        token,
    lg_subdomain:    store,
    lg_store_name:   name,
    lg_backend_url:  backendUrl || 'http://localhost:3000',
    lg_connected_at: Date.now(),
  }, () => {
    // Show success message in this page, then close tab
    document.getElementById('status').textContent = 'Connected Successfully!'
    document.getElementById('sub-status').textContent = 'You can now safely close this tab and use the extension.'
    setTimeout(() => window.close(), 3000)
  })
} else {
  document.getElementById('status').textContent = 'Connection Failed'
  document.getElementById('sub-status').textContent = 'Could not find a valid token. Please try again.'
}

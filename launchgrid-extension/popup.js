function send(message) {
  return new Promise(resolve => {
    chrome.runtime.sendMessage(message, response => {
      if (chrome.runtime.lastError) resolve(null)
      else resolve(response)
    })
  })
}

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

async function render() {
  const content = document.getElementById('content')
  const auth = await send({ type: 'GET_AUTH_STATE' })

  if (!auth || !auth.connected) {
    content.innerHTML = `
      <p class="hint">Connect this extension to your LaunchGrid store, then visit any product on Amazon, Flipkart or Meesho — an <b>"Add to my store"</b> button appears on the page.</p>
      <button class="btn orange" id="connect">Connect my store</button>
      <div class="tip">No store yet? Create one free at <b>launchgrid.in</b> — it takes 15 minutes.</div>
    `
    document.getElementById('connect').addEventListener('click', async () => {
      await send({ type: 'OPEN_AUTH' })
      window.close()
    })
    return
  }

  const { lg_recent = [] } = await chrome.storage.local.get(['lg_recent'])
  const recentHtml = lg_recent.length
    ? `<div class="recent">
        <div class="label">Recently added</div>
        ${lg_recent.map(r => `<div class="item"><span class="t">${esc(r.title)}</span><span class="p">₹${Number(r.price).toLocaleString('en-IN')}</span></div>`).join('')}
      </div>`
    : ''

  content.innerHTML = `
    <div class="store">
      <div class="name">${esc(auth.store_name || 'Your store')}</div>
      <div class="sub">${esc(auth.subdomain || '')}.launchgrid.in</div>
      ${typeof auth.product_count === 'number' ? `<div class="count">${auth.product_count} products in catalog</div>` : ''}
    </div>
    ${recentHtml}
    <a class="btn" href="https://launchgrid.in/dashboard/products" target="_blank" rel="noopener">Open dashboard</a>
    <button class="btn ghost" id="disconnect">Disconnect</button>
    <div class="tip">Browse any product page — the LaunchGrid button appears top-right. One click adds it to your catalog with your margin.</div>
  `
  document.getElementById('disconnect').addEventListener('click', async () => {
    await send({ type: 'DISCONNECT' })
    render()
  })
}

document.addEventListener('DOMContentLoaded', render)

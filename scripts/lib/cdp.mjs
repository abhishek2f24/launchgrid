// Minimal Chrome DevTools Protocol driver.
//
// WHY NOT PLAYWRIGHT/PUPPETEER: neither is installed, and both pull a ~150MB browser
// download. Chrome is already on this machine and speaks CDP natively, and Node >= 22 ships
// a global WebSocket — so the whole driver is a few dozen lines and ZERO new dependencies.
//
// WHY A REAL BROWSER AT ALL: supplier sites (Alibaba, IndiaMART, Made-in-China) bot-block
// datacentre traffic. A plain server-side GET of an IndiaMART search page returns a ~24KB
// anti-bot shell containing none of the product markup. Real DOM only exists in a real
// browser, so extraction has to run there.
//
// COST NOTE: everything here is deterministic. Selectors are known up front, so scraping N
// products costs the same whether N is 10 or 10,000 — no model involvement per product.

import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launchChrome({ port = 9222, headless = true } = {}) {
  // A throwaway profile keeps this out of the user's real Chrome session/cookies.
  const userDataDir = mkdtempSync(join(tmpdir(), 'lg-cdp-'));
  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-extensions',
    // Supplier sites fingerprint automation; a normal UA + disabling the automation flag
    // gets us the ordinary page rather than a challenge shell.
    '--disable-blink-features=AutomationControlled',
    '--window-size=1440,900',
  ];
  if (headless) args.push('--headless=new');

  const proc = spawn(CHROME, args, { stdio: 'ignore', detached: false });

  // Wait for the debugging endpoint to come up.
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) return { proc, port, userDataDir };
    } catch { /* not up yet */ }
    await sleep(250);
  }
  proc.kill();
  throw new Error('Chrome did not expose a CDP endpoint in time');
}

/** One CDP-attached tab. Deliberately tiny: navigate, wait, evaluate, close. */
export class Tab {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      const p = this.pending.get(msg.id);
      if (p) {
        this.pending.delete(msg.id);
        msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
      }
    });
  }

  static async open(port) {
    const res = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
    const target = await res.json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });
    const tab = new Tab(ws);
    tab.targetId = target.id;
    tab.port = port;
    return tab;
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }
      }, 45_000);
    });
  }

  async goto(url, { waitMs = 3500 } = {}) {
    await this.send('Page.enable');
    await this.send('Page.navigate', { url });
    // Supplier pages hydrate late; a fixed settle beats racing load events on SPA shells.
    await sleep(waitMs);
  }

  /** Runs a function in the PAGE context and returns its JSON result. */
  async evaluate(fn, ...args) {
    const expression = `(${fn.toString()})(${args.map((a) => JSON.stringify(a)).join(',')})`;
    const { result, exceptionDetails } = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (exceptionDetails) throw new Error(exceptionDetails.text || 'page evaluate failed');
    return result.value;
  }

  async close() {
    try { await fetch(`http://127.0.0.1:${this.port}/json/close/${this.targetId}`); } catch { /* already gone */ }
    try { this.ws.close(); } catch { /* already closed */ }
  }
}

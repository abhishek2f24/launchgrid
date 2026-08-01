/* =============================================================================
 * IndiaMART supplier harvester — paste into the console of a logged-in
 * https://dir.indiamart.com tab.
 *
 * WHY IT RUNS IN THE BROWSER
 *   IndiaMART serves automated clients (fetch + DOMParser, headless Chrome over
 *   CDP) a ~1–24KB shell with no listings. A real logged-in tab gets the real
 *   markup, and a same-origin iframe inside that tab executes the site's JS, so
 *   the cards actually hydrate. That is the only path that yields real data.
 *
 * WHY IT IS SLOW ON PURPOSE
 *   A run at ~3 concurrent queries harvested ~140 suppliers and then earned an
 *   HTTP 429 that persisted long enough to kill the tab. DELAY_MS below is the
 *   whole point of this file — do not lower it to "speed things up". On a 429
 *   the run stops itself and reports, rather than hammering into a longer ban.
 *
 * NO TOKEN COST
 *   Selectors are known, so extraction is deterministic. Harvesting 300 products
 *   costs the same as harvesting 1 — only wall time.
 *
 * USAGE
 *   1. node scripts/export-research-queue.mjs --limit=25   (writes /tmp/queue-remaining.json)
 *   2. Paste its printed array into QUERIES below, paste this whole file into the tab.
 *   3. When it finishes it downloads rows.txt.
 *   4. node scripts/ingest-harvested.mjs ~/Downloads/rows.txt /tmp/queue-remaining.json
 * ========================================================================== */

const QUERIES = [
  // <-- paste the array printed by export-research-queue.mjs here
];

const DELAY_MS = 20000;   // between queries. IndiaMART 429s well before this is "too slow".
const SETTLE_MS = 9000;   // time for the iframe's client-side render to populate cards
const MAX_PER_IDEA = 3;   // three suppliers is enough to compare sourcing routes

const state = (window.__hstate = { done: 0, total: QUERIES.length, results: [], stopped: null });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Extraction rules — these encode bugs already found and fixed, do not relax:
 *  - Currency is NEVER guessed. IndiaMART quotes INR and the ₹ symbol is read off
 *    the card. Defaulting a foreign platform to INR once understated landed cost ~83x.
 *  - NO evidence booleans are emitted. "TrustSEAL" is marketing, not a factory audit.
 *    Emitting nothing leaves those columns NULL ("unknown") instead of false
 *    ("we checked and it is absent") — the latter is a stronger, wrong claim.
 *  - MOQ is left blank when absent. Search cards rarely expose it, and an invented
 *    MOQ flows straight into budget-fit scoring and the recommended first order. */
function extract(doc) {
  const out = [];
  for (const card of doc.querySelectorAll('article.im-lc-card')) {
    const blob = (card.textContent || '').replace(/\s+/g, ' ').trim();
    const name = (card.querySelector('a.im-lc-seller-name')?.textContent || '').trim();
    if (!name) continue;

    const price = blob.match(/₹\s*([\d,]+(?:\.\d+)?)/);
    if (!price) continue;
    const unitPrice = parseFloat(price[1].replace(/,/g, ''));
    if (!(unitPrice > 0)) continue;

    const moqM = blob.match(/(?:Min(?:imum)?\.?\s*Order[^\d]{0,15})([\d,]+)/i);
    const moq = moqM ? parseInt(moqM[1].replace(/,/g, ''), 10) : null;

    const loc = (card.textContent || '').match(/\n([A-Za-z .]+) · (\d+) yrs/);

    out.push({
      supplierName: name,
      unitPrice,
      currency: 'INR',
      // A real price ladder never starts at qty 1–2; that means a stray number was grabbed.
      moq: moq && moq >= 3 ? moq : null,
      city: loc ? loc[1].trim() : null,
      yearsInBusiness: loc ? Number(loc[2]) : null,
    });
    if (out.length >= MAX_PER_IDEA) break;
  }
  return out;
}

async function harvestOne(q) {
  const f = document.createElement('iframe');
  f.style.cssText = 'width:1200px;height:900px;position:fixed;left:-9999px;top:0';
  f.src = 'https://dir.indiamart.com/search.mp?ss=' + encodeURIComponent(q);
  document.body.appendChild(f);
  try {
    await sleep(SETTLE_MS);
    const d = f.contentDocument;
    if (!d) return { q, ok: false, suppliers: [], error: 'no document' };
    if (/^429/.test(d.title)) return { q, ok: false, suppliers: [], error: '429' };
    const suppliers = extract(d);
    return { q, ok: suppliers.length > 0, suppliers };
  } catch (e) {
    return { q, ok: false, suppliers: [], error: String(e) };
  } finally {
    f.remove();
  }
}

/* Results are stored at their QUERIES index, never pushed in completion order —
 * position IS the join key back to the batch file, so a reordering here would
 * silently attribute every supplier to the wrong product. */
window.__run = async function run() {
  for (let i = 0; i < QUERIES.length; i++) {
    const r = await harvestOne(QUERIES[i]);
    state.results[i] = r;
    state.done = i + 1;

    if (r.error === '429') {
      state.stopped = `rate-limited at index ${i} (${QUERIES[i]}) — wait a few hours and re-run export-research-queue.mjs`;
      console.warn('STOPPED:', state.stopped);
      break;
    }
    console.log(`[${i + 1}/${QUERIES.length}] ${QUERIES[i]} → ${r.suppliers.length}`);
    if (i < QUERIES.length - 1) await sleep(DELAY_MS);
  }
  window.__download();
  console.log('done', state.stopped || '');
};

window.__encode = function () {
  const out = [];
  state.results.forEach((r, i) => {
    if (!r || !r.ok) return;
    r.suppliers.forEach((s) => {
      out.push([i, s.supplierName.replace(/[|~]/g, ' '), s.unitPrice, s.moq || '',
        (s.city || '').replace(/[|~]/g, ' '), s.yearsInBusiness || ''].join('|'));
    });
  });
  return out.join('~');
};

window.__download = function () {
  const blob = new Blob([window.__encode()], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'rows.txt';
  a.click();
};

console.log(`Harvester ready — ${QUERIES.length} queries, ~${Math.round((QUERIES.length * (DELAY_MS + SETTLE_MS)) / 60000)} min. Run: __run()`);

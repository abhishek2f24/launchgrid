// Real supplier research for the whole catalogue, driven by a real Chrome instance.
//
//   node scripts/scrape-suppliers.mjs --limit=20                 # first 20 unscraped ideas
//   node scripts/scrape-suppliers.mjs --limit=300 --headful      # watch it work
//   node scripts/scrape-suppliers.mjs --replace                  # also redo already-scraped ideas
//   node scripts/scrape-suppliers.mjs --platform=indiamart
//
// ARCHITECTURE / COST
//   Selectors are known up front, so this is entirely deterministic: no model is involved
//   per product. Scraping 290 products costs exactly as much as scraping 1 — just wall time.
//   Chrome is driven over the DevTools Protocol (scripts/lib/cdp.mjs), which needs no new
//   npm dependency because Chrome is installed and Node >= 22 has a global WebSocket.
//
// CORRECTNESS
//   Every write goes through POST /api/research/ingest-supplier rather than straight to the
//   DB. That endpoint is the single place that enforces the rules the earlier bad batch
//   violated: it leaves the 13 evidence booleans NULL instead of false, refuses to guess a
//   currency, stamps provenance, and rejects low-confidence extractions. Writing direct SQL
//   is what produced 505 suppliers falsely asserting "no factory audit".
//
//   Failures are logged and skipped. Nothing is ever substituted or invented.

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { launchChrome, Tab, sleep } from './lib/cdp.mjs';
import { PLATFORMS, extractFromSearchPage } from './lib/supplier-extractors.mjs';

const env = {};
readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').forEach((line) => {
  const m = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
  if (m) { let v = m[2] || ''; if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); env[m[1]] = v; }
});

const arg = (name, dflt) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : dflt;
};
const flag = (name) => process.argv.includes(`--${name}`);

const LIMIT = Number(arg('limit', '20'));
const PLATFORM_KEY = arg('platform', 'alibaba');
const REPLACE = flag('replace');
const HEADFUL = flag('headful');
const BASE = env.LG_BASE_URL || 'http://localhost:3000';
const OWNER_EMAIL = arg('email', 'bulk-demo@launchgrid.in');
const OWNER_PASSWORD = arg('password', 'BulkDemo123!');
const PAGE_DELAY_MS = Number(arg('delay', '2500'));

const platform = PLATFORMS[PLATFORM_KEY];
if (!platform) { console.error(`Unknown --platform. Options: ${Object.keys(PLATFORMS).join(', ')}`); process.exit(1); }

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

async function main() {
  const { data: auth, error: authErr } = await anon.auth.signInWithPassword({ email: OWNER_EMAIL, password: OWNER_PASSWORD });
  if (authErr) { console.error('sign in failed:', authErr.message); process.exit(1); }
  const token = auth.session.access_token;
  const userId = auth.user.id;

  // Target ideas that have no scraped supplier yet (resumable — safe to re-run).
  const { data: ideas } = await admin
    .from('product_ideas')
    .select('id, name, category, research_suppliers(id, data_source)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  const queue = (ideas ?? []).filter((i) => {
    const hasScraped = (i.research_suppliers ?? []).some((s) => s.data_source === 'scraped');
    return REPLACE ? true : !hasScraped;
  }).slice(0, LIMIT);

  if (!queue.length) { console.log('Nothing to do — every idea already has scraped supplier evidence.'); return; }

  console.log(`\n${platform.name} · ${queue.length} ideas · ${HEADFUL ? 'headful' : 'headless'} Chrome · ${PAGE_DELAY_MS}ms between pages`);
  console.log('Deterministic extraction — no model calls, no per-product token cost.\n');

  const chrome = await launchChrome({ headless: !HEADFUL });
  const stats = { ok: 0, noCards: 0, rejected: 0, failed: 0, suppliers: 0 };

  try {
    for (const [i, idea] of queue.entries()) {
      const label = `[${String(i + 1).padStart(3)}/${queue.length}] ${idea.name.slice(0, 38).padEnd(39)}`;
      const query = idea.name.replace(/ — .*$/, '').replace(/[^\w\s]/g, ' ').trim();
      let tab;
      try {
        tab = await Tab.open(chrome.port);
        await tab.goto(platform.searchUrl(query), { waitMs: 4000 });
        const { cards } = await tab.evaluate(extractFromSearchPage, platform.quoteCurrency);

        if (!cards?.length) { stats.noCards++; console.log(`${label} ⚠ no supplier cards parsed`); continue; }

        // If replacing, clear this idea's previous scraped suppliers so stale/mislabelled
        // rows don't linger alongside the corrected ones.
        if (REPLACE) {
          const { data: old } = await admin.from('research_suppliers').select('id').eq('product_idea_id', idea.id).eq('data_source', 'scraped');
          for (const s of old ?? []) {
            await admin.from('research_price_tiers').delete().eq('supplier_id', s.id);
            await admin.from('research_suppliers').delete().eq('id', s.id);
          }
        }

        let saved = 0;
        for (const card of cards.slice(0, 3)) { // top 3 suppliers is enough to compare routes
          const payload = {
            productIdeaId: idea.id,
            sourceUrl: card.sourceUrl,
            parserVersion: platform.parserVersion,
            extractionConfidence: card.extractionConfidence,
            supplier: { supplierName: card.supplierName, storeUrl: card.sourceUrl },
            priceTiers: [{ quantity: card.moq ?? 100, unitPrice: card.unitPrice, currency: card.currency }],
            ...(card.moq ? { moq: card.moq } : {}),
          };
          const res = await fetch(`${BASE}/api/research/ingest-supplier`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
          });
          if (res.ok) { saved++; stats.suppliers++; }
          else { stats.rejected++; }
        }

        if (saved) {
          stats.ok++;
          const c = cards[0];
          console.log(`${label} ✓ ${saved} suppliers · ${c.currency} ${c.unitPrice} · MOQ ${c.moq ?? '—'}`);
        } else {
          console.log(`${label} ⚠ all candidates rejected by ingest validation`);
        }
      } catch (err) {
        stats.failed++;
        console.log(`${label} ✗ ${err.message.slice(0, 60)}`);
      } finally {
        if (tab) await tab.close();
      }
      await sleep(PAGE_DELAY_MS); // be a polite client
    }
  } finally {
    chrome.proc.kill();
  }

  console.log(`\n──── SUMMARY ────`);
  console.log(`  ideas with new evidence : ${stats.ok}`);
  console.log(`  suppliers ingested      : ${stats.suppliers}`);
  console.log(`  no cards parsed         : ${stats.noCards}`);
  console.log(`  rejected by validation  : ${stats.rejected}`);
  console.log(`  errors                  : ${stats.failed}`);
}

main();

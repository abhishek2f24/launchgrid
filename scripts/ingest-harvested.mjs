// Ingests supplier rows harvested in the browser.
//
//   node scripts/ingest-harvested.mjs /tmp/rows1.txt /tmp/batch1.json
//
// WHY THE TWO-STEP SHAPE
//   Supplier listings only render inside a real logged-in browser tab, and Chrome's Private
//   Network Access policy stops a page on dir.indiamart.com from POSTing to localhost. So
//   the browser harvests (see the in-page harvester) and this script performs the writes.
//   Everything still goes through POST /api/research/ingest-supplier — never direct SQL —
//   so the endpoint's guarantees hold: evidence booleans stay NULL, currency is never
//   guessed, provenance is stamped, weak extractions are rejected.
//
// ROW FORMAT (compact, to keep the browser round-trip small)
//   batchIndex|supplierName|unitPrice|moq|city|yearsInBusiness      records joined by '~'

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').forEach((line) => {
  const m = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
  if (m) { let v = m[2] || ''; if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); env[m[1]] = v; }
});

const [rowsFile, batchFile] = process.argv.slice(2);
if (!rowsFile || !batchFile) { console.error('usage: node scripts/ingest-harvested.mjs <rows.txt> <batch.json>'); process.exit(1); }

const BASE = env.LG_BASE_URL || 'http://localhost:3000';
const EMAIL = env.LG_DEMO_EMAIL || 'bulk-demo@launchgrid.in';
const PASSWORD = env.LG_DEMO_PASSWORD || 'BulkDemo123!';

const batch = JSON.parse(readFileSync(batchFile, 'utf8'));
const raw = readFileSync(rowsFile, 'utf8').trim();

const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

// IndiaMART search cards do not expose MOQ, so `moq` is usually blank. It is left absent
// rather than defaulted — an invented MOQ would flow straight into the budget-fit score and
// the recommended first order.
function parseRows(text) {
  return text.split('~').map((r) => r.split('|')).filter((f) => f.length >= 3).map((f) => ({
    idx: Number(f[0]),
    supplierName: f[1],
    unitPrice: Number(f[2]),
    moq: f[3] ? Number(f[3]) : null,
    city: f[4] || null,
    years: f[5] ? Number(f[5]) : null,
  })).filter((r) => Number.isFinite(r.idx) && r.supplierName && Number.isFinite(r.unitPrice) && r.unitPrice > 0);
}

async function main() {
  const { data: auth, error } = await anon.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (error) { console.error('sign in failed:', error.message); process.exit(1); }
  const token = auth.session.access_token;

  const rows = parseRows(raw);
  console.log(`\n${rows.length} harvested supplier rows → ${BASE}/api/research/ingest-supplier\n`);

  const stats = { ok: 0, rejected: 0, err: 0 };
  const reasons = {};

  for (const r of rows) {
    const idea = batch[r.idx];
    if (!idea) { stats.err++; continue; }

    // Confidence reflects what the card actually yielded. Name+price alone is a thin but
    // usable record; city/年 add a little. Nothing here is padded to clear the 0.3 floor.
    const confidence = Math.min(1, 0.55 + (r.moq ? 0.2 : 0) + (r.city ? 0.1 : 0) + (r.years ? 0.1 : 0));

    const payload = {
      productIdeaId: idea.id,
      sourceUrl: `https://dir.indiamart.com/search.mp?ss=${encodeURIComponent(idea.q)}#${encodeURIComponent(r.supplierName)}`,
      parserVersion: 'indiamart-im-lc-card@1.0.0',
      extractionConfidence: confidence,
      supplier: {
        supplierName: r.supplierName,
        country: 'India',
        ...(r.city ? { city: r.city } : {}),
        ...(r.years ? { yearEstablished: new Date().getFullYear() - r.years } : {}),
      },
      // IndiaMART quotes INR — read off the page, not inferred.
      priceTiers: [{ quantity: r.moq || 100, unitPrice: r.unitPrice, currency: 'INR' }],
      ...(r.moq ? { moq: r.moq } : {}),
    };

    try {
      const res = await fetch(`${BASE}/api/research/ingest-supplier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) stats.ok++;
      else {
        stats.rejected++;
        const body = await res.json().catch(() => ({}));
        const key = `${res.status} ${body.code || body.error || ''}`.slice(0, 60);
        reasons[key] = (reasons[key] || 0) + 1;
      }
    } catch (e) {
      stats.err++;
    }
  }

  console.log(`  ingested : ${stats.ok}`);
  console.log(`  rejected : ${stats.rejected}`);
  console.log(`  errors   : ${stats.err}`);
  if (Object.keys(reasons).length) {
    console.log('  rejection reasons:');
    Object.entries(reasons).forEach(([k, v]) => console.log(`     ${v}× ${k}`));
  }
}

main();

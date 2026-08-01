// Proves the Phase 0 evidence store enforces its contract at the DATABASE level.
//
//   node scripts/verify-evidence-store.mjs
//
// WHY THIS EXISTS SEPARATELY FROM claim.test.ts
//   The TypeScript constructors make a fabricated claim unrepresentable, but nothing
//   stops a future service, a migration script, or another AI from writing straight to
//   the table. The CHECK constraint is the layer that cannot be bypassed, and it is the
//   one that actually protects the merchant. Verify it directly.

import { readFileSync } from 'node:fs';
import { randomUUID, createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const env = {};
readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').forEach((line) => {
  const m = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
  if (m) { let v = m[2] || ''; if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); env[m[1]] = v; }
});

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

const SUBJECT = randomUUID();
const body = '<html>fixture</html>';
const hash = createHash('sha256').update(body + SUBJECT).digest('hex');

console.log('\nEvidence store contract\n');

// ---- raw captures ----------------------------------------------------------
const { data: capture, error: capErr } = await admin
  .from('raw_captures')
  .insert({
    source: 'fixture', url: 'https://example.test/p',
    request: { q: 'yoga mat' }, body_hash: hash,
    storage_key: `fixture/${hash}`, byte_size: body.length,
    status: 200, cost_paise: 250,
  })
  .select('id').single();
check('raw capture archived with its cost', !capErr && !!capture, capErr?.message);

// Same body twice must not create a second archive row.
const { error: dupErr } = await admin.from('raw_captures').insert({
  source: 'fixture', body_hash: hash, storage_key: 'x',
});
check('identical capture deduplicated by content hash', !!dupErr, dupErr?.code);

// ---- evidence --------------------------------------------------------------
const { data: e1, error: e1Err } = await admin.from('evidence').insert({
  subject_type: 'product', subject_id: SUBJECT, predicate: 'unit_price',
  value: 599, unit: 'INR', capture_id: capture.id,
  method: 'parsed', parser_version: 'fixture@1.0.0',
  confidence: 0.8, ttl_days: 30,
}).select('id').single();
check('evidence recorded against a concrete subject', !e1Err && !!e1, e1Err?.message);

// A parsed observation with no parser version cannot be re-validated later.
const { error: noParserErr } = await admin.from('evidence').insert({
  subject_type: 'product', subject_id: SUBJECT, predicate: 'unit_price',
  value: 599, method: 'parsed', confidence: 0.8, ttl_days: 30,
});
check('parsed evidence must name its parser', !!noParserErr, noParserErr?.code);

const { error: badConfErr } = await admin.from('evidence').insert({
  subject_type: 'product', subject_id: SUBJECT, predicate: 'unit_price',
  value: 599, method: 'api', confidence: 1.7, ttl_days: 30,
});
check('confidence constrained to 0..1', !!badConfErr, badConfErr?.code);

// Corrections supersede; the original survives for audit.
const { data: e2 } = await admin.from('evidence').insert({
  subject_type: 'product', subject_id: SUBJECT, predicate: 'unit_price',
  value: 649, unit: 'INR', method: 'api', confidence: 0.95, ttl_days: 30,
}).select('id').single();
await admin.from('evidence').update({ superseded_by: e2.id }).eq('id', e1.id);

const { data: history } = await admin.from('evidence')
  .select('id, value, superseded_by').eq('subject_id', SUBJECT);
check('corrections append, never overwrite', (history ?? []).length === 2,
  `${history?.length} observations retained`);
check('price history preserved as two facts',
  new Set((history ?? []).map((h) => JSON.stringify(h.value))).size === 2);

// ---- THE COVERAGE CONTRACT -------------------------------------------------
// This is the defect the V2 audit found, made impossible in the database.
const { error: fabricatedErr } = await admin.from('claim_snapshots').insert({
  subject_type: 'product', subject_id: SUBJECT, predicate: 'demand',
  value: 78,                 // a confident-looking number...
  confidence: 0.9,
  coverage: 0,               // ...backed by nothing
  evidence_ids: [],
  derived_by: 'demand@1.0.0',
});
check('DB REFUSES a valued claim citing no evidence', !!fabricatedErr,
  fabricatedErr ? 'blocked by valued_claim_requires_evidence' : 'ACCEPTED — CONTRACT BROKEN');

// "Unknown" is the only legal way to express absent data.
const { error: unknownErr } = await admin.from('claim_snapshots').insert({
  subject_type: 'product', subject_id: SUBJECT, predicate: 'demand',
  value: null, confidence: 0, coverage: 0, evidence_ids: [],
  derived_by: 'demand@1.0.0',
});
check('unknown claims are legal and carry no value', !unknownErr, unknownErr?.message);

const { error: validErr } = await admin.from('claim_snapshots').insert({
  subject_type: 'product', subject_id: SUBJECT, predicate: 'unit_price',
  value: 649, unit: 'INR', confidence: 0.82, coverage: 1,
  evidence_ids: [e1.id, e2.id], derived_by: 'price@1.0.0',
});
check('evidence-backed claims are accepted', !validErr, validErr?.message);

// ---- isolation -------------------------------------------------------------
// Evidence is shared infrastructure — the same observation serves every customer,
// which is what makes the cache the business model. No client may touch it.
const { data: clientRead } = await anon.from('evidence').select('id').limit(1);
check('clients cannot read the evidence store', (clientRead ?? []).length === 0,
  `${clientRead?.length ?? 0} rows visible to anon`);

const { error: clientWriteErr } = await anon.from('evidence').insert({
  subject_type: 'product', subject_id: SUBJECT, predicate: 'demand',
  value: 999, method: 'user', confidence: 1, ttl_days: 30,
});
check('clients cannot write evidence', !!clientWriteErr, clientWriteErr?.code);

// ---- cleanup ---------------------------------------------------------------
await admin.from('claim_snapshots').delete().eq('subject_id', SUBJECT);
await admin.from('evidence').update({ superseded_by: null }).eq('id', e1.id);
await admin.from('evidence').delete().eq('subject_id', SUBJECT);
await admin.from('raw_captures').delete().eq('id', capture.id);

console.log(`\n${failures === 0 ? 'Evidence store contract holds.' : `${failures} FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);

// Emits the list of product ideas that still have NO scraped supplier evidence.
//
//   node scripts/export-research-queue.mjs
//
// Writes /tmp/queue-remaining.json (the [{id, q}] batch file that
// scripts/ingest-harvested.mjs expects) and prints the JS array literal to paste
// into scripts/browser-harvest-indiamart.js.
//
// Resumable by construction: ideas that already carry scraped evidence are skipped,
// so re-running after a partial harvest only ever shrinks the queue.

import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').forEach((line) => {
  const m = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
  if (m) { let v = m[2] || ''; if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); env[m[1]] = v; }
});

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const LIMIT = Number((process.argv.find((a) => a.startsWith('--limit=')) || '--limit=25').split('=')[1]);

const { data: ideas, error } = await admin
  .from('product_ideas')
  .select('id, name, research_suppliers(data_source)')
  .order('created_at', { ascending: true });

if (error) { console.error(error.message); process.exit(1); }

const remaining = (ideas ?? [])
  .filter((i) => !(i.research_suppliers ?? []).some((s) => s.data_source === 'scraped'))
  // The search query drops punctuation — IndiaMART's search does poorly with it.
  .map((i) => ({ id: i.id, q: i.name.replace(/ — .*$/, '').replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim() }));

const slice = remaining.slice(0, LIMIT);
writeFileSync('/tmp/queue-remaining.json', JSON.stringify(slice));

console.log(`${remaining.length} ideas still lack scraped evidence; wrote the first ${slice.length} to /tmp/queue-remaining.json\n`);
console.log('Paste this into browser-harvest-indiamart.js as QUERIES:\n');
console.log(JSON.stringify(slice.map((s) => s.q)));

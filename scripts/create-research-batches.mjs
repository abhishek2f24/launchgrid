// Creates/resumes 10-product research checkpoints for a project.
// Run after migration 0033: node scripts/create-research-batches.mjs <project-id>
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = {};
fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n').forEach((line) => {
  const m = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
  if (m) env[m[1]] = (m[2] || '').replace(/^['"]|['"]$/g, '');
});
const projectId = process.argv[2];
if (!projectId) throw new Error('usage: node scripts/create-research-batches.mjs <project-id>');
const sources = ['alibaba', 'indiamart', 'made_in_china', 'amazon_in', 'flipkart'];
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: ideas, error } = await sb.from('product_ideas').select('id,created_at').eq('research_project_id', projectId).order('created_at', { ascending: true });
if (error) throw error;
const rows = (ideas || []).map((idea, index) => ({
  research_project_id: projectId,
  product_idea_id: idea.id,
  batch_number: Math.floor(index / 10) + 1,
  batch_size: 10,
  source_name: null,
})).flatMap((row) => sources.map((source_name) => ({ ...row, source_name })));
for (let i = 0; i < rows.length; i += 500) {
  const result = await sb.from('research_batch_tasks').upsert(rows.slice(i, i + 500), { onConflict: 'product_idea_id,source_name' });
  if (result.error) throw result.error;
}
console.log(JSON.stringify({ projectId, products: ideas?.length || 0, batches: Math.ceil((ideas?.length || 0) / 10), tasks: rows.length }, null, 2));

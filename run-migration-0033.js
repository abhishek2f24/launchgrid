const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const env = {};
fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8').split('\n').forEach((line) => {
  const match = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').replace(/^['"]|['"]$/g, '');
});

const sql = fs.readFileSync(path.resolve(process.cwd(), 'supabase/migrations/0033_research_batch_tracker.sql'), 'utf8');
const client = new Client({ connectionString: (env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL).split('?')[0], ssl: { rejectUnauthorized: false } });
client.connect().then(() => client.query(sql)).then(() => console.log('Migration 0033 applied.')).catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => client.end());

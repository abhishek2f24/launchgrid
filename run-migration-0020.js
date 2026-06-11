process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let key = match[1];
    let val = match[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[key] = val;
  }
});

const connectionString = (env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL || env.DATABASE_URL).split('?')[0];
const sql = fs.readFileSync(path.resolve(process.cwd(), 'supabase/migrations/0020_product_images_bucket.sql'), 'utf8');

async function runMigration() {
  console.log('Connecting to database for Migration 0020...');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Connected! Running migration SQL...');
    await client.query(sql);
    console.log('Migration 0020 applied successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

runMigration();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const envPath = path.resolve(__dirname, '../.env.local');
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

const connectionString = env.DATABASE_URL || env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL;

const sqlPath = path.resolve(__dirname, '../supabase/migrations/0004_add_rzp_secret.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function run() {
  console.log('Connecting to database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Applying migration 0004_add_rzp_secret.sql...');
    await client.query(sql);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

run();

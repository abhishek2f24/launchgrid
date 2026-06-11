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

const connectionString = (env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL).split('?')[0];

const migrationFilePath = path.resolve(process.cwd(), 'supabase/migrations/0002_abandoned_carts.sql');
const sql = fs.readFileSync(migrationFilePath, 'utf8');

async function runMigration() {
  console.log('Connecting to Postgres database to run migrations...');
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected! Executing migration 0001...');
    await client.query(sql);
    console.log('Migration 0001 applied successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

runMigration();

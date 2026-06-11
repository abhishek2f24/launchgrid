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

const connectionString = env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL;
const migrationFilePath = path.resolve(process.cwd(), 'supabase/migrations/0001_onboarding_fields.sql');
const sql = fs.readFileSync(migrationFilePath, 'utf8');

async function runMigration() {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected! Executing migration SQL...');
    await client.query(sql);
    console.log('Migrations applied successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await client.end();
  }
}

runMigration();

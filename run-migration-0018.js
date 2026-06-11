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

async function runMigration() {
  console.log('Connecting to database for Migration 0018...');
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected!');

    // ALTER TYPE ... ADD VALUE cannot run inside a transaction block,
    // so run each statement individually outside transactions.
    const statements = [
      `ALTER TYPE store_event_type_enum ADD VALUE IF NOT EXISTS 'purchase'`,
      `ALTER TABLE store_events ADD COLUMN IF NOT EXISTS utm_source TEXT`,
      `ALTER TABLE store_events ADD COLUMN IF NOT EXISTS utm_medium TEXT`,
      `ALTER TABLE store_events ADD COLUMN IF NOT EXISTS utm_campaign TEXT`,
      `CREATE INDEX IF NOT EXISTS store_events_utm_source_idx
         ON store_events(store_id, utm_source)
         WHERE utm_source IS NOT NULL`,
    ];

    for (const sql of statements) {
      console.log('Running:', sql.split('\n')[0].trim(), '...');
      await client.query(sql);
    }

    console.log('Migration 0018 applied successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

runMigration();

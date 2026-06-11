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

async function checkColumns() {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check products
    const productsRes = await client.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'products'
    `);
    console.log('PRODUCTS COLUMNS:', productsRes.rows.map(r => r.column_name));

    // Check business_configs
    const configsRes = await client.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'business_configs'
    `);
    console.log('BUSINESS_CONFIGS COLUMNS:', configsRes.rows.map(r => r.column_name));

    // Check tenants
    const tenantsRes = await client.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'tenants'
    `);
    console.log('TENANTS COLUMNS:', tenantsRes.rows.map(r => r.column_name));

    // Check orders
    const ordersRes = await client.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'orders'
    `);
    console.log('ORDERS COLUMNS:', ordersRes.rows.map(r => r.column_name));

  } catch (error) {
    console.error('Failed to list columns:', error.message);
  } finally {
    await client.end();
  }
}

checkColumns();

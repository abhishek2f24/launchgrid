#!/usr/bin/env node
/**
 * Applies one SQL migration to the database in .env.local.
 *
 *   node scripts/run-migration.mjs supabase/migrations/0043_early_access.sql
 *   node scripts/run-migration.mjs 0043          # shorthand: matches by prefix
 *
 * WHY THIS EXISTS
 *   The repo root holds twenty `run-migration-00NN.js` files that are the same
 *   forty lines with one filename changed. This is that script, parameterised.
 *   New migrations should use it rather than adding a twenty-first copy.
 *
 * SAFETY
 *   - Runs inside a transaction: any error rolls the whole file back, so a
 *     migration cannot half-apply and leave the schema in a state no file
 *     describes.
 *   - Refuses DROP and TRUNCATE unless --allow-destructive is passed. Applying
 *     a migration is routine; dropping a production table by pasting the wrong
 *     path should take a deliberate second step.
 *   - Prints the connection host (never the password) before running, because
 *     the most expensive mistake here is running against the wrong database.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import pg from 'pg';

const MIGRATIONS_DIR = 'supabase/migrations';
const DESTRUCTIVE = /\b(DROP\s+(TABLE|SCHEMA|DATABASE|COLUMN)|TRUNCATE)\b/i;

function loadEnv() {
  const path = resolve(process.cwd(), '.env.local');
  if (!existsSync(path)) {
    console.error('No .env.local found. Run this from the project root.');
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^\s*([\w.\-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    let value = match[2] ?? '';
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
  return env;
}

/** Accepts a full path, a filename, or just the numeric prefix. */
function resolveMigration(argument) {
  if (existsSync(argument)) return argument;

  const candidates = readdirSync(MIGRATIONS_DIR).filter((file) =>
    file.endsWith('.sql')
  );
  const matches = candidates.filter(
    (file) => file === argument || file.startsWith(argument)
  );

  if (matches.length === 1) return join(MIGRATIONS_DIR, matches[0]);
  if (matches.length > 1) {
    console.error(`"${argument}" matches several migrations:\n  ${matches.join('\n  ')}`);
    process.exit(1);
  }
  console.error(`No migration matching "${argument}" in ${MIGRATIONS_DIR}.`);
  process.exit(1);
}

const [, , target, ...flags] = process.argv;
if (!target) {
  console.error('Usage: node scripts/run-migration.mjs <file|prefix> [--allow-destructive]');
  process.exit(1);
}

const file = resolveMigration(target);
const sql = readFileSync(file, 'utf8');

if (DESTRUCTIVE.test(sql) && !flags.includes('--allow-destructive')) {
  console.error(
    `${file} contains DROP or TRUNCATE.\n` +
      'Re-run with --allow-destructive if that is genuinely intended.'
  );
  process.exit(1);
}

const env = loadEnv();
const connectionString = (
  env.POSTGRES_URL_NON_POOLING ||
  env.POSTGRES_URL ||
  env.DATABASE_URL ||
  ''
).split('?')[0];

if (!connectionString) {
  console.error('No POSTGRES_URL_NON_POOLING, POSTGRES_URL or DATABASE_URL in .env.local.');
  process.exit(1);
}

// Host only — never print the credentials.
const host = (connectionString.match(/@([^/:]+)/) || [])[1] ?? 'unknown host';
console.log(`Applying ${file}`);
console.log(`  -> ${host} / ${env.POSTGRES_DATABASE || 'postgres'}`);

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query('BEGIN');
  await client.query(sql);
  await client.query('COMMIT');
  console.log('Applied, committed.');
} catch (error) {
  try {
    await client.query('ROLLBACK');
    console.error('Rolled back — nothing was changed.');
  } catch {
    // The connection may already be gone; the original error is what matters.
  }
  console.error(`\n${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}

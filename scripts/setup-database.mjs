import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRef = process.env.SUPABASE_PROJECT_REF || 'qixjqqmbjqdknkyyjsek';
const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD;
const databaseUrl = process.env.DATABASE_URL;

const migrationPath = resolve(
  __dirname,
  '../supabase/migrations/20260708180000_initial_schema.sql',
);

function buildConnectionString() {
  if (databaseUrl) return databaseUrl;
  if (!dbPassword) return null;

  const region = process.env.SUPABASE_DB_REGION || 'eu-central-1';
  return `postgresql://postgres.${projectRef}:${encodeURIComponent(dbPassword)}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
}

async function main() {
  const connectionString = buildConnectionString();

  if (!connectionString) {
    console.error('Missing database credentials.');
    console.error('Set DATABASE_URL or SUPABASE_DB_PASSWORD in your environment.');
    console.error('Find the password in Supabase → Project Settings → Database.');
    process.exit(1);
  }

  const sql = readFileSync(migrationPath, 'utf8');
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('Connected to Supabase database. Applying migration...');
    await client.query(sql);
    console.log('Migration applied successfully.');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

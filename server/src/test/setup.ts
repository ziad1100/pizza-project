import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterAll, afterEach, beforeAll } from 'vitest';
import pg from 'pg';

const CONTAINER = 'orabi-test-pg';
const TEST_PORT = 54329;
const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ?? `postgresql://postgres:postgres@127.0.0.1:${TEST_PORT}/postgres`;

// Must run before any module that imports config/env or db/index (which capture these at import time).
process.env.NODE_ENV = 'test';
process.env.PORT = '5050';
process.env.DATABASE_URL = TEST_DB_URL;
process.env.REDIS_URL = '';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_0123456789abcdef0123456789abcdef';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_0123456789abcdef0123456789abcdef';

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

const docker = (args: string[], opts: { stdio?: 'pipe' | 'inherit' } = {}): string =>
  execFileSync('docker', args, { encoding: 'utf8', stdio: opts.stdio ?? 'pipe' });

const ensureContainer = (): void => {
  const running = docker(['ps', '--filter', `name=${CONTAINER}`, '--format', '{{.Names}}']).trim();
  if (running === CONTAINER) return;
  const existing = docker(['ps', '-a', '--filter', `name=${CONTAINER}`, '--format', '{{.Names}}']).trim();
  if (existing === CONTAINER) {
    docker(['start', CONTAINER], { stdio: 'inherit' });
  } else {
    docker(
      [
        'run', '-d', '--name', CONTAINER, '-p', `${TEST_PORT}:5432`,
        '-e', 'POSTGRES_PASSWORD=postgres', '-e', 'POSTGRES_DB=postgres',
        '-e', 'POSTGRES_HOST_AUTH_METHOD=trust',
        'postgres:16-alpine',
      ],
      { stdio: 'inherit' },
    );
  }
};

const waitForDb = async (client: pg.Pool): Promise<void> => {
  for (let i = 0; i < 30; i += 1) {
    try {
      await client.query('SELECT 1');
      return;
    } catch {
      await sleep(1000);
    }
  }
  throw new Error(`Timed out waiting for the ${CONTAINER} Postgres container on port ${TEST_PORT}`);
};

let pool: pg.Pool | null = null;

const migrationPath = (): string => {
  const candidates = [
    path.resolve(import.meta.dirname, '..', '..', '..', 'supabase', 'migrations', '20250101000000_init.sql'),
    path.resolve('supabase/migrations/20250101000000_init.sql'),
  ];
  for (const c of candidates) {
    try {
      readFileSync(c);
      return c;
    } catch {
      /* try next */
    }
  }
  throw new Error('Unable to locate supabase/migrations/20250101000000_init.sql');

};

const applySchemaIfNeeded = async (client: pg.Pool): Promise<void> => {
  const { rows } = await client.query<{ t: string }>(`SELECT to_regclass('public.users')::text AS t`);
  if (rows[0]?.t) return;
  for (const role of ['anon', 'authenticated', 'service_role']) {
    await client.query(`DO $$ BEGIN CREATE ROLE ${role} NOLOGIN; EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
  }
  const sql = readFileSync(migrationPath(), 'utf8');
  await client.query(sql);
};

const truncateAll = async (client: pg.Pool): Promise<void> => {
  const { rows } = await client.query<{ names: string }>(
    `SELECT string_agg('"' || tablename || '"', ', ') AS names
     FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'analytics'`,
  );
  if (rows[0]?.names) await client.query(`TRUNCATE TABLE ${rows[0].names} RESTART IDENTITY CASCADE`);
  await client.query('DELETE FROM analytics');
};

beforeAll(async () => {
  if (!process.env.TEST_DATABASE_URL) {
    ensureContainer();
  }
  pool = new pg.Pool({ connectionString: TEST_DB_URL });
  await waitForDb(pool);
  await applySchemaIfNeeded(pool);
}, 120_000);

afterEach(async () => {
  if (pool) await truncateAll(pool);
});

afterAll(async () => {
  await pool?.end().catch(() => undefined);
  if (!process.env.TEST_DATABASE_URL) {
    try {
      docker(['stop', '-t', '1', CONTAINER]);
    } catch {
      /* container may already be gone */
    }
  }
});
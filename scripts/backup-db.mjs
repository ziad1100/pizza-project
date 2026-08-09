import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, existsSync, openSync, closeSync, statSync, cpSync, createWriteStream, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { gzipSync, createGzip } from 'node:zlib';

const CONTAINER = process.env.BACKUP_CONTAINER || 'pizzaproject-mongo-1';
const DB_NAME = process.env.BACKUP_DB || 'pizza';
const REPO_ROOT = process.cwd();
const BACKUP_DIR =
  process.env.BACKUP_DIR || path.join(homedir(), 'OneDrive', 'PizzaBackups');

const stamp = () => {
  const d = new Date();
  return (
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}` +
    `${String(d.getDate()).padStart(2, '0')}-` +
    `${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`
  );
};

const dbDir = path.join(BACKUP_DIR, 'db');
const dataDir = path.join(BACKUP_DIR, 'data');
mkdirSync(dbDir, { recursive: true });
mkdirSync(dataDir, { recursive: true });

// -----------------------------------------------------------------------------
// 1. Legacy MongoDB container (kept until the mongo→postgres migration is done)
// -----------------------------------------------------------------------------
const archive = path.join(dbDir, `${DB_NAME}-${stamp()}.gz`);
console.log(`Dumping "${DB_NAME}" from container ${CONTAINER}`);
console.log(`  -> ${archive}`);
const fd = openSync(archive, 'w');
let mongoOk = false;
try {
  try {
    execFileSync(
      'docker',
      ['exec', CONTAINER, 'mongodump', `--db=${DB_NAME}`, '--archive', '--gzip'],
      { stdio: ['ignore', fd, 'inherit'], windowsHide: true },
    );
    mongoOk = true;
  } catch (err) {
    console.error(`Mongo legacy backup FAILED (${err.message}) — skipping`);
  }
} finally {
  closeSync(fd);
}
if (mongoOk) {
  console.log(`  archive: ${(statSync(archive).size / 1024 / 1024).toFixed(2)} MB`);
} else {
  unlinkSync(archive);
}

const legacyDb = path.join(REPO_ROOT, 'server', '.data', 'db');
if (existsSync(legacyDb)) {
  const legacyDest = path.join(dataDir, 'legacy-dev-db');
  cpSync(legacyDb, legacyDest, { recursive: true });
  const n = statSync(legacyDest).size;
  console.log(`  legacy dev DB copied (${(n / 1024 / 1024).toFixed(2)} MB)`);
} else {
  console.log('No legacy server/.data/db found — skipping');
}

// -----------------------------------------------------------------------------
// 2. PostgreSQL (Supabase / self-hosted) — the authoritative data store.
//    Resolution order: pg_dump on PATH → docker exec into the supabase-db
//    container → supabase CLI (`supabase db dump`).
// -----------------------------------------------------------------------------
const PG_ARCHIVE = path.join(dbDir, `postgres-pizza-${stamp()}.sql.gz`);
const SUPABASE_DB_URL =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

const pipeToGz = (cmd, args) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'inherit'], windowsHide: true });
    const gz = createGzip();
    const out = createWriteStream(PG_ARCHIVE);
    let settled = false;
    child.stdout.pipe(gz).pipe(out);
    out.on('finish', () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    });
    child.on('error', (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });
    child.on('close', (code) => {
      if (!settled && code !== 0) {
        settled = true;
        reject(new Error(`${cmd} exited with code ${code}`));
      }
    });
  });

let method = null;

try {
  execFileSync('pg_dump', ['--version'], { stdio: 'ignore', windowsHide: true });
  method = {
    label: 'pg_dump (PATH)',
    run: () =>
      pipeToGz('pg_dump', [
        `--dbname=${SUPABASE_DB_URL}`,
        '--no-owner',
        '--no-privileges',
        '--no-comments',
      ]),
  };
} catch {
  /* pg_dump not on PATH — try docker */
}

if (!method) {
  try {
    execFileSync('docker', ['exec', 'supabase-db', 'pg_dump', '--version'], { stdio: 'ignore', windowsHide: true });
    method = {
      label: 'docker exec supabase-db (pg_dump)',
      run: () =>
        pipeToGz('docker', [
          'exec', 'supabase-db', 'pg_dump',
          '-U', 'postgres', '-d', 'postgres',
          '--no-owner', '--no-privileges', '--no-comments',
        ]),
    };
  } catch {
    /* docker unavailable — try supabase CLI */
  }
}

if (!method) {
  // On Windows, spawn .cmd shims (npx) via cmd.exe to avoid EINVAL issues.
  const runNpx = (args, opts = {}) =>
    process.platform === 'win32'
      ? execFileSync('cmd.exe', ['/c', 'npx', '--yes', ...args], { stdio: 'ignore', windowsHide: true, ...opts })
      : execFileSync('npx', ['--yes', ...args], { stdio: 'ignore', windowsHide: true, ...opts });
  try {
    runNpx(['supabase', '--version']);
    const tmpSql = path.join(REPO_ROOT, `.supabase-dump-${Date.now()}.sql`);
    method = {
      label: 'supabase CLI (db dump)',
      run: async () => {
        try {
          runNpx(['supabase', 'db', 'dump', '--db-url', SUPABASE_DB_URL, '--file', tmpSql], { stdio: 'inherit' });
          const gz = gzipSync(readFileSync(tmpSql));
          writeFileSync(PG_ARCHIVE, gz);
        } finally {
          if (existsSync(tmpSql)) unlinkSync(tmpSql);
        }
      },
    };
  } catch {
    /* no Postgres backup toolchain at all */
  }
}

if (method) {
  try {
    console.log(`Postgres backup via ${method.label}`);
    console.log(`  -> ${PG_ARCHIVE}`);
    await method.run();
    console.log(`  archive: ${(statSync(PG_ARCHIVE).size / 1024 / 1024).toFixed(2)} MB`);
  } catch (err) {
    console.error(`Postgres backup FAILED: ${err.message} — skipping`);
  }
} else {
  console.log('No Postgres backup method available (pg_dump, supabase-db container, or supabase CLI not found) — skipping');
}

console.log(`\nBackup complete -> ${BACKUP_DIR}`);
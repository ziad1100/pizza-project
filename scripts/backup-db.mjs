import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync, openSync, closeSync, statSync, cpSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

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

const archive = path.join(dbDir, `${DB_NAME}-${stamp()}.gz`);
console.log(`Dumping "${DB_NAME}" from container ${CONTAINER}`);
console.log(`  -> ${archive}`);
const fd = openSync(archive, 'w');
try {
  execFileSync(
    'docker',
    ['exec', CONTAINER, 'mongodump', `--db=${DB_NAME}`, '--archive', '--gzip'],
    { stdio: ['ignore', fd, 'inherit'], windowsHide: true },
  );
} finally {
  closeSync(fd);
}
console.log(`  archive: ${(statSync(archive).size / 1024 / 1024).toFixed(2)} MB`);

const legacyDb = path.join(REPO_ROOT, 'server', '.data', 'db');
if (existsSync(legacyDb)) {
  const legacyDest = path.join(dataDir, 'legacy-dev-db');
  cpSync(legacyDb, legacyDest, { recursive: true });
  const n = statSync(legacyDest).size;
  console.log(`  legacy dev DB copied (${(n / 1024 / 1024).toFixed(2)} MB)`);
} else {
  console.log('No legacy server/.data/db found — skipping');
}

console.log(`\nBackup complete -> ${BACKUP_DIR}`);

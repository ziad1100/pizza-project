import { execFileSync } from 'node:child_process';
import { readdirSync, openSync, closeSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const CONTAINER = process.env.BACKUP_CONTAINER || 'pizzaproject-mongo-1';
const DB_NAME = process.env.BACKUP_DB || 'pizza';
const BACKUP_DIR =
  process.env.BACKUP_DIR || path.join(homedir(), 'OneDrive', 'PizzaBackups');

const dbDir = path.join(BACKUP_DIR, 'db');
const archives = readdirSync(dbDir)
  .filter((f) => f.startsWith(`${DB_NAME}-`) && f.endsWith('.gz'))
  .sort()
  .reverse();

if (archives.length === 0) {
  console.error(`No "${DB_NAME}-*.gz" archives found in ${dbDir}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const drop = args.includes('--drop');
const chosen = args.find((a) => !a.startsWith('--')) || archives[0];
const archive = path.join(dbDir, chosen);
console.log(`Restoring "${DB_NAME}" from ${archive} -> container ${CONTAINER}`);
if (drop) console.log('  (--drop: existing collections dropped before restore)');

const fd = openSync(archive, 'r');
try {
  const args = ['exec', '-i', CONTAINER, 'mongorestore', '--archive', '--gzip', `--nsInclude=${DB_NAME}.*`];
  if (drop) args.push(`--drop`);
  execFileSync('docker', args, { stdio: [fd, 'inherit', 'inherit'], windowsHide: true });
} finally {
  closeSync(fd);
}

console.log('Restore complete. Latest archive:', chosen);

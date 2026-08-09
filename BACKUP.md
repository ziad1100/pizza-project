# BACKUP & RESTORE — ORABI Restaurant

Everything here is wired so the project survives a dead laptop disk / accidental deletion.
There are **three independent layers**: GitHub (code), OneDrive (data archives), and a
scheduled task (daily automation).

---

## What is covered

| Data | Where it lives | Backed up by |
|---|---|---|
| All source code + history | `git` (local + GitHub) | `npm run backup` / git |
| Live DB — PostgreSQL (Supabase/self-hosted) | `DATABASE_URL` (e.g. `supabase` local, container, or cloud) | `npm run backup:db` → `pg_dump` → `postgres-pizza-*.sql.gz` |
| Legacy Mongo DB `pizza` | Docker volume `pizzaproject_mongo-data` | `npm run backup:db` → mongodump → `pizza-*.gz` (kept only until the mongo→postgres migration is finished) |
| Legacy dev Mongo data | `server/.data/db` | `npm run backup:db` (copied to backup set) |
| Redis cache | Docker volume `pizzaproject_redis-data` | (not backed up — cache only, rebuilt on demand) |
| Uploads | Docker volume `pizzaproject_uploads-data` or local `server/src/uploads` | (empty by default; archived when present) |
| Secrets (`.env`, `server/.env`) | disk | copied to `backups/secrets/` (git-ignored) |

Backup target: **`C:\Users\<you>\OneDrive\PizzaBackups`** (overridable via `BACKUP_DIR`).
Because it's inside OneDrive, every archive auto-syncs to the cloud.

## Commands

```powershell
npm run backup        # DB dump(s) + data copy + git commit + push (one command)
npm run backup:db     # the DB dumps + legacy data copy
npm run restore:db    # restore the latest Mongo archive into the legacy Mongo DB
npm run restore:db pizza-YYYYMMDD-HHMM.gz   # restore a specific Mongo archive
npm run restore:db --drop   # drop existing collections before restore
```

`restore:db` examples:
- Restore newest Mongo archive: `npm run restore:db`
- Restore newest + wipe first: `npm run restore:db --drop`
- Restore a specific file: `npm run restore:db pizza-20260807-1511.gz --drop`

### Postgres dump orchestration

`npm run backup:db` produces **two** archives for the live DB:
- `postgres-pizza-<stamp>.sql.gz` — the **authoritative** dump (plain SQL, gzipped).
- `pizza-<stamp>.gz` — the legacy Mongo archive (container `pizzaproject-mongo-1`).

The Postgres dump resolves the toolchain in this order (first hit wins):
1. `pg_dump` on PATH — dumps the DB from `DATABASE_URL`.
2. `docker exec supabase-db pg_dump` — local Supabase container (`supabase start`).
3. `npx --yes supabase db dump` — the Supabase CLI against `DATABASE_URL`.

Setting `DATABASE_URL` is recommended so the dump targets the right database; without
it the script falls back to the canonical local Supabase URL
(`postgresql://postgres:postgres@127.0.0.1:54322/postgres`).

**Restoring Postgres**: decompress and feed to `psql` (or to the Supabase SQL editor):

```powershell
gzip -cd postgres-pizza-YYYYMMDD-HHMM.sql.gz | psql "$DATABASE_URL"
```

(Destructive — drops and recreates schema + data if you pipe into a clean DB; there is
no Postgres `restore:db` script yet, only the Mongo one.)

## Restoring everything after losing the laptop

1. **Code**: install Node 24 + Docker (or Supabase CLI), `git clone` your GitHub private repo,
   `npm ci` (or `npm install`), copy `backups/secrets/*.env` back into `.env` + `server/.env`.
2. **DB**: bring up Postgres (e.g. `supabase start` or `docker compose up`), then restore the
   `postgres-pizza-*.sql.gz` archive (see above). Mongo: `docker compose up mongo`, then
   `BACKUP_DIR="<wherever the OneDrive PizzaBackups synced>" npm run restore:db --drop`.
3. **Run**: `docker compose up --build` (or `npm start`), validate with `npm run smoke:ui`.

The catalog itself (68 items) is reproducible by `npm run seed`, so even the DB dump
is only needed to keep user-generated data (orders, reviews, accounts).

## Scheduled daily backup

A Windows Task Scheduler task runs `npm run backup` every day at 03:00 (saved as
`scripts/backup.ps1`):
- Requires your OneDrive folder present + git remote reachable.
- If the laptop is off at 03:00 it simply runs the next time it's on.
- Re-create the task on a new machine: `schtasks /create /tn ORABIBackup /tr "powershell -File C:\Self Work\PizzaProject\scripts\backup.ps1" /sc daily /st 03:00 /f`

## Notes / caveats

- Both archives accumulate (each ~20 KB Mongo, the SQL dump depends on data size) — prune
  old ones manually or add retention in `backup-db.mjs`.
- First `npm run backup` pushes the whole repo; later runs commit small deltas.
- `backups/` and all `.env` files are git-ignored — secrets never reach GitHub.
- The Postgres dump uses `--no-owner --no-privileges` so it restores across machines without
  role conflicts.
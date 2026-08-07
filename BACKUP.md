# BACKUP & RESTORE — ORABI Restaurant

Everything here is wired so the project survives a dead laptop disk / accidental deletion.
There are **three independent layers**: GitHub (code), OneDrive (data archives), and a
scheduled task (daily automation).

---

## What is covered

| Data | Where it lives | Backed up by |
|---|---|---|
| All source code + history | `git` (local + GitHub) | `npm run backup` / git |
| Live DB `pizza` (users, orders, reviews, carts, products…) | Docker volume `pizzaproject_mongo-data` | `npm run backup:db` → mongodump archive |
| Legacy dev DB | `server/.data/db` | `npm run backup:db` (copied to backup set) |
| Uploads | Docker volume `pizzaproject_uploads-data` | (empty by default; archived when present) |
| Secrets (`.env`, `server/.env`) | disk | copied to `backups/secrets/` (git-ignored) |

Backup target: **`C:\Users\<you>\OneDrive\PizzaBackups`** (overridable via `BACKUP_DIR`).
Because it's inside OneDrive, every archive auto-syncs to the cloud.

## Commands

```powershell
npm run backup        # DB dump + data copy + git commit + push (one command)
npm run backup:db     # just the DB dump + legacy data copy
npm run restore:db    # restore the latest archive into the live DB
npm run restore:db pizza-YYYYMMDD-HHMM.gz   # restore a specific archive
npm run restore:db --drop   # drop existing collections before restore
```

`restore:db` examples:
- Restore newest: `npm run restore:db`
- Restore newest + wipe first: `npm run restore:db --drop`
- Restore a specific file: `npm run restore:db pizza-20260807-1511.gz --drop`

## Restoring everything after losing the laptop

1. **Code**: install Node 24 + Docker, `git clone` your GitHub private repo,
   `npm ci` (or `npm install`), copy `backups/secrets/*.env` back into `.env` + `server/.env`.
2. **DB**: `docker compose up mongo`, then
   `BACKUP_DIR="<wherever the OneDrive PizzaBackups synced>" npm run restore:db --drop`
3. **Run**: `docker compose up --build`, validate with `npm run smoke:ui`.

The catalog itself (107 products) is reproducible by `npm run seed`, so even the DB dump
is only needed to keep user-generated data (orders, reviews, accounts).

## Scheduled daily backup

A Windows Task Scheduler task runs `npm run backup` every day at 03:00 (saved as
`scripts/backup.ps1`):
- Requires your OneDrive folder present + git remote reachable.
- If the laptop is off at 03:00 it simply runs the next time it's on.
- Re-create the task on a new machine: `schtasks /create /tn ORABIBackup /tr "powershell -File C:\Self Work\PizzaProject\scripts\backup.ps1" /sc daily /st 03:00 /f`

## Notes / caveats

- The DB dump archives period; they accumulate (each ~20 KB) — prune old ones manually
  or add retention in `backup-db.mjs`.
- First `npm run backup` pushes the whole repo; later runs commit small deltas.
- `backups/` and all `.env` files are git-ignored — secrets never reach GitHub.
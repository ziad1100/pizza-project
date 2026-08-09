# RLS_POLICIES.md

Row Level Security posture (documented, no policy changes in this pass).

## Current state

- RLS is enabled with public-facing policies in
  `supabase/migrations/20250101000000_init.sql`.
- The API connects as the superuser/owner account, which bypasses RLS at the table
  level — server-side authz is therefore the primary boundary (audit finding S12,
  `documented`).

## Why it stays

- Any future direct-DB access (SQL clients, analytics workers) hits the policies.
- Changing the API account to an RLS-enforced role is a larger migration (roles,
  JWT claims per request, connection pooler settings) — deferred.

## Checks to run after DB changes

- API still boots against a fresh migration.
- `anon`/`authenticated` roles can still read public catalog data.
- No policy grants write access on `users` (`passwordHash`, token columns).
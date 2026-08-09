# ORABI Restaurant — Full Project Documentation

Full-stack fast-food restaurant platform (مطعم عرابي): an RTL-first bilingual (Arabic/English) storefront, a customer menu dashboard, an Express REST API backed by PostgreSQL (Supabase), role-based access control, Redis caching + BullMQ queues, email notifications, optional social login, and a containerized production build.

- **Client**: React 19, Vite 8, TypeScript, Tailwind CSS v4, Redux Toolkit, TanStack Query v5, react-hook-form + zod, i18next, react-router v8, sonner, swiper, framer-motion
- **Server**: Express, Node-postgres (`pg` Pool) against PostgreSQL/Supabase, ioredis + BullMQ (cache & queues), zod schemas, helmet, express-rate-limit, multer (local disk or Cloudinary), nodemailer, Passport (Google/Facebook OAuth), JWT access token + refresh cookie
- **Monorepo**: npm workspaces (root + `server` workspace), single root install

---

## 1. Repository layout

```
C:\Self Work\PizzaProject
├─ src/                  # React client
│  ├─ api/               # typed API clients (admin, auth, coupons, orders, posts, products)
│  ├─ assets/            # static assets bundled by Vite
│  ├─ components/        # UI (layout, product, ui primitives)
│  ├─ hooks/             # shared hooks (useTheme, store hooks)
│  ├─ i18n/              # i18next setup + ar.json / en.json locales
│  ├─ lib/               # axios instance, error helpers, utils, query client
│  ├─ pages/             # storefront pages + admin + auth
│  ├─ routes/            # route guards (Protected/Guest/Admin)
│  ├─ store/             # redux slices (auth, cart, ui, wishlist)
│  └─ types/             # shared TS types
├─ server/               # Express API (npm workspace)
│  ├─ src/
│  │  ├─ config/         # env (fail-fast), mailer, passport, cors, cloudinary
│  │  ├─ constants/      # roles, resources, permissions, order/payment enums, settings
│  │  ├─ controllers/    # one controller per resource (19) + unit tests
│  │  ├─ database/       # connection (pg), seed, roleSync
│  │  ├─ db/             # Postgres repositories — one module per table (21)
│  │  ├─ jobs/           # BullMQ queue + workers definitions
│  │  ├─ workers/        # worker entry (background jobs)
│  │  ├─ middlewares/    # auth, upload, rateLimit, zod validate, errorHandler, sanitize, cache, diagnostics, activityLogger (+ tests)
│  │  ├─ schemas/        # zod request/validate schemas (17)
│  │  ├─ routes/         # 20 route modules + index
│  │  ├─ services/       # coupon.service, email.service, cache (Redis)
│  │  ├─ emails/         # (reserved — email templates)
│  │  ├─ socket/         # (reserved — socket.io placeholders)
│  │  ├─ interfaces/     # TS interfaces
│  │  ├─ types/          # TS types
│  │  ├─ logs/           # log output (dev)
│  │  ├─ uploads/        # local uploads dir (dev)
│  │  ├─ test/           # Vitest + Supertest suite (setup, helpers, API tests)
│  │  ├─ utils/          # ApiError, ApiResponse, asyncHandler, token, cookies, slugify (+ unit tests)
│  │  ├─ validators/     # (legacy — empty; zod schemas supersede it)
│  │  └─ repositories/    # (legacy — empty; `db/` supersedes it)
│  └─ dist/               # server build (esbuild bundle)
├─ supabase/               # Supabase local stack config + SQL migration(s)
├─ scripts/                # backup / restore / smoke_ui
├─ docs/                   # security & ops docs (SECURITY_AUDIT, AUTHENTICATION, RLS_POLICIES, …)
├─ public/                 # favicon, images (menu photos), icons sprite
├─ dist/                   # client production build (built)
├─ Dockerfile / .dockerignore / docker-compose.yml
└─ README.md               # quick-start guide
```

---

## 2. Client architecture

### Routing (`src/App.tsx`)
- `createBrowserRouter` with a root layout route (`RootLayout`) containing `ScrollToTop` + `ScrollRestoration`
- All pages are **lazy-loaded** (code-split) with a `PageFallback` spinner
- Routes: `/`, `/menu`, `/product/:slug`, `/login`, `/register`, `/forgot-password`, `/reset-password` (token from email link), `/verify-email` (token from email link), `/auth/callback` (social OAuth), `/checkout`, `/orders`, `/about`, `/branches`, `/blog`, `/blog/:slug`, `/gallery`, `/contact`, `*` (404)
- Admin routes under `/admin` guarded by `AdminRoute`: products, categories, offers, coupons, banners, orders, reviews, users, posts, branches, contacts, settings, analytics

### Guards (`src/routes/guards.tsx`)
- `ProtectedRoute` — requires a token, else redirects to `/login` with `state.from` preserved
- `GuestRoute` — redirects logged-in users away from `/login` `/register`
- `AdminRoute` — requires token + `admin`/`manager` role

### State
| Slice | Purpose |
|---|---|
| `auth` | token + user, persisted to localStorage (`ph_token`, `ph_user`) |
| `cart` | cart items, persisted |
| `ui` | theme (dark/light via `useTheme`), drawer state |
| `wishlist` | wishlist items, persisted |

### Data fetching
- Central axios instance (`src/lib/api.ts`): base URL `/api/v1`, `withCredentials`, Bearer token injected from storage, automatic 401 refresh-token retry (single-flight), `unwrap()` envelope helper, `getErrorMessage()`
- TanStack Query v5 for server state; mutations used for writes

### i18n
- `ar.json` + `en.json`, i18next with browser language detection, `dir="rtl"` on the `<html>` element when Arabic, `dir="ltr"` for English

---

## 3. Server architecture

### Entry (`server/src/server.ts` → `app.ts`)
- Helmet, same-origin-aware CORS (bypasses for same host, else `corsOptions`), compression, JSON/urlencoded parsers (10 MB), cookie-parser
- Static `/uploads` (local uploads dir), request-id + latency diagnostics middleware
- `express-mongo-sanitize`-style sanitization (`sanitizeJson`), morgan (non-test), rate limiting on `/api` (300 req / 15 min, knobs below)
- API under `/api/v1`
- **Production**: serves client `dist/` with `7d immutable` caching (index.html `no-cache`) + SPA fallback for non-`/api` `/uploads` paths

### Routing (`server/src/routes/index.ts`)
20 modules, each mapped to a resource: `auth`, `user` (account/addresses), `adminUser` (user management), `product`, `category`, `cart`, `order`, `review`, `coupon`, `offer`, `banner`, `branch`, `post`, `contact`, `newsletter`, `notification`, `setting`, `analytics`, `upload`, `wishlist`.

### Data layer — PostgreSQL
- `pg` connection Pool (`server/src/db/index.ts`), config from `DATABASE_URL` (`PG_MAX_POOL_SIZE` knob)
- One repository per table under `server/src/db/` (users, products, categories, cart_items, orders, … 20 modules)
- Bootstrap connectivity probe in `server/src/database/connection.ts`; `roleSync.ts` upserts roles/permissions at boot
- Schema managed by SQL migrations in `supabase/migrations/` (local Supabase `supabase start`, or any Postgres)
- **Supabase**: optional `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY` for RLS-managed auth/id — see `docs/RLS_POLICIES.md`

### Redis + BullMQ (`server/src/services/cache.ts`, `jobs/`, `workers/`)
- Redis via ioredis (`REDIS_URL`) — API cache layer
- BullMQ queues + workers (`jobs/queue.ts`, `jobs/workers.ts`, `workers/index.ts`) for background jobs
- When `REDIS_URL` is empty/unreachable the API degrades to DB-only

### RBAC
- Roles: `admin`, `manager`, `employee`, `customer` (see `server/src/constants/index.ts`)
- Resources (16): products, categories, orders, users, branches, offers, banners, coupons, reviews, contacts, newsletter, settings, analytics, activity, posts (+ notifications)
- Actions (5): create, read, update, delete, hide
- `PERMISSION_PRESETS` define the per-role matrix; `requirePermission(resource, action)` middleware enforces it server-side on every admin/route-guarded endpoint
- Client mirrors checks with route guards and permission-aware admin UI

### Auth & security (hardened)
- Local register/login (bcrypt) with **server-enforced role lock**: register accepts only `customer`; admin elevation requires `ADMIN_REGISTER_CODE`. Passwords ≥ 8 chars; verification gate on restricted resources
- JWT access token + refresh token in HttpOnly cookie; **tokens stored as SHA-256 hashes** (never raw); refresh rotation on use; revocation on logout / password change / password reset / admin deactivation
- Email verification + password reset with a 6-digit numeric code (`crypto.randomInt`); when no SMTP is configured, the dev fallback returns `{ code, link }` inline (production keeps anti-enumeration `null`); gate: `smtpConfigured` + `env.isProd`
- **Rate limiters** (express-rate-limit, `server/src/middlewares/rateLimiter.ts`):
  | Limiter | Default | Where |
  |---|---|---|
  | `apiLimiter` | 300 / 15 m | global `/api` |
  | `authLimiter` | 20 / 15 m | `/auth/*` |
  | `subscribeLimiter` | 10 / 15 m | `/newsletter` |
  | `contactLimiter` | 10 / 1 h | `/contact` |
  | `adminApiLimiter` | 200 / 15 m | `/admin/users` |
  - optional env knobs `AUTH_WINDOW_MS` `AUTH_LIMIT` `SUBSCRIBE_*` `CONTACT_*` `ADMIN_WINDOW_MS` `ADMIN_API_LIMIT` `API_WINDOW_MS` `API_LIMIT`; `DISABLE_RATE_LIMIT=1` bypass for local dev
- **Uploads**: multer local disk (5 MB, jpeg/png/webp/gif/avif, `image`/`images` ≤ 10). New `validateUploadedImage` middleware does **magic-byte sniffing** + extension allowlist; bad files deleted immediately. Cloudinary when `CLOUDINARY_*` set
- **Activity logging**: `activityLogger` records requests/response summaries with **redaction** of password/token/secret fields at any depth (arrays included) — see `middlewares/activityLogger.ts/.test.ts`
- **CORS**: same-origin-aware; `CLIENT_URL` drives whitelist
- **Secrets**: `env.ts` validates at boot — throws for missing `DATABASE_URL`/`JWT_*`, enforces ≥ 32-char JWT secrets, rejects legacy dev placeholders (no insecure defaults)

### Utilities
- `ApiError` / `ApiResponse` (uniform `{success, statusCode, message, data}` envelope), `asyncHandler`, token/cookie helpers, slugify

---

## 4. Database & seeding

- **PostgreSQL is the source of truth**: dev via `supabase start` (local) or any Postgres; prod via Supabase cloud `DATABASE_URL` (see production checklist in `server/.env.example`)
- **Schema**: SQL migrations in `supabase/migrations/` (local Supabase auto-applies; the suite applies `20250101000000_init.sql` on the test DB)
- **Mongo legacy**: `MONGO_URI` remains as a placeholder until the one-time mongo→postgres data migration script (`server/src/scripts/migrate-mongo-to-pg.ts`, per `server/.env.example`) is written and run; after that, Mongo can be removed
- **Seed script** (`npm run seed` — destructive: TRUNCATE + RESTART IDENTITY over all tables), creates:
  - 68 ORABI products across 7 menu sections / 12 sub-sections (source of truth: `orabi_menu.json` at repo root) with sizes/extras, dish photos in `public/images/products` (reused legacy photos + royalty-free downloads + SVG placeholders, see `scripts/menu-photo-map.json`), 10 `isBestSeller` + 10 `isOffer`
  - 4 users (password `Pizza123!`): `admin@pizzahouse.dev`, `manager@pizzahouse.dev`, `employee@pizzahouse.dev`, `customer@pizzahouse.dev`
  - Roles/permissions via `roleSync` (non-destructive upsert), categories, posts, reviews, branches, delivery zones, settings, coupons/offers/banners
- **Seeding is DESTRUCTIVE** — it TRUNCATEs all tables before inserting. Run it only against a disposable/backed-up DB
- **roleSync** (`database/roleSync.ts`): boot-time ensure roles + permission presets

---

## 5. Scripts (root package.json)

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server (:5173, proxies `/api` `/uploads` → :5000) |
| `npm run dev:server` | Backend via `tsx watch` |
| `npm run dev:all` | Both concurrently |
| `npm run build` | Client: `tsc -b` + `vite build` → `dist/` |
| `npm run build:server` | Server: `tsc --noEmit` + esbuild bundle → `server/dist/server.js` |
| `npm run seed` | Destructive reseed of Postgres |
| `npm run test` | Vitest suite (unit + API integration) on an ephemeral PG |
| `npm run test:watch` | Vitest watch mode |
| `npm run lint` | ESLint |
| `npm run preview` | Vite preview of built client |
| `npm run smoke:ui` | Puppeteer end-to-end (dev servers must run) |
| `npm run backup` / `backup:db` / `restore:db` | DB dumps + git commit/push (see BACKUP.md) |
| `npm run start` | Production server (`NODE_ENV=production`), serves SPA + API on PORT |

### Verification workflow
1. `npm run test` — **full suite: 175 tests across 21 files**
2. `npm run build` + `npm run build:server`
3. `npm run lint`
4. `npm run smoke:ui` (dev servers running) — 18/18 expected
5. Production check: `npm start` against the real Postgres, then `SMOKE_BASE=http://<host>:<port> npm run smoke:ui`
6. `npm audit` — clean (express-rate-limit, helmet, etc.)

---

## 6. Environment variables

Documented inline in `server/.env.example` (including a production checklist). Key groups: `PORT`, `NODE_ENV`, `DATABASE_URL` (required), `SUPABASE_URL` `SUPABASE_SERVICE_ROLE_KEY` `SUPABASE_ANON_KEY`, `REDIS_URL`, `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` (**required ≥ 32 chars**), `ACCESS_TOKEN_EXPIRES` (15m) / `REFRESH_TOKEN_EXPIRES` (7d), `COOKIE_SECURE`, `CLIENT_URL`, `ADMIN_REGISTER_CODE`, rate-limit knobs, `CLOUDINARY_*`, `SMTP_*` + `MAIL_FROM`, `GOOGLE_*`/`FACEBOOK_*`. No insecure defaults — missing required vars crash boot with a clear message (see `server/src/config/env.ts`).

---

## 7. Backup & resilience

- **Git**: private repo, remote `origin` → `https://github.com/ziad1100/pizza-project.git`, `main`. Secrets + data dirs excluded (`.env*`, `server/.data/`, `server/uploads/`, `backups/`); secrets mirrored to `backups/secrets/` (git-ignored)
- **DB backups**: `npm run backup:db` produces, into `OneDrive\PizzaBackups\db\`:
  - `postgres-pizza-<stamp>.sql.gz` — Postgres dump (pg_dump on PATH → `docker exec supabase-db` → `supabase db dump`), and
  - `pizza-<stamp>.gz` — legacy Mongo dump (container `pizzaproject-mongo-1`; kept until migration completes)
- **One command**: `npm run backup` = DB dump(s) + data copy + git commit + push (`scripts/backup.mjs`)
- **Automation**: Windows scheduled task `ORABIBackup` runs `scripts/backup.ps1` daily 03:00 (log → `OneDrive\PizzaBackups\backup.log`)
- Full runbook: `BACKUP.md`

---

## 8. Docker deployment

- **Dockerfile**: multi-stage (`node:22-alpine` build → slim runtime running `server/dist/server.js` as the `node` user)
- **docker-compose.yml**: `mongo:7` (legacy) + `redis:7-alpine` + `app` (builds image, `5000:5000`, env pass-through from host `.env`, uploads volume). Postgres/Supabase compose is optional; local Supabase is the default PG source
- Run: `docker compose up --build`; SPA + API at `http://localhost:5000`
- Validate: `SMOKE_BASE=http://localhost:5000 npm run smoke:ui`

---

## 9. Status & known limitations

- **Gates**: `tsc --noEmit` clean (client + server), Vitest **175/175 across 21 files** (`server/src/test/**`), puppeteer smoke 18/18 in dev + production mode. ESLint is clean for scripts/new code; a few pre-existing warnings remain in `server/src/db/*` (`__total` unused) and `LoginPage.tsx` (setState in effect) from the Postgres migration
- **PostgreSQL migration**: the stack moved from Mongo/Mongoose to PostgreSQL (`pg` + Supabase). Test suite runs against a disposable `postgres:16-alpine` container (port 54329, schemas from `supabase/migrations/`) with a Docker-free CI path via `TEST_DATABASE_URL`. A mongo→postgres data migration script remains as the last Mongo-dependent piece
- **Security hardening** (see `docs/SECURITY_AUDIT.md`): findings S1–S9/S11 fixed — server-side auth role lock + session revocation + hashed tokens at rest, pricing from DB values, unknown extras → 400, upload magic-byte validation, rate-limit knobs, activity-log redaction; S7 verified via posts guard tests; S10/S12 documented. Follow-ups (MFA, direct RLS enforcement at the app layer, sessions/devices UI) are roadmap
- **Redis/BullMQ**: cache layer + job queue in place; `REDIS_URL` optional (degrades gracefully)
- **Docs**: security/ops docs under `docs/` (SECURITY_AUDIT, SECURITY_ARCHITECTURE_AUDIT, SECURITY, AUTHENTICATION, ADMIN_AUTHORIZATION, RLS_POLICIES, API_SECURITY, SECRET_MANAGEMENT, THREAT_MODEL, INCIDENT_RESPONSE, SECRET_ROTATION, OPERATIONS, LOAD_TESTS, PERFORMANCE_AUDIT, google-oauth-setup)
- Full history of product/brand/UX fixes is preserved in git log (rebrand to ORABI, theme app-wide, menu realignment to `Menu_Prices.xlsx`, image trimming 13.62 MB → 9.87 MB, blog list contract fix, checkout E2E, CORS fix, dev fallback password-reset code, etc.)
- No client test suite — server is covered by unit + API integration; client is covered by TypeScript, ESLint, and the puppeteer smoke suite

---

## 10. Known issues / next steps

- `scripts/backup-db.mjs` still writes the Postgres archive via a toolchain search; when none of pg_dump / supabase-db container / supabase CLI is available it prints a clear skip (DB dump failing is loud, not silent)
- `restore:db` currently covers Mongo archives only; Postgres restores go through `psql -f` into the target DB (see BACKUP.md)
- Docker Desktop is NOT available on this dev machine right now — any container-dependent verification (compose up, smoke against container) needs it started
- Mongo-legacy pieces (`.env.example` `MONGO_URI`, `docker-compose.yml` mongo service, `backup-db.mjs` mongo section) are retained until the mongo→postgres migration is run once against the real data
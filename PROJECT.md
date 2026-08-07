# ORABI Restaurant — Full Project Documentation

Full-stack fast-food restaurant platform (مطعم عرابي): an RTL-first bilingual (Arabic/English) storefront, a customer menu dashboard, an Express REST API with Mongo/Mongoose, role-based access control, email notifications, optional social login, and a containerized production build.

- **Client**: React 19, Vite 8, TypeScript, Tailwind CSS v4, Redux Toolkit, TanStack Query v5, react-hook-form + zod, i18next, react-router v8, sonner, swiper, framer-motion
- **Server**: Express, Mongoose, helmet, express-rate-limit, express-validator, multer (local disk or Cloudinary), nodemailer, Passport (Google/Facebook OAuth), JWT access token + refresh cookie
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
│  │  ├─ config/         # env, mailer, passport, cors, cloudinary
│  │  ├─ constants/      # roles, resources, permissions, order/payment enums, settings
│  │  ├─ controllers/    # one controller per resource (19)
│  │  ├─ database/       # connection, seed, roleSync
│  │  ├─ middlewares/    # auth, upload, validate, rateLimit, errorHandler, activityLogger
│  │  ├─ models/         # 21 Mongoose models
│  │  ├─ routes/         # 20 route modules + index
│  │  ├─ services/       # coupon.service, email.service
│  │  ├─ scripts/        # one-off maintenance scripts (cleanup-smoke)
│  │  ├─ test/           # Vitest + Supertest suite (setup, helpers, API tests)
│  │  ├─ utils/          # ApiError, ApiResponse, asyncHandler, token, cookies, slugify (+ unit tests)
│  │  └─ validators/     # express-validator rules
│  └─ .data/db           # dev-only persistent in-memory Mongo (mongodb-memory-server)
├─ scripts/smoke_ui.mjs  # 18-check puppeteer end-to-end smoke suite
├─ public/               # favicon, icons sprite
├─ dist/                 # client production build (built)
├─ Dockerfile / .dockerignore / docker-compose.yml
└─ README.md             # quick-start guide
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
- Static `/uploads` (local uploads dir)
- `express-mongo-sanitize`, morgan (non-test), rate limiting on `/api` (300 req / 15 min)
- API under `/api/v1`
- **Production**: serves client `dist/` with `7d immutable` caching (index.html `no-cache`) + SPA fallback for non-`/api` `/uploads` paths

### Routing (`server/src/routes/index.ts`)
20 modules, each mapped to a resource: `auth`, `user` (account/addresses), `adminUser` (user management), `product`, `category`, `cart`, `order`, `review`, `coupon`, `offer`, `banner`, `branch`, `post`, `contact`, `newsletter`, `notification`, `setting`, `analytics`, `upload`, `wishlist`.

### Models (21)
`User`, `Role`, `Permission`, `Product`, `Category`, `Cart`, `Order`, `Review`, `Coupon`, `Offer`, `Banner`, `Branch`, `Post`, `Contact`, `Newsletter`, `Notification`, `Setting`, `DeliveryZone`, `Wishlist`, `Analytics`, `ActivityLog`.

### RBAC
- Roles: `admin`, `manager`, `employee`, `customer` (see `server/src/constants/index.ts`)
- Resources (16): products, categories, orders, users, branches, offers, banners, coupons, reviews, contacts, newsletter, notifications, settings, analytics, activity, posts
- Actions (5): create, read, update, delete, hide
- `PERMISSION_PRESETS` define per-role matrix; `requirePermission(resource, action)` middleware enforces server-side; `roleSync.ts` non-destructively upserts roles/permissions at boot
- Client mirrors checks with route guards and permission-aware admin UI

### Auth & security
- Local register/login (bcrypt), email verification + password reset tokens, JWT access token (15 m) in Authorization header + refresh token (7 d) in HttpOnly cookie
- `authLimiter` on auth endpoints
- Passport Google + Facebook OAuth — routes (`/auth/google`, `/auth/facebook`) only registered when provider env keys exist; callback redirects to `{CLIENT_URL}/auth/callback?accessToken=...`; `/auth/providers` reports which providers are enabled (drives client button visibility)

### Uploads
- multer disk storage → `server/src/uploads` (5 MB, jpeg/png/webp/gif/avif, fields `image` / `images` up to 10)
- When Cloudinary env vars are set, uploads route through Cloudinary instead
- Prod bundle resolves the dir to `server/uploads` (mounted as a volume in Docker)

### Email (`server/src/config/mailer.ts` + `services/email.service.ts`)
- Nodemailer SMTP transporter when `SMTP_HOST/USER/PASS` set; otherwise a dev fallback that logs to console
- Templates: verification email, password reset, order confirmation
- **Password reset dev fallback**: `forgotPassword` issues a 6-digit numeric code (`crypto.randomInt`) as the reset token (the emailed link `/reset-password?token=<code>` uses the same value, so no separate OTP flow). When SMTP is unconfigured, the response includes `{ code, link }` so the client can show the code inline ("Development mode" panel); when SMTP is configured the response stays `null` (anti-enumeration preserved). Gate is `smtpConfigured`, exported from `mailer.ts`. Client surfaces it in `ForgotPasswordPage` (dev panel with 6-digit code + "Continue to reset password" link) via the `DevResetPayload` type in `src/api/auth.ts`.

### Utilities
- `ApiError` / `ApiResponse` (uniform `{success, statusCode, message, data}` envelope), `asyncHandler`, token/cookie helpers, slugify

---

## 4. Database & seeding

- **Dev**: `MONGO_URI` empty → `mongodb-memory-server` with a **persistent** data dir `server/.data/db`; auto-seeds on first boot
- **Real DB**: set `MONGO_URI` (e.g. Atlas, local, or Docker `mongo` service)
- **Seed script** (`npm run seed`) — destructive (wipes collections), creates:
  - Roles + permission presets
  - 4 users (password `Pizza123!`): `admin@pizzahouse.dev`, `manager@pizzahouse.dev`, `employee@pizzahouse.dev`, `customer@pizzahouse.dev`
  - 24 categories, 107 products (6 menu sections matching the real ORABI menu from `Menu_Prices.xlsx`: Italian, Eastern, Feteer, Rocket Roll, Sweet Feteer, Meshaltet) with sizes/extras, real dish photos bundled in `public/images/products` (58 images mapped by slug, 600×600), ~10 flagged `isBestSeller` + ~10 flagged `isOffer` (with discount %), coupons, offers, banners, a single real ORABI branch (no address/maps), posts (with images), reviews, delivery zones, default settings
  - A pre-filled cart for `customer@pizzahouse.dev` (2× Chicken, Margherita, Chocolate) — hydrated client-side on login when localStorage `ph_cart` is empty
- **roleSync**: on server boot, ensures roles/permissions exist and match presets (non-destructive upsert)

---

## 5. Scripts (root package.json)

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server (:5173, proxies `/api` `/uploads` → :5000) |
| `npm run dev:server` | Backend via `tsx watch` |
| `npm run dev:all` | Both concurrently |
| `npm run build` | Client: `tsc -b` + `vite build` → `dist/` |
| `npm run build:server` | Server: `tsc --noEmit` + esbuild bundle → `server/dist/server.js` |
| `npm run seed` | Destructive reseed |
| `npm run test` | Vitest suite (115 checks): unit (coupon service, tokens, slugify, DB path, RBAC middleware, social-auth callback) + API integration (auth, order lifecycle, catalog/reviews incl. best-sellers/offers, RBAC matrix, OAuth providers) on an ephemeral in-memory Mongo |
| `npm run test:watch` | Vitest watch mode |
| `npm run cleanup:smoke` | Idempotent dev-DB cleanup of smoke-test orders; `npm run cleanup:smoke:list` previews (dry run) |
| `npm run start` | Production server (`NODE_ENV=production`), serves SPA + API on `PORT` |
| `npm run smoke:ui` | Puppeteer end-to-end suite (18 checks, `SMOKE_BASE` configurable) |
| `npm run lint` | ESLint (react-hooks/ref rules) |
| `npm run preview` | Vite preview of built client |

### Verification workflow
1. `npm run test` — 115/115 green
2. `npm run build` + `npm run build:server`
3. `npm run lint`
4. `npm run smoke:ui` (dev servers running) — 18/18 expected
5. Production check: `npm start` with a real `MONGO_URI`, then `SMOKE_BASE=http://<host>:<port> npm run smoke:ui`
6. `npm audit` — clean (react-router 8.3.0, nodemailer 9.0.4)

---

## 6. Environment variables

Documented inline in `server/.env.example` (including a production checklist). Key groups: `PORT`, `NODE_ENV`, `MONGO_URI`, `JWT_*`, `COOKIE_SECURE`, `CLIENT_URL`, `CLOUDINARY_*`, `SMTP_*`, `GOOGLE_*`/`FACEBOOK_*`. Dev fallbacks live in `server/src/config/env.ts`.

---

## 7. Backup & resilience

- **Git**: repo initialized, remote `origin` → `https://github.com/ziad1100/pizza-project.git` (private, `main`). Secrets and data dirs excluded via `.gitignore` (`.env`, `server/.env`, `server/.data/`, `server/uploads/`, `backups/`); secrets mirrored to `backups/secrets/` (git-ignored).
- **DB backups**: `npm run backup:db` → `mongodump --archive --gzip` inside the mongo container → `C:\Users\<you>\OneDrive\PizzaBackups\db\pizza-<stamp>.gz` (auto-synced to the cloud); legacy `server/.data/db` copied into the same set. `npm run restore:db [file] [--drop]` restores (verified 182 docs).
- **One command**: `npm run backup` = DB dump + data copy + `git commit` + `git push origin main` (`scripts/backup.mjs`).
- **Automation**: Windows scheduled task `ORABIBackup` runs `scripts/backup.ps1` daily at 03:00 (log → `OneDrive\PizzaBackups\backup.log`).
- Full runbook: `BACKUP.md`.

---

## 8. Docker deployment

- **Dockerfile**: multi-stage — `node:22-alpine` build stage (`npm ci` → client + server builds → `npm prune --omit=dev`) then slim runtime stage running `node server/dist/server.js` as the `node` user with chowned `/app/server/dist/uploads`
- **docker-compose.yml**: `mongo:7` service (healthchecked, named volume) + `app` (builds the image, `5000:5000`, env pass-through from host `.env`, uploads volume)
- Run: `docker-compose up --build`; SPA + API at `http://localhost:5000`
- Note: the image does not ship seed sources — seed a fresh DB separately (`npm run seed` with `MONGO_URI` pointing at the compose Mongo on `localhost:27017`), and validate with `SMOKE_BASE=http://localhost:5000 npm run smoke:ui`

---

## 8. Status & known limitations

- All build/lint/typecheck gates green; smoke suite 18/18 in both dev and production modes
- Order persistence verified against a real MongoDB in production mode
- **Test suite (added)**: Vitest + Supertest, 108 checks first pass, now 115 (best-sellers/offers routes added). Building it exposed and fixed three latent bugs: `errorHandler` was declared with 3 args, so Express never treated it as an error handler and API errors returned the default HTML page instead of the `{success, message}` JSON envelope; `verifyEmail` and `resetPassword` queried expiry fields that are `select: false` without selecting them, so email verification and password reset always failed with 400
- **Brand/production pass (ORABI Restaurant)**: rebranded the storefront from "Pizza House" to "مطعم عرابي / ORABI Restaurant" — `DEFAULT_SETTINGS` (name, tagline, daily 10AM–3AM hours, phone `01070003535`, WhatsApp, Facebook/Instagram), `index.html` meta/title, Header/Footer logos, copyright, email templates (`email.service.ts`) and `MAIL_FROM`. Homepage updated with real stats: 107 menu items, 4.6★ customer rating stat + a 5-star "449+ Google reviews" trust bar. Location/Google Maps intentionally omitted per client request.
- New seed catalog (realigned to `Menu_Prices.xlsx`): removed the invented Fast Food section (~27 AR/EN sandwiches/oriental/grills/sides/desserts/drinks items) — the catalog is now exactly the 107 real ORABI items across 6 sections / 24 categories (6 sections + 18 subs); every product now ships with a real food photo from Wikimedia Commons (`public/images/products/<slug>.jpg`, 58 unique images covering the 107 items) instead of picsum placeholders; ~10 products stay flagged `isOffer` with a discount % (feeds the homepage Deals row) and ~10 `isBestSeller`. Non-pizza descriptions no longer read "بيتزا …".
- **Real light/dark theme**: the old toggle only swapped the `<body>` background while every component kept hard-coded night-* tokens — light mode rendered mixed white-on-dark cards. The palette is now driven entirely by `--tw-night-*` CSS variables defined in `src/index.css` and redefined for light mode; the remaining hardcoded `text-white` instances (brand/gold solid buttons, hero overlay CTA) were swept to `text-night-50`. `index.html` hardcodes `data-theme="dark"` on `<html>`, and ThemedToaster re-renders off the store theme (the pre-paint first-paint behavior is covered in the next bullet).
- **Theme applies app-wide (admin included)**: the theme effect originally lived only in the public `Header`, so a hard-load of `/admin` never re-applied the stored theme (it rendered dark regardless of `ph_theme`). Fixes: an inline script in `index.html` reads `ph_theme` **before first paint** and sets `data-theme` (plus the `theme-color` meta — `#0D0D0D` dark / `#FAFAFA` light, so the mobile browser chrome matches), a root `ThemeBootstrap` component (calls `useTheme()` in `src/App.tsx`) re-applies the store theme on every route, and the admin header gained its own `aria-label="theme"` toggle button (mirroring the public header). Light-mode users now get a light first paint — no dark flash on reload, and admin honors the persisted theme.
- **Homepage section routes added**: `GET /api/v1/products/best-sellers` and `GET /api/v1/products/offers` (registered before the `/:slug` route, which previously 404'd them), returning available-only products; the dead `getFeatured()` client call was removed. Verified by 2 new catalog tests.
- **Seeded demo cart**: `customer@pizzahouse.dev` starts with 3 items; on login the client hydrates localStorage `ph_cart` from `GET /cart` when the local cart is empty.
- Mojibake hygiene: fixed `Footer.tsx` (`Ø§Ù„Ù‚Ø§Ù‡Ø±Ø©…`, `Â©`) and `ProductPage.tsx` (`Ø` minutes-unit) via a new `menu.minutes` i18n key; repo grep confirms no remaining `Ø`/`Â` artifacts in client or server sources.
- **Prod-mode smoke exposed a fourth bug (fixed)**: the persistent dev-Mongo path was derived from `import.meta.url` with two `..` hops — correct under `tsx` (`server/.data/db`) but wrong in the bundled `server/dist/server.js` (`<repo>/.data/db`), so production mode booted against an empty second database. The resolution moved to `server/src/utils/dbPath.ts` (unit-tested) and now anchors at the server workspace in both source and bundled modes; the stray root `.data/` store was removed
- **Dev DB**: the two lingering smoke orders (`PH-597747-2112`, `PH-018673-6449`) were removed via `npm run cleanup:smoke`; the 11 reviews present were confirmed as seed data (not artifacts) and kept. The script is idempotent (`--list` previews)
- Docker deployment built and verified on this machine (`docker compose up`): Mongo `:27017` published for host-side seeding, app on `:5000`, seeded DB, smoke 18/18 against the container in production mode
- Docker build fixes applied: split the `COPY package.json package-lock.json server/package.json ./` into explicit-path COPYs (Windows BuildKit conflated the two `package.json` files), made `mongodb-memory-server` a lazy dynamic import (devDep pruned in the image), and aligned the uploads dir (`server/uploads`) between code, Dockerfile, and compose volume target
- Social OAuth: handler-level unit tests cover the find-or-create + redirect flow and the `/auth/providers` enable/disable contract; live E2E login still requires real Google/Facebook app credentials
- **Blog list contract fix (client)**: `GET /api/v1/posts` returns a paginated envelope (`data.items`), but `listPosts` (src/api/posts.ts) was typed as `Promise<Post[]>` — `unwrap()` handed BlogPage the paginated object and `posts.map` crashed (`TypeError: posts.map is not a function`). `listPosts` now returns `Paginated<Post>` and BlogPage consumes `posts.items ?? []` (same pattern as MenuPage/admin pages); verified by a puppeteer run over `/blog` + `/blog/:slug` (no page errors, both seeded posts render)
- **Checkout flow end-to-end verified**: the smoke suite covered no cart→order path, so a one-off puppeteer run exercised it — customer login → `/checkout` (seeded 3-item demo cart) → place cash order → success toast + redirect to `/orders` → order number rendered (no page errors). The created test order was then removed from the dev DB (0 orders remain); the scripted `cleanup:smoke` only targets two historical order numbers
- **Image payload trimmed**: all 60 real dish photos (`public/images/products` + blog) re-encoded at JPEG quality 80 with System.Drawing — 13.62 MB → 9.87 MB (the two 1.4 MB PNG-sourced files became ~200 KB each); all files still decode and filenames are unchanged (no seed impact)
- **Stray dev DB dropped**: an empty `pizza-house-test` database (accidentally created while pointing the cleanup script at a wrong DB name) was removed; the dev mongod now hosts only `test`
- **CORS fix (`CLIENT_URL`)**: admin-customer register form failed with "Not allowed by CORS". Root `.env` pinned `CLIENT_URL=http://localhost:5000` (overriding the compose default) but the client dev server runs on `:5173`, so browser POSTs were blocked. Changed to `http://localhost:5173` and rebuilt the container — origin `5173` now gets `Access-Control-Allow-Origin`, preflight OPTIONS 204, evil origins rejected. Lesson: the root `.env` (not `docker-compose.yml`) wins.
- **Gallery page added**: new `/gallery` storefront page (`src/pages/GalleryPage.tsx`) rendering 16 real dish photos with captions and hover zoom, backed by a static array of verified existing `public/images/products/*.jpg` (no new backend); `gallery` i18n block added to `en.json`/`ar.json` + `nav.gallery`, iterated on the nav. A smoke check asserts ≥4 product images render.
- **Menu realignment to latest `Menu_Prices.xlsx` re-export** (107 items final): dropped the Italiano Meat "Sausage" row (6 items) + Sweet Fatir Chocolate Banana; added Italiano Mix Chicken/Pastrami/Meat Mix and Chicken/Beef/Sausage; converted the Rocket trio + Arayes; product sizes reordered to `[small, medium, large]` with `null` for unoffered sizes. Renamed/new items carry explicit `image` overrides in `seedData.ts` (e.g. `chicken-ranch-chicken.jpg`, `sweet-mix-sweet-feteer.jpg`, `sausage-rocket-roll.jpg`, `orabi-rocket-roll.jpg`, `chicken-bbq-chicken.jpg`); `seed.ts` resolves `item.image ?? derived-slug` and fails fast on missing files; config test asserts the 107 count.
- **Password reset dev fallback (forgot-password/OTP)**: `forgotPassword` now issues a 6-digit numeric code as the reset token (emailed link and code are the same value). When SMTP is unconfigured the API returns `{ code, link }` and `ForgotPasswordPage` shows a "Development mode" panel with the code + a "Continue to reset password" button; when SMTP is set, the response is `null` (anti-enumeration preserved) and a real email sends. Purely config-gated via `smtpConfigured`. Smoke suite regression previously waited for a reset "link sent" message that never appeared in dev; now asserts the 6-digit code renders, prints a throwaway user, reset-password via the code, and login with the new password.
- **Login "register" link text fixed**: the login form rendered the literal key `auth.register` (only `nav.register` existed). Added `auth.register` (`"Register"` / `"تسجيل"`) to the `auth` block in `en.json`/`ar.json`.
- **Show/hide password toggles**: new reusable `PasswordInput` in `src/components/ui/Input.tsx` (existing `Input` + RTL-aware `Eye`/`EyeOff` lucide button toggling `password`↔`text`, `type="button"`, `aria-label`, logical `pe-10`/`end-3`). Applied to all password/confirm-password inputs on `LoginPage`, `RegisterPage`, and `ResetPasswordPage`.
- No client-side test suite — server coverage is unit + API integration; client is covered by TypeScript, ESLint, and the puppeteer smoke suite

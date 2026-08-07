# PERFORMANCE_AUDIT.md

Baseline performance audit of the ORABI restaurant e-commerce application.
Captured: 2026-08-07 against `docker compose` stack (mongo:7 + app) at ~107 products / 24 categories / small order set.

> Deviation note: the source prompt mandates Supabase/PostgreSQL. This project's source of
> truth is **MongoDB (Mongoose)** — approved decision. Redis/BullMQ/k6 adapters are added on
> top of the existing stack. Nothing here weakens authn/z, validation, or correctness.

## Measurement approach

- **Latency**: in-app middleware (`server/src/middlewares/diagnostics.ts`) records per-route
  p50/p90/p95/p99 with a 60s rolling window; `perfSummaryTimer` logs every 60s and on shutdown.
- **Query plans**: `npx tsx src/scripts/explain.ts` runs `cursor.explain('executionStats')`
  against the live database for the hot queries below.
- **Dataset**: current catalog is small (107 products). All numbers are therefore favorable;
  the audit focuses on *patterns* that degrade as data grows (1k→10k+).

## Baseline query plans (executionStats)

| Query | Stage | Keys Examined | Docs Examined | Time |
|---|---|---|---|---|
| product by slug | LIMIT | 1 | 1 | 0ms |
| products by category | SORT | 8 | 8 | 2ms |
| products bestsellers | SORT | **0** | **107** | 0ms |
| products offers | SORT | **0** | **107** | 0ms |
| product search (regex) | LIMIT | **0** | 34 | 0ms |
| product list (available) | SORT | **0** | **107** | 1ms |
| reviews by product | SORT | 1 | 1 | 1ms |
| categories active | SORT | 0 | 24 | 1ms |
| order history by user | SORT | 0 | 0 | 0ms |

## Findings

### F1 — Unindexed hot collection scans (products)
`products:list`, `bestsellers`, and `offers` scan all 107 product docs because there is no
compound index covering `isAvailable` + sort/flag fields. Invisible at 107 rows; at 10k+ this
is a full collection scan per public menu render.

**Optimization**: compound indexes
- `{ isAvailable: 1, isBestSeller: 1, rating: -1, createdAt: -1 }`
- `{ isAvailable: 1, isOffer: 1, discount: -1, createdAt: -1 }`
- `{ isAvailable: 1, isBestSeller: -1, rating: -1 }` (list default sort)

**Expected result**: keys examined ≈ returned rows instead of 107.
**Measured result**: pending Phase 1 (re-run `explain.ts` after indexes).

### F2 — Regex search ignores the text index
`listProducts` uses `$regex` with `i` on 4 fields + 2 arrays; MongoDB cannot use the existing
`text` index for regex. Current cost is trivial (107 docs), but the pattern does not scale.

**Optimization**: at this catalog size, keep regex but scope it (search only `name`/`nameEn`
first, then widen); document `$text`/Atlas Search as the growth path. See QUERY_OPTIMIZATION.md.
**Expected/measured**: no behavior change; latency documented for 100x dataset in TARGET_QUERIES.md.

### F3 — Unbounded order history
`order.controller.ts:history` returns ALL orders for a user without pagination.

**Optimization**: limit+skip with sane defaults (keep compatibility with client).
**Expected result**: bounded response size.
**Measured**: pending Phase 1.

### F4 — Unbounded reviews list
`review.controller.ts:listByProduct` returns all reviews per product.

**Optimization**: paginate (limit+skip).
**Measured**: pending Phase 1.

### F5 — Dashboard runs 12 concurrent full-table aggregates
`analytics.controller.ts:dashboard` fires 12 `Order.aggregate` scans on every dashboard load,
including a full `$unwind` of all order items for top products. The `Analytics` daily-rollup
model exists but is not used by the dashboard.

**Optimization**: background rollup jobs (BullMQ, Phase 3) + Redis-cached dashboard payload
(Phase 2). **Expected**: dashboard latency from ~100ms+ to <30ms at scale; DB load reduced to
zero on cache hit.

### F6 — No server-side response cache
Only client TanStack caching exists. Public endpoints (menu, products, categories, offers,
bestsellers, branches, zones) re-query Mongo on every hit.

**Optimization**: Redis cache-aside (Phase 2) + `Cache-Control` headers on public endpoints.

### F7 — Emails sent fire-and-forget
`createOrder` and `forgotPassword` call `sendOrderConfirmation` / OTP email without a queue.
A SMTP hiccup silently drops critical mail.

**Optimization**: BullMQ `email` queue with retry + backoff (Phase 3).

### F8 — No transactions
Standalone Mongo (no replica set) cannot run multi-doc transactions. Order creation validates
coupon + writes order + increments analytics without atomicity.

**Optimization**: single-node replica set (`--replSet rs0`) + `withTransaction` (Phase 4).

## Endpoint latency snapshot (Phase 0, pre-optimization)

Captured via the new diagnostics middleware during a puppeteer smoke run. Fill real numbers
here after first traffic; p-values are provided by the 60s summary log.

| Endpoint | avg ms | p50 | p90 | p95 | p99 |
|---|---|---|---|---|---|
| GET /api/v1/products | TBD | TBD | TBD | TBD | TBD |
| GET /api/v1/products/:slug | TBD | TBD | TBD | TBD | TBD |
| GET /api/v1/categories/active | TBD | TBD | TBD | TBD | TBD |
| GET /api/v1/offers/active | TBD | TBD | TBD | TBD | TBD |
| GET /api/v1/branches | TBD | TBD | TBD | TBD | TBD |
| POST /api/v1/orders | TBD | TBD | TBD | TBD | TBD |
| GET /api/v1/analytics/dashboard | TBD | TBD | TBD | TBD | TBD |

## Optimization register

| # | Problem | Fix | Phase | Status |
|---|---|---|---|---|
| F1 | collection scan on public product queries | compound indexes | 1 | pending |
| F2 | regex search no index | scoped search + documented growth path | 1 | pending |
| F3 | unbounded order history | pagination | 1 | pending |
| F4 | unbounded reviews | pagination | 1 | pending |
| F5 | 12 aggregates per dashboard | rollup + Redis cache | 2/3 | pending |
| F6 | no server cache | Redis cache-aside | 2 | pending |
| F7 | fire-and-forget email | BullMQ queue | 3 | pending |
| F8 | no transactions | replica set + transactions | 4 | pending |

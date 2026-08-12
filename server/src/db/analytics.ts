import { query } from './index';

export const bumpDailyStats = async (date: string, revenue: number): Promise<void> => {
  await query(
    `INSERT INTO analytics ("date", revenue, orders) VALUES ($1::date, $2, 1)
     ON CONFLICT ("date")
     DO UPDATE SET revenue = analytics.revenue + EXCLUDED.revenue,
                   orders = analytics.orders + EXCLUDED.orders`,
    [date, revenue],
  );
};

/**
 * Recomputes the daily analytics table for the last `days` days from live
 * order data (the Mongo-era nightly rollup). Only completed orders count as
 * revenue, matching the live totals/period queries, so a late cancellation or
 * a manual DB fix self-heals on the next run.
 */
export const rollupDailyStats = async (days: number): Promise<void> => {
  await query(
    `INSERT INTO analytics ("date", revenue, orders, "newCustomers", "topProducts")
     SELECT d.dt::date,
            COALESCE(SUM(o.total) FILTER (WHERE o.status = 'completed'), 0)::numeric(14,2),
            COUNT(o.id) FILTER (WHERE o.status = 'completed')::int,
            COUNT(DISTINCT o."userId") FILTER (WHERE o.status = 'completed')::int,
            COALESCE((
              SELECT jsonb_agg(sub) FROM (
                SELECT oi."productId"::text AS "_id", oi.name,
                       SUM(oi.qty)::int AS count, SUM(oi."lineTotal")::float8 AS revenue
                FROM order_items oi
                JOIN orders o3 ON o3.id = oi."orderId"
                WHERE o3."createdAt"::date = d.dt::date AND o3.status = 'completed'
                GROUP BY oi."productId", oi.name
                ORDER BY count DESC, revenue DESC
              ) AS sub
            ), '[]'::jsonb) AS "topProducts"
     FROM generate_series(CURRENT_DATE - ($1 - 1)::int, CURRENT_DATE, '1 day'::interval) AS d(dt)
     LEFT JOIN orders o ON o."createdAt"::date = d.dt::date
     GROUP BY d.dt
     ON CONFLICT ("date") DO UPDATE SET
       revenue = EXCLUDED.revenue,
       orders = EXCLUDED.orders,
       "newCustomers" = EXCLUDED."newCustomers",
       "topProducts" = EXCLUDED."topProducts",
       "updatedAt" = now()`,
    [days],
  );
};

export const customersWithOrders = async (): Promise<number> => {
  const rows = await query<{ count: number }>(
    `SELECT count(DISTINCT o."userId")::int AS count FROM orders o
     WHERE o.status = 'completed' AND o."userId" IS NOT NULL`,
  );
  return rows[0]?.count ?? 0;
};

export const totals = async (): Promise<Record<string, number>> => {
  const rows = await query(`
    SELECT
      (SELECT COALESCE(SUM(total), 0)::float8 FROM orders WHERE status = 'completed') AS revenue,
      (SELECT COALESCE(SUM(total), 0)::float8 FROM orders WHERE status = 'completed') AS "netRevenue",
      (SELECT COALESCE(SUM(subtotal + "deliveryFee"), 0)::float8 FROM orders WHERE status = 'completed') AS "grossRevenue",
      (SELECT COALESCE(SUM(discount), 0)::float8 FROM orders WHERE status = 'completed') AS discounts,
      (SELECT COALESCE(SUM("deliveryFee"), 0)::float8 FROM orders WHERE status = 'completed') AS "deliveryFees",
      (SELECT count(*)::int FROM orders) AS orders,
      (SELECT count(*)::int FROM orders WHERE status = 'completed') AS "completedOrders",
      (SELECT count(*)::int FROM orders WHERE status = 'cancelled') AS "cancelledOrders",
      (SELECT count(*)::int FROM orders WHERE status = 'refunded') AS "refundedOrders",
      (SELECT count(*)::int FROM orders WHERE status = 'complimentary') AS "complimentaryOrders",
      (SELECT count(*)::int FROM users WHERE role = 'customer') AS customers,
      (SELECT count(*)::int FROM products) AS products`);
  return rows[0] as Record<string, number>;
};

export const recent = async (since: Date): Promise<Record<string, number>> => {
  const rows = await query(
    `SELECT
       (SELECT COALESCE(SUM(total), 0)::float8 FROM orders WHERE "createdAt" >= $1 AND status = 'completed') AS revenue,
       (SELECT count(*)::int FROM orders WHERE "createdAt" >= $1) AS orders,
       (SELECT count(*)::int FROM users WHERE "createdAt" >= $1 AND role = 'customer') AS customers`,
    [since],
  );
  return rows[0] as Record<string, number>;
};

export const statusBreakdown = async (): Promise<Array<{ _id: string; count: number }>> => {
  const rows = await query<{ _id: string; count: number }>(
    `SELECT status::text AS "_id", count(*)::int AS count
     FROM orders GROUP BY status ORDER BY status`,
  );
  return rows;
};

export const topProducts = async (): Promise<Array<Record<string, unknown>>> => {
  return (await query(
    `SELECT oi.name AS "_id", sum(oi.qty)::int AS count, sum(oi."lineTotal")::float8 AS revenue
     FROM order_items oi
     JOIN orders o ON o.id = oi."orderId"
     WHERE o.status = 'completed'
     GROUP BY oi.name
     ORDER BY count DESC, revenue DESC
     LIMIT 8`,
  )) as Array<Record<string, unknown>>;
};

/** Units + revenue per sub-category from completed orders (for dashboards/exports). */
export const categorySales = async (): Promise<Array<Record<string, unknown>>> => {
  return (await query(
    `SELECT c.name, c."nameEn" AS "nameEn",
            COALESCE(SUM(oi.qty), 0)::int AS units,
            COALESCE(SUM(oi."lineTotal"), 0)::float8 AS revenue
     FROM order_items oi
     JOIN orders o ON o.id = oi."orderId"
     JOIN products p ON p.id = oi."productId"
     JOIN categories c ON c.id = p."categoryId"
     WHERE o.status = 'completed'
     GROUP BY c.id, c.name, c."nameEn", c."sortOrder"
     ORDER BY revenue DESC, units DESC`,
  )) as Array<Record<string, unknown>>;
};

export const trend = async (since: Date): Promise<Array<Record<string, unknown>>> => {
  return (await query(
    `SELECT to_char(o."createdAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS "_id",
       COALESCE(SUM(o.total), 0)::float8 AS revenue,
       count(*)::int AS orders,
       COALESCE(SUM(oi.qty), 0)::int AS "unitsSold"
     FROM orders o
     LEFT JOIN order_items oi ON oi."orderId" = o.id
     WHERE o."createdAt" >= $1 AND o.status = 'completed'
     GROUP BY 1
     ORDER BY 1`,
    [since],
  )) as Array<Record<string, unknown>>;
};

export interface PeriodStats {
  revenue: number;
  orders: number;
  unitsSold: number;
  customers: number;
  topProducts: { _id: string; name: string; count: number; revenue: number }[];
}

export const periodStats = async (start: Date): Promise<PeriodStats> => {
  const [totalsRow, top] = await Promise.all([
    query(
      `SELECT
         (SELECT COALESCE(SUM(o2.total), 0)::float8 FROM orders o2
          WHERE o2."createdAt" >= $1 AND o2.status = 'completed') AS revenue,
         (SELECT count(*)::int FROM orders o2
          WHERE o2."createdAt" >= $1 AND o2.status = 'completed') AS orders,
         (SELECT COALESCE(SUM(oi.qty), 0)::int FROM order_items oi
          JOIN orders o2 ON o2.id = oi."orderId"
          WHERE o2."createdAt" >= $1 AND o2.status = 'completed') AS "unitsSold",
         (SELECT count(DISTINCT o2."userId")::int FROM orders o2
          WHERE o2."createdAt" >= $1 AND o2.status = 'completed') AS customers`,
      [start],
    ),
    query(
      `SELECT oi."productId"::text AS "_id", oi.name, sum(oi.qty)::int AS count,
         sum(oi."lineTotal")::float8 AS revenue
       FROM order_items oi
       JOIN orders o2 ON o2.id = oi."orderId"
       WHERE o2."createdAt" >= $1 AND o2.status = 'completed'
       GROUP BY oi."productId", oi.name
       ORDER BY count DESC, revenue DESC
       LIMIT 5`,
      [start],
    ),
  ]);
  const totals = (totalsRow as Array<Record<string, number>>)[0] ?? {};
  return {
    revenue: totals.revenue,
    orders: totals.orders,
    unitsSold: totals.unitsSold,
    customers: totals.customers,
    topProducts: top as unknown as PeriodStats['topProducts'],
  };
};

export interface DayStats {
  orders: number;
  completed: number;
  cancelled: number;
  refunded: number;
  complimentary: number;
  revenue: number;
  grossRevenue: number;
  discounts: number;
  deliveryFees: number;
}

/** Live per-day financial breakdown for a single date (DB source of truth). */
export const dayStats = async (date: string): Promise<DayStats> => {
  const rows = await query(
    `SELECT
       (SELECT count(*)::int FROM orders WHERE "createdAt"::date = $1::date) AS orders,
       (SELECT count(*)::int FROM orders WHERE "createdAt"::date = $1::date AND status = 'completed') AS completed,
       (SELECT count(*)::int FROM orders WHERE "createdAt"::date = $1::date AND status = 'cancelled') AS cancelled,
       (SELECT count(*)::int FROM orders WHERE "createdAt"::date = $1::date AND status = 'refunded') AS refunded,
       (SELECT count(*)::int FROM orders WHERE "createdAt"::date = $1::date AND status = 'complimentary') AS complimentary,
       (SELECT COALESCE(SUM(total), 0)::float8 FROM orders WHERE "createdAt"::date = $1::date AND status = 'completed') AS revenue,
       (SELECT COALESCE(SUM(subtotal + "deliveryFee"), 0)::float8 FROM orders WHERE "createdAt"::date = $1::date AND status = 'completed') AS "grossRevenue",
       (SELECT COALESCE(SUM(discount), 0)::float8 FROM orders WHERE "createdAt"::date = $1::date AND status = 'completed') AS discounts,
       (SELECT COALESCE(SUM("deliveryFee"), 0)::float8 FROM orders WHERE "createdAt"::date = $1::date AND status = 'completed') AS "deliveryFees"`,
    [date],
  );
  return rows[0] as unknown as DayStats;
};
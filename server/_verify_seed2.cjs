const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(async () => {
  const r = await pool.query(
    `SELECT (SELECT count(*) FROM reviews) AS reviews,
            (SELECT count(*) FROM reviews WHERE "isVerifiedPurchase") AS verified,
            (SELECT count(*) FROM products WHERE "reviewsCount" > 0) AS rated,
            (SELECT count(*) FROM orders WHERE "orderNo" LIKE 'PH-DEMO-%') AS demo_orders`,
  );
  console.log('FRESH-SEED:', JSON.stringify(r.rows[0]));
  await pool.end();
})().catch((e) => { console.error(e.message); process.exit(1); });

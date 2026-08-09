import { query, withTransaction } from './index';
import { ApiError } from '../utils/ApiError';

const REVIEW_COLS = `
  r.id::text AS "_id",
  r."userId"::text AS "user",
  r."productId"::text AS "product",
  r.rating, r.comment, r.images, r."isApproved",
  r."createdAt", r."updatedAt"`;

interface Page<T> {
  items: T[];
  total: number;
  pages: number;
}

const toPage = <T>(rows: Array<Record<string, unknown>>, limit: number): Page<T> => {
  const total = rows[0] ? (rows[0].__total as number) : 0;
  const items = rows.map(({ __total, ...rest }) => rest) as unknown as T[];
  return { items, total, pages: Math.max(1, Math.ceil(total / limit)) };
};

const getById = async (id: string): Promise<Record<string, unknown> | null> => {
  const rows = await query(`SELECT ${REVIEW_COLS} FROM reviews r WHERE r.id = $1::uuid LIMIT 1`, [id]);
  return (rows[0] as Record<string, unknown>) ?? null;
};

export const listByProduct = async (
  productId: string,
  page: number,
  limit: number,
): Promise<Page<Record<string, unknown>>> => {
  const rows = (await query(
    `SELECT count(*) OVER()::int AS __total,
       r.id::text AS "_id",
       r."productId"::text AS "product",
       r.rating, r.comment, r.images, r."isApproved",
       r."createdAt", r."updatedAt",
       jsonb_build_object('_id', u.id::text, 'fullName', u."fullName", 'avatar', u.avatar) AS "user"
     FROM reviews r
     JOIN users u ON u.id = r."userId"
     WHERE r."productId" = $1::uuid AND r."isApproved" = true
     ORDER BY r."createdAt" DESC, r.id
     LIMIT $2 OFFSET $3`,
    [productId, limit, (page - 1) * limit],
  )) as unknown as Array<Record<string, unknown>>;
  return toPage(rows, limit);
};

export const adminList = async (
  page: number,
  limit: number,
  q: string,
  isApproved: string,
): Promise<Page<Record<string, unknown>>> => {
  const conds: string[] = [];
  const values: unknown[] = [];
  const nxt = () => values.length;

  if (isApproved === 'true' || isApproved === 'false') {
    values.push(isApproved === 'true');
    conds.push(`r."isApproved" = $${nxt()}`);
  }
  if (q) {
    values.push(q, q);
    conds.push(
      `EXISTS (SELECT 1 FROM products pp WHERE pp.id = r."productId"
         AND (pp.name ILIKE '%' || $${values.length - 1} || '%' OR pp."nameEn" ILIKE '%' || $${values.length} || '%'))`,
    );
  }
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const rows = (await query(
    `SELECT count(*) OVER()::int AS __total,
       r.id::text AS "_id",
       r.rating, r.comment, r.images, r."isApproved",
       r."createdAt", r."updatedAt",
       jsonb_build_object('_id', u.id::text, 'fullName', u."fullName", 'avatar', u.avatar, 'email', u.email) AS "user",
       jsonb_build_object('_id', p.id::text, 'name', p.name, 'nameEn', p."nameEn", 'images', p.images) AS "product"
     FROM reviews r
     JOIN users u ON u.id = r."userId"
     JOIN products p ON p.id = r."productId"
     ${where}
     ORDER BY r."createdAt" DESC, r.id
     LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, limit, (page - 1) * limit],
  )) as unknown as Array<Record<string, unknown>>;
  return toPage(rows, limit);
};

export const create = async (
  userId: string,
  productId: string,
  rating: number,
  comment: string,
): Promise<Record<string, unknown>> => {
  let reviewId = '';
  await withTransaction(async (tx) => {
    const inserted = await tx.query<{ id: string }>(
      `INSERT INTO reviews ("userId", "productId", rating, comment)
       VALUES ($1::uuid, $2::uuid, $3, $4)
       ON CONFLICT ("userId", "productId")
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment
       RETURNING id`,
      [userId, productId, rating, comment ?? ''],
    );
    reviewId = inserted.rows[0].id;
    await tx.query(
      `UPDATE products SET
         rating = COALESCE(ROUND((SELECT avg(rating) FROM reviews WHERE "productId" = $1)::numeric, 1), 0),
         "reviewsCount" = (SELECT count(*) FROM reviews WHERE "productId" = $1)
       WHERE id = $1::uuid`,
      [productId],
    );
  });
  const review = await getById(reviewId);
  if (!review) throw new ApiError(500, 'Review creation failed');
  return review;
};

export const remove = async (reviewId: string, userId: string): Promise<boolean> => {
  const r = await query(
    `DELETE FROM reviews WHERE id = $1::uuid AND "userId" = $2::uuid RETURNING id`,
    [reviewId, userId],
  );
  return r.length > 0;
};

export const adminRemove = async (reviewId: string): Promise<boolean> => {
  const r = await query(`DELETE FROM reviews WHERE id = $1::uuid RETURNING id`, [reviewId]);
  return r.length > 0;
};

export const moderate = async (reviewId: string, isApproved: boolean): Promise<Record<string, unknown> | null> => {
  const r = await query(
    `UPDATE reviews SET "isApproved" = $2 WHERE id = $1::uuid RETURNING id`,
    [reviewId, isApproved],
  );
  if (!r.length) return null;
  return getById(reviewId);
};
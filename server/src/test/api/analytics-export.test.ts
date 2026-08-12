import { describe, expect, it } from 'vitest';
import { query } from '../../db';
import { api, bearer, createUser, seedRoles } from '../helpers';
import * as XLSX from 'xlsx';

const EXPORT = '/api/v1/analytics/export';

const getXlsx = (headers: Record<string, string>) =>
  api.get(EXPORT).set(headers).buffer(true).parse((res, cb) => {
    const chunks: Buffer[] = [];
    res.on('data', (c: Buffer) => chunks.push(c));
    res.on('end', () => cb(null, Buffer.concat(chunks)));
  });

describe('analytics export', () => {
  it('returns a valid xlsx workbook for admins', async () => {
    await seedRoles();
    const admin = await createUser({ role: 'admin' });
    const customer = await createUser({ role: 'customer' });

    const res = await api.get(EXPORT).set(bearer(customer.id)).expect(403);
    expect(res.status).toBe(403);

    const ok = await getXlsx(bearer(admin.id)).expect(200);
    expect(ok.headers['content-type']).toContain('spreadsheetml.sheet');
    expect(String(ok.headers['content-disposition'])).toMatch(/dashboard-report-.*\.xlsx/);

    const body = ok.body as Buffer;
    expect(body.length).toBeGreaterThan(100);
    expect(body.subarray(0, 2).toString('latin1')).toBe('PK');

    const wb = XLSX.read(body, { type: 'buffer' });
    const sheets = wb.SheetNames;
    expect(sheets).toContain('Dashboard Summary');
    expect(sheets).toContain('Period Sales');
    expect(sheets).toContain('Daily Trend');
    expect(sheets).toContain('Orders');
    expect(sheets).toContain('Products');
    expect(sheets).toContain('Categories');
    expect(sheets).toContain('Customers & Reviews');

    const summary = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['Dashboard Summary']);
    const metrics = summary.map((r) => Object.values(r)[0]);
    expect(metrics).toContain('Total Revenue');
    expect(metrics).toContain('Total Orders');
    expect(metrics).toContain('Total Customers');
    expect(metrics).toContain('Total Products');
  });

  it('rejects invalid date and period', async () => {
    await seedRoles();
    const admin = await createUser({ role: 'admin' });
    await api.get(EXPORT).query({ date: 'not-a-date' }).set(bearer(admin.id)).expect(400);
    await api.get(EXPORT).query({ period: 'year' }).set(bearer(admin.id)).expect(400);
  });

  it('exports data on a fresh database without orders', async () => {
    await seedRoles();
    const admin = await createUser({ role: 'admin' });
    await query('DELETE FROM orders');
    await query('DELETE FROM reviews');
    const res = await getXlsx(bearer(admin.id)).expect(200);
    const wb = XLSX.read(res.body as Buffer, { type: 'buffer' });
    const summary = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['Dashboard Summary']);
    const rev = summary.find((r) => Object.values(r)[0] === 'Total Revenue');
    expect(rev ? Object.values(rev)[1] : 0).toBe(0);
  });
});
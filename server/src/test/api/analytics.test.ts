import { beforeEach, describe, expect, it } from 'vitest';
import { Types } from 'mongoose';
import Order from '../../models/Order';
import { periodWindows } from '../../controllers/analytics.controller';
import { api, bearer, createUser, seedRoles, toId } from '../helpers';

const DASHBOARD = '/api/v1/analytics/dashboard';

interface SeedOrderInput {
  orderId: Date;
  name: string;
  qty: number;
  unitPrice: number;
  status?: string;
}

const seedOrder = (customerId: Types.ObjectId, data: SeedOrderInput) => {
  const lineTotal = data.unitPrice * data.qty;
  return Order.create({
    orderNo: `PH-A-${Math.random().toString(36).slice(2, 8)}`,
    user: customerId,
    items: [
      {
        product: new Types.ObjectId(),
        name: data.name,
        size: '',
        extras: [],
        qty: data.qty,
        unitPrice: data.unitPrice,
        lineTotal,
      },
    ],
    subtotal: lineTotal,
    deliveryFee: 0,
    discount: 0,
    total: lineTotal,
    payment: { method: 'cash', status: 'pending', amount: lineTotal },
    status: data.status ?? 'pending',
    phone: '01000000000',
    customerName: 'Test Customer',
    createdAt: data.orderId,
    statusHistory: [],
  });
};

describe('analytics dashboard periods', () => {
  beforeEach(async () => {
    await seedRoles();
    await Order.deleteMany({});
  });

  it('computes today/week/month revenue, orders, units and top products', async () => {
    const admin = await createUser({ role: 'admin' });
    const customer = await createUser({ role: 'customer' });
    const { todayStart, weekStart, monthStart } = periodWindows();
    const now = new Date();

    // A is always in today; B is always in this week + this month; C is always in this month.
    const bCreatedAt = new Date(Math.max(weekStart.getTime(), monthStart.getTime()) + 60e3);
    await seedOrder(customer._id, { orderId: now, name: 'Cheese', qty: 2, unitPrice: 150 });
    await seedOrder(customer._id, { orderId: bCreatedAt, name: 'Chicken', qty: 1, unitPrice: 150 });
    await seedOrder(customer._id, { orderId: new Date(monthStart.getTime() + 60e3), name: 'Olive', qty: 3, unitPrice: 20 });
    await seedOrder(customer._id, { orderId: now, name: 'Secret', qty: 9, unitPrice: 999, status: 'cancelled' });

    const res = await api.get(DASHBOARD).set(bearer(toId(admin._id))).expect(200);
    const data = res.body.data;

    expect(data.periodOverview).toBeDefined();
    const { today, week, month } = data.periodOverview;

    const bInToday = bCreatedAt.getTime() >= todayStart.getTime();
    const cInWeek = new Date(monthStart.getTime() + 60e3).getTime() >= weekStart.getTime();

    expect(today.revenue).toBe(300 + (bInToday ? 150 : 0));
    expect(today.orders).toBe(1 + (bInToday ? 1 : 0));
    expect(today.unitsSold).toBe(2 + (bInToday ? 1 : 0));
    expect(today.customers).toBe(1);

    expect(week.revenue).toBe(300 + 150 + (cInWeek ? 60 : 0));
    expect(week.orders).toBe(2 + (cInWeek ? 1 : 0));
    expect(week.unitsSold).toBe(3 + (cInWeek ? 3 : 0));

    expect(month.revenue).toBe(300 + 150 + 60);
    expect(month.orders).toBe(3);
    expect(month.unitsSold).toBe(6);
    expect(month.customers).toBe(1);

    const monthNames = month.topProducts.map((p: { name: string }) => p.name);
    expect(monthNames).toContain('Olive');
    expect(monthNames).toContain('Cheese');
    expect(monthNames).toContain('Chicken');
    expect(month.topProducts[0].name).toBe('Olive');
    expect(month.topProducts[0].count).toBe(3);

    expect(data.dailyStats.length).toBeGreaterThan(0);
    expect(data.dailyStats[data.dailyStats.length - 1].unitsSold).toBeGreaterThanOrEqual(2);
    expect(data.revenueTrend.length).toBeGreaterThan(0);
  });

  it('requires analytics read permission', async () => {
    const customer = await createUser({ role: 'customer' });
    await api.get(DASHBOARD).set(bearer(toId(customer._id))).expect(403);
  });
});
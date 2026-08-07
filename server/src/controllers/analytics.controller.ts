import type { Request, Response } from 'express';
import Order from '../models/Order';
import User from '../models/User';
import Product from '../models/Product';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ORDER_STATUS } from '../constants';

const daysAgo = (days: number) => new Date(Date.now() - days * 86400000);

export const periodWindows = (now = new Date()): { todayStart: Date; weekStart: Date; monthStart: Date } => {
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayOfWeek = (now.getUTCDay() + 6) % 7; // Monday = 0
  const weekStart = new Date(todayStart);
  weekStart.setUTCDate(todayStart.getUTCDate() - dayOfWeek);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { todayStart, weekStart, monthStart };
};

interface PeriodStats {
  revenue: number;
  orders: number;
  unitsSold: number;
  customers: number;
  topProducts: { _id: string; name: string; count: number; revenue: number }[];
}

const periodStats = async (start: Date): Promise<PeriodStats> => {
  const rows = await Order.aggregate([
    { $match: { createdAt: { $gte: start }, status: { $ne: ORDER_STATUS.CANCELLED } } },
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              revenue: { $sum: '$total' },
              orders: { $sum: 1 },
              unitsSold: {
                $sum: {
                  $reduce: { input: '$items', initialValue: 0, in: { $add: ['$$value', '$$this.qty'] } },
                },
              },
            },
          },
        ],
        customers: [{ $group: { _id: '$user' } }, { $count: 'n' }],
        topProducts: [
          { $unwind: '$items' },
          {
            $group: {
              _id: { name: '$items.name', id: '$items.product' },
              count: { $sum: '$items.qty' },
              revenue: { $sum: '$items.lineTotal' },
            },
          },
          { $sort: { count: -1, revenue: -1 } },
          { $limit: 5 },
          { $project: { _id: '$_id.id', name: '$_id.name', count: 1, revenue: 1 } },
        ],
      },
    },
  ]);
  const row = rows[0] ?? { totals: [], customers: [], topProducts: [] };
  const totals = row.totals?.[0];
  return {
    revenue: totals?.revenue ?? 0,
    orders: totals?.orders ?? 0,
    unitsSold: totals?.unitsSold ?? 0,
    customers: row.customers?.[0]?.n ?? 0,
    topProducts: row.topProducts ?? [],
  };
};

export const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  const { todayStart, weekStart, monthStart } = periodWindows();
  const [revenueAgg, totalOrders, totalCustomers, totalProducts, revenue30Agg, orders30, customers30, byStatus, topProducts, trend30, today, week, month] =
    await Promise.all([
      Order.aggregate([
        { $match: { status: { $ne: ORDER_STATUS.CANCELLED } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Product.countDocuments(),
      Order.aggregate([
        { $match: { createdAt: { $gte: daysAgo(30) }, status: { $ne: ORDER_STATUS.CANCELLED } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: daysAgo(30) } }),
      User.countDocuments({ createdAt: { $gte: daysAgo(30) }, role: 'customer' }),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Order.aggregate([
        { $unwind: '$items' },
        { $match: { status: { $ne: ORDER_STATUS.CANCELLED } } },
        { $group: { _id: '$items.name', count: { $sum: '$items.qty' }, revenue: { $sum: '$items.lineTotal' } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: daysAgo(30) }, status: { $ne: ORDER_STATUS.CANCELLED } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
            unitsSold: {
              $sum: {
                $reduce: { input: '$items', initialValue: 0, in: { $add: ['$$value', '$$this.qty'] } },
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      periodStats(todayStart),
      periodStats(weekStart),
      periodStats(monthStart),
    ]);

  const pending = byStatus.find((s) => s._id === ORDER_STATUS.PENDING)?.count ?? 0;
  const completed = byStatus.find((s) => s._id === ORDER_STATUS.COMPLETED)?.count ?? 0;

  res.json(
    new ApiResponse(200, {
      revenue: revenueAgg[0]?.total ?? 0,
      orders: totalOrders,
      customers: totalCustomers,
      products: totalProducts,
      pendingOrders: pending,
      completedOrders: completed,
      recentRevenue: revenue30Agg[0]?.total ?? 0,
      recentOrders: orders30,
      recentCustomers: customers30,
      revenueTrend: trend30.slice(-7).map((d) => ({ date: d._id, revenue: d.revenue, orders: d.orders })),
      dailyStats: trend30.map((d) => ({ date: d._id, revenue: d.revenue, orders: d.orders, unitsSold: d.unitsSold })),
      periodOverview: { today, week, month },
      statusBreakdown: byStatus.map((s) => ({ status: s._id, count: s.count })),
      topProducts,
    }),
  );
});

import type { Request, Response } from 'express';
import Order from '../models/Order';
import User from '../models/User';
import Product from '../models/Product';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ORDER_STATUS } from '../constants';

const daysAgo = (days: number) => new Date(Date.now() - days * 86400000);

export const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  const [revenueAgg, totalOrders, totalCustomers, totalProducts, revenue30Agg, orders30, customers30, byStatus, topProducts, last7] =
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
        { $match: { createdAt: { $gte: daysAgo(7) }, status: { $ne: ORDER_STATUS.CANCELLED } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
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
      revenueTrend: last7.map((d) => ({ date: d._id, revenue: d.revenue, orders: d.orders })),
      statusBreakdown: byStatus.map((s) => ({ status: s._id, count: s.count })),
      topProducts,
    }),
  );
});
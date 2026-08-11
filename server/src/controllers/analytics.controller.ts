import type { Request, Response } from 'express';
import * as analyticsRepo from '../db/analytics';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ORDER_STATUS } from '../constants';

export const periodWindows = (now = new Date()): { todayStart: Date; weekStart: Date; monthStart: Date } => {
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayOfWeek = (now.getUTCDay() + 6) % 7; // Monday = 0
  const weekStart = new Date(todayStart);
  weekStart.setUTCDate(todayStart.getUTCDate() - dayOfWeek);
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { todayStart, weekStart, monthStart };
};

const daysAgo = (days: number) => new Date(Date.now() - days * 86400000);

export const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  const { todayStart, weekStart, monthStart } = periodWindows();
  const trend = await analyticsRepo.trend(daysAgo(30));
  const [totals, recent, byStatus, topProducts, today, week, month] = await Promise.all([
    analyticsRepo.totals(),
    analyticsRepo.recent(daysAgo(30)),
    analyticsRepo.statusBreakdown(),
    analyticsRepo.topProducts(),
    analyticsRepo.periodStats(todayStart),
    analyticsRepo.periodStats(weekStart),
    analyticsRepo.periodStats(monthStart),
  ]);

  const pending = byStatus.find((s) => s._id === ORDER_STATUS.PENDING)?.count ?? 0;
  const completed = byStatus.find((s) => s._id === ORDER_STATUS.COMPLETED)?.count ?? 0;

  res.json(
    new ApiResponse(200, {
      revenue: totals.revenue,
      netRevenue: totals.netRevenue,
      grossRevenue: totals.grossRevenue,
      discounts: totals.discounts,
      deliveryFees: totals.deliveryFees,
      orders: totals.orders,
      customers: totals.customers,
      products: totals.products,
      pendingOrders: pending,
      completedOrders: completed,
      cancelledOrders: totals.cancelledOrders,
      refundedOrders: totals.refundedOrders,
      complimentaryOrders: totals.complimentaryOrders,
      recentRevenue: recent.revenue,
      recentOrders: recent.orders,
      recentCustomers: recent.customers,
      revenueTrend: trend.slice(-7).map((d) => ({ date: d._id, revenue: d.revenue, orders: d.orders })),
      dailyStats: trend.map((d) => ({ date: d._id, revenue: d.revenue, orders: d.orders, unitsSold: d.unitsSold })),
      periodOverview: { today, week, month },
      statusBreakdown: byStatus.map((s) => ({ status: s._id, count: s.count })),
      topProducts,
    }),
  );
});

export const day = asyncHandler(async (req: Request, res: Response) => {
  const date = String(req.query.date ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new ApiError(400, 'A valid date (YYYY-MM-DD) is required');
  }
  const stats = await analyticsRepo.dayStats(date);
  res.json(new ApiResponse(200, { date, ...stats }));
});

export const refresh = asyncHandler(async (_req: Request, res: Response) => {
  res.json(new ApiResponse(200, { ok: true }, 'Dashboard cache invalidated'));
});
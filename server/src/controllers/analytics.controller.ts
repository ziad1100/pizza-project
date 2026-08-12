import type { Request, Response } from 'express';
import * as analyticsRepo from '../db/analytics';
import * as reviewsRepo from '../db/reviews';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ORDER_STATUS } from '../constants';
import * as XLSX from 'xlsx';

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

// ---------------------------------------------------------------------------
// Excel export
// ---------------------------------------------------------------------------

const CURRENCY = '#,##0.00 "EGP"';
const NUMBER = '#,##0';

const headerCell = { font: { bold: true, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1F2937' } } };

const sheetOf = (rows: (string | number)[][]): XLSX.WorkSheet => {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  for (let c = 0; c < rows[0].length; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (ws[addr]) ws[addr].s = headerCell;
  }
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  if (rows.length > 1) {
    ws['!autofilter'] = {
      ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length - 1, c: rows[0].length - 1 } }),
    };
  }
  return ws;
};

const setMoney = (ws: XLSX.WorkSheet, r: number, c: number): void => {
  const cell = ws[XLSX.utils.encode_cell({ r, c })];
  if (cell && cell.t === 'n') cell.z = CURRENCY;
};

const setCount = (ws: XLSX.WorkSheet, r: number, c: number): void => {
  const cell = ws[XLSX.utils.encode_cell({ r, c })];
  if (cell && cell.t === 'n') cell.z = NUMBER;
};

export const exportStats = asyncHandler(async (req: Request, res: Response) => {
  const date = String(req.query.date ?? '');
  const period = String(req.query.period ?? 'today');
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ApiError(400, 'A valid date (YYYY-MM-DD) is required');
  if (!['today', 'week', 'month'].includes(period)) throw new ApiError(400, 'Invalid period');

  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const selectedDate = date && date <= todayIso ? date : todayIso;

  const [totals, recent, byStatus, top, todayStats, weekStats, monthStats, trend, dayStats, categoryData, reviewData, customersWithOrders] =
    await Promise.all([
      analyticsRepo.totals(),
      analyticsRepo.recent(daysAgo(30)),
      analyticsRepo.statusBreakdown(),
      analyticsRepo.topProducts(),
      analyticsRepo.periodStats(daysAgo(1)),
      analyticsRepo.periodStats(daysAgo(7)),
      analyticsRepo.periodStats(daysAgo(30)),
      analyticsRepo.trend(daysAgo(30)),
      analyticsRepo.dayStats(selectedDate),
      analyticsRepo.categorySales(),
      reviewsRepo.adminStats(),
      analyticsRepo.customersWithOrders(),
    ]);

  const periodMap = [
    { key: 'today', label: 'Today', stats: todayStats },
    { key: 'week', label: 'This Week', stats: weekStats },
    { key: 'month', label: 'This Month', stats: monthStats },
  ];

  const wb = XLSX.utils.book_new();

  // Sheet 1 — Dashboard Summary
  const summaryRows: (string | number)[][] = [
    ['Metric', 'Value', 'Period'],
    ['Total Revenue', totals.revenue, 'All Time'],
    ['Net Revenue', totals.netRevenue, 'All Time'],
    ['Gross Revenue', totals.grossRevenue, 'All Time'],
    ['Discounts', totals.discounts, 'All Time'],
    ['Delivery Fees', totals.deliveryFees, 'All Time'],
    ['Total Orders', totals.orders, 'All Time'],
    ['Completed Orders', totals.completedOrders, 'All Time'],
    ['Cancelled Orders', totals.cancelledOrders, 'All Time'],
    ['Refunded Orders', totals.refundedOrders, 'All Time'],
    ['Complimentary Orders', totals.complimentaryOrders, 'All Time'],
    ['Pending Orders', byStatus.find((s) => s._id === 'pending')?.count ?? 0, 'All Time'],
    ['Total Customers', totals.customers, 'All Time'],
    ['Total Products', totals.products, 'All Time'],
    ['Recent Revenue', recent.revenue, 'Last 30 Days'],
    ['Recent Orders', recent.orders, 'Last 30 Days'],
    ['Recent Customers', recent.customers, 'Last 30 Days'],
  ];
  const summary = sheetOf(summaryRows);
  for (const r of [1, 2, 3, 4, 5, 14]) setMoney(summary, r, 1);
  for (const r of [6, 7, 8, 9, 10, 11, 12, 13, 15, 16]) setCount(summary, r, 1);
  summary['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, summary, 'Dashboard Summary');

  // Sheet 2 — Period Sales
  const periodRows: (string | number)[][] = [
    ['Period', 'Revenue', 'Orders', 'Units Sold', 'Customers'],
    ['All Time', totals.revenue, totals.orders, top.reduce((a, p) => a + Number(p.count), 0), totals.customers],
  ];
  for (const p of periodMap) {
    periodRows.push([p.label, p.stats.revenue, p.stats.orders, p.stats.unitsSold, p.stats.customers]);
  }
  const periodWs = sheetOf(periodRows);
  for (let r = 1; r < periodRows.length; r++) {
    setMoney(periodWs, r, 1);
    for (const c of [2, 3, 4]) setCount(periodWs, r, c);
  }
  periodWs['!cols'] = [{ wch: 16 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, periodWs, 'Period Sales');

  // Sheet 3 — Daily Trend
  const trendRows: (string | number)[][] = [['Date', 'Revenue', 'Orders', 'Units Sold']];
  for (const d of trend) {
    trendRows.push([String(d._id), Number(d.revenue) || 0, Number(d.orders) || 0, Number(d.unitsSold) || 0]);
  }
  const trendWs = sheetOf(trendRows);
  for (let r = 1; r < trendRows.length; r++) {
    setMoney(trendWs, r, 1);
    for (const c of [2, 3]) setCount(trendWs, r, c);
  }
  trendWs['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, trendWs, 'Daily Trend');

  // Sheet 4 — Orders
  const statusRows: (string | number)[][] = [['Status', 'Count']];
  const statusOrder = ['pending', 'completed', 'cancelled', 'refunded', 'complimentary'];
  for (const s of statusOrder) {
    const found = byStatus.find((x) => x._id === s);
    statusRows.push([s, found?.count ?? 0]);
  }
  const dayRows: (string | number)[][] = [
    ['Selected Day Stats'],
    ['Day', selectedDate],
    ['Orders', dayStats.orders],
    ['Completed', dayStats.completed],
    ['Cancelled', dayStats.cancelled],
    ['Refunded', dayStats.refunded],
    ['Complimentary', dayStats.complimentary],
    ['Revenue', dayStats.revenue],
  ];
  const ordersWs = sheetOf(statusRows);
  for (let r = 1; r < statusRows.length; r++) setCount(ordersWs, r, 1);
  XLSX.utils.sheet_add_aoa(ordersWs, [['']], { origin: statusRows.length });
  const dayOrigin = statusRows.length + 1;
  XLSX.utils.sheet_add_aoa(ordersWs, dayRows, { origin: dayOrigin });
  for (const r of [dayOrigin + 2, dayOrigin + 3, dayOrigin + 4, dayOrigin + 5, dayOrigin + 6]) {
    const cell = ordersWs[XLSX.utils.encode_cell({ r, c: 1 })];
    if (cell && cell.t === 'n') cell.z = NUMBER;
  }
  setMoney(ordersWs, dayOrigin + 7, 1);
  ordersWs['!cols'] = [{ wch: 24 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ordersWs, 'Orders');

  // Sheet 5 — Products
  const productRows: (string | number)[][] = [['Product', 'Period', 'Units', 'Revenue']];
  for (const p of top) {
    productRows.push([String(p._id), 'All Time', Number(p.count) || 0, Number(p.revenue) || 0]);
  }
  for (const p of periodMap) {
    for (const tp of p.stats.topProducts) {
      productRows.push([tp.name, p.label, tp.count, tp.revenue]);
    }
  }
  const productWs = sheetOf(productRows);
  for (let r = 1; r < productRows.length; r++) {
    setCount(productWs, r, 2);
    setMoney(productWs, r, 3);
  }
  productWs['!cols'] = [{ wch: 34 }, { wch: 14 }, { wch: 10 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, productWs, 'Products');

  // Sheet 6 — Categories
  const categoryRows: (string | number)[][] = [['Category (AR)', 'Category (EN)', 'Units', 'Revenue']];
  for (const c of categoryData) {
    categoryRows.push([String(c.name), String(c.nameEn ?? ''), Number(c.units) || 0, Number(c.revenue) || 0]);
  }
  const categoryWs = sheetOf(categoryRows);
  for (let r = 1; r < categoryRows.length; r++) {
    setCount(categoryWs, r, 2);
    setMoney(categoryWs, r, 3);
  }
  categoryWs['!cols'] = [{ wch: 26 }, { wch: 26 }, { wch: 10 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, categoryWs, 'Categories');

  // Sheet 7 — Customers & Reviews
  const reviewStats = reviewData as Record<string, unknown>;
  const customerRows: (string | number)[][] = [
    ['Metric', 'Value'],
    ['Total Customers', totals.customers],
    ['New Customers (30 days)', recent.customers],
    ['Customers With Orders', customersWithOrders],
    ['Total Reviews', Number(reviewStats.total || 0)],
    ['Published Meal Reviews', Number(reviewStats.published || 0)],
    ['Restaurant Reviews', Number(reviewStats.restaurantTotal || 0)],
    ['Average Meal Rating', Number(reviewStats.average || 0)],
    ['Average Restaurant Rating', Number(reviewStats.restaurantAverage || 0)],
    ['5-Star Reviews', Number(reviewStats.fiveStar || 0)],
    ['1-Star Reviews', Number(reviewStats.oneStar || 0)],
    ['Reviews Today', Number(reviewStats.today || 0)],
  ];
  const customerWs = sheetOf(customerRows);
  for (let r = 1; r < customerRows.length; r++) {
    const cell = customerWs[XLSX.utils.encode_cell({ r, c: 1 })];
    if (cell && cell.t === 'n' && r !== 7 && r !== 8) cell.z = NUMBER;
  }
  customerWs['!cols'] = [{ wch: 30 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, customerWs, 'Customers & Reviews');

  const filename = `dashboard-report-${period}-${selectedDate}.xlsx`;
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});
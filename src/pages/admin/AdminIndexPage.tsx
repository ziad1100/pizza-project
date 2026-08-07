import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Banknote, Package, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import { adminListOrders, getDashboard } from '@/api/admin';
import { Card, CardContent, EmptyState, Skeleton } from '@/components/ui/Card';
import { PageHeader, StatusBadge, TableWrap, Td, Th } from '@/components/admin/primitives';
import { cn, formatPrice } from '@/lib/utils';

type PeriodKey = 'today' | 'week' | 'month';

const PERIOD_KEYS: Record<PeriodKey, string> = {
  today: 'admin.overview.today',
  week: 'admin.overview.thisWeek',
  month: 'admin.overview.thisMonth',
};

export function AdminIndexPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const dashboard = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: getDashboard });
  const recent = useQuery({
    queryKey: ['admin', 'orders', { page: 1, limit: 8 }],
    queryFn: () => adminListOrders({ page: 1, limit: 8 }),
  });

  const [period, setPeriod] = useState<PeriodKey>('today');

  const stats = [
    { key: t('admin.revenue'), value: dashboard.data ? formatPrice(dashboard.data.revenue, lang) : '—', icon: Banknote },
    { key: t('admin.nav.orders'), value: dashboard.data?.orders ?? '—', icon: ShoppingBag },
    { key: t('admin.overview.customers'), value: dashboard.data?.customers ?? '—', icon: Users },
    { key: t('admin.status.pending'), value: dashboard.data?.pendingOrders ?? '—', icon: Package },
    { key: t('admin.overview.recentRevenue'), value: dashboard.data ? formatPrice(dashboard.data.recentRevenue, lang) : '—', icon: TrendingUp },
    { key: t('admin.overview.products'), value: dashboard.data?.products ?? '—', icon: Package },
  ];

  const trend = dashboard.data?.revenueTrend ?? [];
  const trendData = trend.slice(-7);
  const statuses = dashboard.data?.statusBreakdown ?? [];
  const top = dashboard.data?.topProducts ?? [];

  const metrics = dashboard.data?.periodOverview?.[period];
  const periodCards = [
    { key: t('admin.revenue'), value: metrics ? formatPrice(metrics.revenue, lang) : '—', icon: Banknote },
    { key: t('admin.nav.orders'), value: metrics?.orders ?? '—', icon: ShoppingBag },
    { key: t('admin.overview.productsSold'), value: metrics?.unitsSold ?? '—', icon: Package },
    { key: t('admin.overview.customers'), value: metrics?.customers ?? '—', icon: Users },
  ];

  const dailyStats = dashboard.data?.dailyStats ?? [];
  const unitsWindow = period === 'today' ? dailyStats.slice(-1) : period === 'month' ? dailyStats : dailyStats.slice(-7);
  const periodTop = metrics?.topProducts ?? [];

  return (
    <div>
      <PageHeader title={t('admin.dashboardHeader')} />

      {dashboard.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(({ key, value, icon: Icon }) => (
            <Card key={key}>
              <CardContent className="flex items-center gap-4 p-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-500">
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-sm text-night-400">{key}</p>
                  <p className="mt-0.5 text-2xl font-extrabold text-night-50">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-night-50">{t('admin.periodTitle')}</h2>
          <div className="inline-flex rounded-xl border border-night-800 bg-night-900 p-1">
            {(['today', 'week', 'month'] as PeriodKey[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'rounded-lg px-4 py-1.5 text-sm font-bold transition-colors',
                  period === p ? 'bg-brand-600 text-white' : 'text-night-300 hover:text-night-50',
                )}
              >
                {t(PERIOD_KEYS[p])}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {periodCards.map(({ key, value, icon: Icon }) => (
            <Card key={key}>
              <CardContent className="flex items-center gap-4 p-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-600/15 text-brand-500">
                  <Icon className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-sm text-night-400">{key}</p>
                  <p className="mt-0.5 text-2xl font-extrabold text-night-50">{value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="p-5">
              <h3 className="mb-4 text-sm font-bold text-night-200">{t('admin.topProducts')}</h3>
              {periodTop.length > 0 ? (
                <ul className="space-y-3">
                  {periodTop.map((p) => (
                    <li key={`${p._id}-${p.name}`} className="flex items-center justify-between gap-3">
                      <span className="min-w-0 truncate text-sm font-semibold text-night-200">{p.name}</span>
                      <span className="shrink-0 text-xs text-night-500">
                        {p.count}× · {formatPrice(p.revenue, lang)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title={t('admin.emptyList')} icon={<Package className="h-10 w-10" />} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="mb-4 text-sm font-bold text-night-200">
                {period === 'today' ? t('admin.unitsToday') : t('admin.unitsTrend', { days: period === 'month' ? 30 : 7 })}
              </h3>
              {unitsWindow.length > 0 ? (
                <div className="flex h-40 items-end gap-2">
                  {unitsWindow.map((d) => {
                    const max = Math.max(...unitsWindow.map((x) => x.unitsSold), 1);
                    return (
                      <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                        <div
                          className="w-full rounded-t-md bg-gradient-to-t from-brand-500 to-gold-400"
                          style={{ height: `${Math.max(4, (d.unitsSold / max) * 110)}px` }}
                        />
                        <span className="text-[10px] text-night-500">{d.date.slice(8)}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title={t('admin.emptyList')} icon={<Package className="h-10 w-10" />} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {trendData.length > 0 ? (
          <Card className="lg:col-span-1">
            <CardContent className="p-5">
              <h3 className="mb-4 text-sm font-bold text-night-200">{t('admin.last7Days')}</h3>
              <div className="flex h-40 items-end gap-2">
                {trendData.map((d) => {
                  const max = Math.max(...trendData.map((x) => x.revenue), 1);
                  return (
                    <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-brand-700 to-brand-500"
                        style={{ height: `${Math.max(4, (d.revenue / max) * 110)}px` }}
                      />
                      <span className="text-[10px] text-night-500">{d.date.slice(8)}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="lg:col-span-1">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-bold text-night-200">{t('admin.statusTitle')}</h3>
            {statuses.length > 0 ? (
              <ul className="space-y-3">
                {statuses.map((s) => (
                  <li key={s.status} className="flex items-center justify-between gap-3">
                    <StatusBadge status={s.status} />
                    <span className="text-sm font-bold text-night-50">{s.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title={t('admin.emptyList')} icon={<Package className="h-10 w-10" />} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardContent className="p-5">
            <h3 className="mb-4 text-sm font-bold text-night-200">{t('admin.topProducts')}</h3>
            {top.length > 0 ? (
              <ul className="space-y-3">
                {top.map((p) => (
                  <li key={p._id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-sm font-semibold text-night-200">{p.name}</span>
                    <span className="shrink-0 text-xs text-night-500">
                      {p.count}× · {formatPrice(p.revenue, lang)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title={t('admin.emptyList')} icon={<Package className="h-10 w-10" />} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <PageHeader title={t('admin.recentOrders')} />
        {recent.isLoading ? (
          <Skeleton className="h-40" />
        ) : recent.data && recent.data.items.length > 0 ? (
          <TableWrap>
            <thead>
              <tr>
                <Th>{t('admin.nav.orders')}</Th>
                <Th>{t('admin.customer')}</Th>
                <Th>{t('common.min')}</Th>
                <Th>{t('admin.total')}</Th>
                <Th>{t('admin.statusChange')}</Th>
              </tr>
            </thead>
            <tbody>
              {recent.data.items.map((o) => (
                <tr key={o._id} className="transition-colors hover:bg-night-800/40">
                  <Td className="font-bold text-night-50">
                    <Link to="/admin/orders" className="hover:text-brand-400">
                      {o.orderNo}
                    </Link>
                  </Td>
                  <Td>{o.customerName}</Td>
                  <Td>{formatPrice(o.subtotal, lang)}</Td>
                  <Td className="font-bold text-night-50">{formatPrice(o.total, lang)}</Td>
                  <Td>
                    <StatusBadge status={o.status} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        ) : (
          <Card>
            <CardContent>
              <EmptyState title={t('admin.emptyList')} icon={<ShoppingBag className="h-12 w-12" />} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
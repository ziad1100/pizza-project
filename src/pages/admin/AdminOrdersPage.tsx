import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { adminListOrders, updateOrderStatus } from '@/api/admin';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, EmptyState, Skeleton } from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PageHeader, Pagination, SearchBox, StatusBadge, TableWrap, Td, Th } from '@/components/admin/primitives';
import type { Order, OrderStatus } from '@/types';
import { formatPrice } from '@/lib/utils';

type AdminOrder = Omit<Order, 'user'> & {
  user: string | { fullName: string; email: string; phone: string };
};

const statusOptions: OrderStatus[] = ['pending', 'preparing', 'on_delivery', 'completed', 'cancelled'];

export function AdminOrdersPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminOrder | null>(null);

  const orders = useQuery({
    queryKey: ['admin', 'orders', { page, q: search, status }],
    queryFn: () => adminListOrders({ page, limit: 15, q: search, status }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: OrderStatus }) => updateOrderStatus(id, next),
    onSuccess: (order) => {
      toast.success(t('admin.saved'));
      void queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      setSelected(order);
    },
  });

  const fmtDate = (iso: string): string =>
    new Date(iso).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div>
      <PageHeader title={t('admin.nav.orders')} />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder={t('admin.searchPlaceholder')} />
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="h-10 w-44">
          <option value="">{t('admin.allStatuses')}</option>
          <option value="pending">{t('admin.status.pending')}</option>
          <option value="preparing">{t('admin.status.preparing')}</option>
          <option value="on_delivery">{t('admin.status.on_delivery')}</option>
          <option value="completed">{t('admin.status.completed')}</option>
          <option value="cancelled">{t('admin.status.cancelled')}</option>
        </Select>
      </div>

      {orders.isLoading ? (
        <Skeleton className="h-96" />
      ) : orders.data && orders.data.items.length > 0 ? (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>{t('admin.nav.orders')}</Th>
                <Th>{t('admin.customer')}</Th>
                <Th>{t('admin.phone')}</Th>
                <Th>{t('admin.total')}</Th>
                <Th>{t('admin.orderItems')}</Th>
                <Th>{t('admin.date')}</Th>
                <Th>{t('admin.statusChange')}</Th>
                <Th className="text-end">{t('admin.actions')}</Th>
              </tr>
            </thead>
            <tbody>
              {(orders.data.items as AdminOrder[]).map((o) => (
                <tr key={o._id} className="transition-colors hover:bg-night-800/40">
                  <Td className="font-bold text-night-50">{o.orderNo}</Td>
                  <Td>
                    <p className="font-semibold text-night-100">{o.customerName}</p>
                    <p className="text-xs text-night-500">
                      {typeof o.user === 'object'
                        ? lang === 'ar'
                          ? o.user.fullName
                          : o.user.email
                        : ''}
                    </p>
                  </Td>
                  <Td dir="ltr">{o.phone}</Td>
                  <Td className="font-bold text-night-50">{formatPrice(o.total, lang)}</Td>
                  <Td>{o.items.reduce((sum, i) => sum + i.qty, 0)}</Td>
                  <Td className="text-xs text-night-500">{fmtDate(o.createdAt)}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={o.status} />
                      <Select
                        value={o.status}
                        onChange={(e) => statusMutation.mutate({ id: o._id, next: e.target.value as OrderStatus })}
                        disabled={statusMutation.isPending}
                        className="h-8 w-36"
                        aria-label={t('admin.statusChange')}
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>
                            {t(`admin.status.${s}`)}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </Td>
                  <Td className="text-end">
                    <Button variant="ghost" size="icon" onClick={() => setSelected(o)} aria-label={t('common.viewAll')}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pagination page={orders.data.page} pages={orders.data.pages} onPage={setPage} />
        </>
      ) : (
        <Card>
          <CardContent className="py-14">
            <EmptyState title={t('admin.emptyList')} hint={t('admin.emptyListHint')} />
          </CardContent>
        </Card>
      )}

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.orderNo ?? ''} size="lg">
        {selected ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusBadge status={selected.status} />
              <div className="flex flex-wrap gap-2">
                {selected.status === 'pending' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/40 text-red-400"
                    loading={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ id: selected._id, next: 'cancelled' })}
                  >
                    <XCircle className="h-4 w-4" />
                    {t('admin.status.cancelled')}
                  </Button>
                ) : null}
                {selected.status === 'pending' ? (
                  <Button size="sm" onClick={() => statusMutation.mutate({ id: selected._id, next: 'preparing' })}>
                    {t('admin.status.preparing')}
                  </Button>
                ) : null}
                {selected.status === 'preparing' ? (
                  <Button size="sm" onClick={() => statusMutation.mutate({ id: selected._id, next: 'on_delivery' })}>
                    {t('admin.status.on_delivery')}
                  </Button>
                ) : null}
                {selected.status === 'on_delivery' ? (
                  <Button size="sm" variant="gold" onClick={() => statusMutation.mutate({ id: selected._id, next: 'completed' })}>
                    {t('admin.status.completed')}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-night-800 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-night-500">{t('admin.customer')}</p>
                <p className="mt-2 font-bold text-night-50">{selected.customerName}</p>
                <p dir="ltr" className="text-sm text-night-400">{selected.phone}</p>
                {selected.payment ? (
                  <p className="mt-1 text-sm capitalize text-night-400">
                    {selected.payment.method} · {formatPrice(selected.payment.amount, lang)}
                  </p>
                ) : null}
              </div>
              <div className="rounded-xl border border-night-800 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-night-500">{t('admin.category')}</p>
                <p className="mt-2 text-sm text-night-200">
                  {selected.deliveryAddress.city
                    ? [selected.deliveryAddress.city, selected.deliveryAddress.street, selected.deliveryAddress.building]
                        .filter(Boolean)
                        .join(' — ')
                    : '—'}
                </p>
                {selected.notes ? <p className="mt-1 text-sm text-night-500">{selected.notes}</p> : null}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-night-500">{t('admin.orderItems')}</p>
              <div className="space-y-2">
                {selected.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-night-800 px-4 py-3 text-sm">
                    <span className="font-semibold text-night-100">
                      {item.qty} × {item.name}
                      {item.size ? <span className="text-night-500"> ({item.size})</span> : null}
                      {item.extras?.length ? (
                        <span className="block text-xs text-night-500">{item.extras.map((e) => e.name).join(', ')}</span>
                      ) : null}
                    </span>
                    <span className="font-bold text-night-50">{formatPrice(item.lineTotal, lang)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-night-800 px-4 py-3">
              <div className="space-y-1 text-sm">
                <p className="text-night-400">
                  {t('common.min')}: <span className="font-bold text-night-100">{formatPrice(selected.subtotal, lang)}</span>
                </p>
                <p className="text-night-400">
                  {t('admin.deliveryFee')}: <span className="font-bold text-night-100">{formatPrice(selected.deliveryFee, lang)}</span>
                </p>
                {selected.couponCode ? (
                  <p className="text-night-400">
                    {selected.couponCode}: <span className="font-bold text-emerald-400">−{formatPrice(selected.discount, lang)}</span>
                  </p>
                ) : null}
              </div>
              <div className="text-end">
                <p className="text-xs text-night-500">{fmtDate(selected.createdAt)}</p>
                <p className="text-lg font-extrabold text-night-50">
                  {t('admin.total')}: {formatPrice(selected.total, lang)}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
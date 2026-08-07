import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminListReviews, deleteReview, updateReviewApproval } from '@/api/admin';
import { Card, CardContent, EmptyState, Skeleton } from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import {
  ConfirmDialog,
  PageHeader,
  Pagination,
  SearchBox,
  TableWrap,
  Td,
  Th,
  ToggleSwitch,
} from '@/components/admin/primitives';
import { Button } from '@/components/ui/Button';
import type { Review } from '@/types';

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-4 w-4 ${i <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-night-600'}`} />
      ))}
    </span>
  );
}

export function AdminReviewsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [isApproved, setIsApproved] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<Review | null>(null);

  const reviews = useQuery({
    queryKey: ['admin', 'reviews', { page, q: search, isApproved }],
    queryFn: () => adminListReviews({ page, limit: 10, q: search, isApproved }),
  });

  const invalidate = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] });
    void queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
  };

  const moderateMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) => updateReviewApproval(id, approved),
    onSuccess: () => {
      toast.success(t('admin.saved'));
      invalidate();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: () => {
      toast.success(t('common.delete'));
      invalidate();
      setDeleting(null);
    },
  });

  const reviewerName = (r: Review): string =>
    typeof r.user === 'object' && r.user ? r.user.fullName : '—';
  const reviewerEmail = (r: Review): string =>
    typeof r.user === 'object' && r.user ? (r.user.email ?? '') : '';
  const productName = (r: Review): string =>
    typeof r.product === 'object' && r.product ? r.product.name : '—';

  return (
    <div>
      <PageHeader title={t('admin.nav.reviews')} />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SearchBox value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder={t('admin.searchPlaceholder')} />
        <Select
          value={isApproved}
          onChange={(e) => { setIsApproved(e.target.value); setPage(1); }}
          className="h-10 w-40"
        >
          <option value="">{t('common.all')}</option>
          <option value="true">{t('admin.approved')}</option>
          <option value="false">{t('admin.unapproved')}</option>
        </Select>
      </div>

      {reviews.isLoading ? (
        <Skeleton className="h-96" />
      ) : reviews.data && reviews.data.items.length > 0 ? (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>{t('admin.product')}</Th>
                <Th>{t('admin.reviewer')}</Th>
                <Th>{t('admin.rating')}</Th>
                <Th>{t('admin.comment')}</Th>
                <Th>{t('admin.approved')}</Th>
                <Th className="text-end">{t('admin.actions')}</Th>
              </tr>
            </thead>
            <tbody>
              {reviews.data.items.map((r) => (
                <tr key={r._id} className="transition-colors hover:bg-night-800/40">
                  <Td>
                    <div className="flex items-center gap-3">
                      {typeof r.product === 'object' && r.product && r.product.images && r.product.images[0] ? (
                        <img src={r.product.images[0]} alt="" className="h-10 w-10 rounded-lg border border-night-700 object-cover" />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-night-700 bg-night-800 text-xs text-night-500">—</span>
                      )}
                      <span className="max-w-[180px] truncate font-semibold text-night-50">{productName(r)}</span>
                    </div>
                  </Td>
                  <Td>
                    <p className="font-semibold text-night-100">{reviewerName(r)}</p>
                    {reviewerEmail(r) ? <p className="text-xs text-night-500">{reviewerEmail(r)}</p> : null}
                  </Td>
                  <Td>
                    <Stars value={r.rating} />
                    <p className="mt-0.5 text-xs text-night-500" dir="ltr">
                      {r.rating} / 5
                    </p>
                  </Td>
                  <Td>
                    <p className="max-w-[260px] truncate text-sm text-night-300">{r.comment || '—'}</p>
                  </Td>
                  <Td>
                    <ToggleSwitch
                      checked={r.isApproved}
                      disabled={moderateMutation.isPending}
                      onChange={() => moderateMutation.mutate({ id: r._id, approved: !r.isApproved })}
                    />
                  </Td>
                  <Td className="text-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => setDeleting(r)}
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pagination page={reviews.data.page} pages={reviews.data.pages} onPage={setPage} />
        </>
      ) : (
        <Card>
          <CardContent className="py-14">
            <EmptyState title={t('admin.emptyList')} hint={t('admin.emptyListHint')} />
          </CardContent>
        </Card>
      )}

    <ConfirmDialog
      open={Boolean(deleting)}
      onClose={() => setDeleting(null)}
      onConfirm={() => deleting && deleteMutation.mutate(deleting._id)}
      title={t('admin.confirmDeleteTitle')}
      message={t('admin.confirmDeleteReview')}
      loading={deleteMutation.isPending}
    />
  </div>
  );
}
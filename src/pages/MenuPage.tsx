import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { listCategories, listProducts } from '@/api/products';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, Skeleton } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 12;

export function MenuPage() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const activeCategory = searchParams.get('category') ?? '';
  const offersOnly = searchParams.get('offers') === '1';
  const lang = i18n.language;

  const filterKey = `${search}|${activeCategory}|${offersOnly ? '1' : '0'}`;
  const [prevFilter, setPrevFilter] = useState(filterKey);
  if (prevFilter !== filterKey) {
    setPrevFilter(filterKey);
    setPage(1);
  }

  const categories = useQuery({ queryKey: ['categories'], queryFn: listCategories });
  const sections = useMemo(
    () => (categories.data ?? []).filter((c) => c.type === 'section'),
    [categories.data],
  );
  const subs = useMemo(
    () => (categories.data ?? []).filter((c) => c.type === 'sub' && c.parentId === activeCategory),
    [categories.data, activeCategory],
  );
  const activeCategoryType = useMemo(
    () => (categories.data ?? []).find((c) => c._id === activeCategory)?.type,
    [categories.data, activeCategory],
  );

  const products = useQuery({
    queryKey: ['products', { search, category: activeCategory, offers: offersOnly, page }],
    queryFn: () =>
      listProducts({
        page,
        limit: PAGE_SIZE,
        search: search || undefined,
        ...(activeCategoryType === 'section'
          ? { section: activeCategory }
          : activeCategoryType === 'sub'
            ? { category: activeCategory }
            : {}),
        offer: offersOnly || undefined,
      }),
  });

  const setCategory = (id: string): void => {
    if (id) {
      setSearchParams({ category: id });
    } else {
      setSearchParams({});
    }
    setPage(1);
  };

  const items = products.data?.items ?? [];
  const totalPages = products.data?.pages ?? 1;

  return (
    <div>
      <section className="border-b border-night-800 bg-night-900 py-12">
        <div className="container-px">
          <h1 className="text-3xl font-extrabold text-night-50 md:text-4xl">{t('menu.title')}</h1>
          <p className="mt-2 text-night-400">{t('menu.subtitle')}</p>
          <div className="relative mt-6 max-w-md">
            <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-night-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('menu.searchPlaceholder')}
              className="ps-11"
            />
          </div>
        </div>
      </section>

      <section className="container-px py-8">
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => setCategory('')}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-bold transition-colors',
              !activeCategory ? 'bg-brand-600 text-white' : 'border border-night-700 text-night-300 hover:text-night-50',
            )}
          >
            {t('common.all')}
          </button>
          {sections.map((section) => (
            <button
              key={section._id}
              onClick={() => setCategory(section._id)}
              className={cn(
                'rounded-xl px-4 py-2 text-sm font-bold transition-colors',
                activeCategory === section._id
                  ? 'bg-brand-600 text-white'
                  : 'border border-night-700 text-night-300 hover:text-night-50',
              )}
            >
              {lang === 'ar' ? section.name : section.nameEn}
            </button>
          ))}
        </div>

        {activeCategory && subs.length > 0 ? (
          <div className="mb-8 flex flex-wrap gap-2">
            {subs.map((sub) => (
              <button
                key={sub._id}
                onClick={() => setCategory(sub._id)}
                className="rounded-lg border border-night-700 px-3 py-1.5 text-xs font-semibold text-night-300 transition-colors hover:border-brand-500 hover:text-brand-500"
              >
                {lang === 'ar' ? sub.name : sub.nameEn}
              </button>
            ))}
          </div>
        ) : null}

        {products.isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5]" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState title={t('menu.noResults')} icon={<Search className="h-14 w-14" />} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {items.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
            {totalPages > 1 ? (
              <div className="mt-10 flex items-center justify-center gap-3">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  {t('common.back')}
                </Button>
                <span className="text-sm font-bold text-night-300">
                  {page} / {totalPages}
                </span>
                <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  {t('common.next')}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
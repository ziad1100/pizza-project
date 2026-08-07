import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock, Flame, Leaf, Phone, Star, Truck, UtensilsCrossed } from 'lucide-react';
import { getBestSellers, getOffers } from '@/api/products';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Card';

export function HomePage() {
  const { t } = useTranslation();

  const bestSellers = useQuery({ queryKey: ['products', 'best-sellers'], queryFn: getBestSellers });
  const offers = useQuery({ queryKey: ['products', 'offers'], queryFn: getOffers });

  const features = [
    { icon: UtensilsCrossed, title: t('home.whyDough'), desc: t('home.whyDoughDesc') },
    { icon: Leaf, title: t('home.whyIngredients'), desc: t('home.whyIngredientsDesc') },
    { icon: Truck, title: t('home.whyDelivery'), desc: t('home.whyDeliveryDesc') },
  ];

  return (
    <div>
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 20% 0%, rgba(227,30,36,0.18), transparent 55%), radial-gradient(ellipse at 90% 100%, rgba(246,177,0,0.1), transparent 50%)',
          }}
        />
        <div className="container-px relative grid items-center gap-10 py-20 lg:grid-cols-2 lg:py-28">
          <div className="animate-slide-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-600/40 bg-brand-600/10 px-4 py-1.5 text-sm font-bold text-brand-400">
              <Flame className="h-4 w-4" />
              {t('hero.badge')}
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight text-night-50 sm:text-5xl lg:text-6xl">
              {t('hero.title')}
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-night-300">{t('hero.subtitle')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/menu">
                <Button variant="gold" size="lg">
                  {t('hero.ctaMenu')}
                  <ArrowLeft className="h-5 w-5 rtl:rotate-180" />
                </Button>
              </Link>
              <Link to="/menu?offers=1">
                <Button variant="outline" size="lg">
                  {t('hero.ctaOffers')}
                </Button>
              </Link>
            </div>
            <div className="mt-12 grid max-w-md grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-3xl font-extrabold text-gold-500">41</p>
                <p className="mt-1 text-sm text-night-400">{t('hero.statItems')}</p>
              </div>
              <div className="text-center">
                <p className="flex items-center justify-center gap-1 text-3xl font-extrabold text-gold-500">
                  <Clock className="h-6 w-6" />30
                </p>
                <p className="mt-1 text-sm text-night-400">{t('hero.statDelivery')}</p>
              </div>
              <div className="text-center">
                <p className="flex items-center justify-center gap-1 text-3xl font-extrabold text-gold-500">
                  <Star className="h-6 w-6 fill-current" />4.6
                </p>
                <p className="mt-1 text-sm text-night-400">{t('hero.statRating')}</p>
              </div>
            </div>
          </div>
          <div className="relative hidden items-center justify-center lg:flex">
            <div className="animate-scale-in relative flex h-[26rem] w-full max-w-lg items-center justify-center overflow-hidden rounded-3xl border border-night-800 bg-gradient-to-br from-night-800 via-night-900 to-night-950 shadow-2xl">
              <span className="absolute h-72 w-72 rounded-full bg-brand-600/25 blur-3xl" />
              <span className="absolute h-48 w-48 rounded-full bg-gold-500/15 blur-2xl" />
              <div className="relative flex flex-col items-center gap-4">
                <span className="flex h-32 w-32 items-center justify-center rounded-full bg-brand-600 text-white shadow-2xl shadow-brand-600/40">
                  <UtensilsCrossed className="h-16 w-16" />
                </span>
                <p className="text-lg font-extrabold text-night-50">
                  O<span className="text-brand-500">RABI</span>
                </p>
                <p className="text-sm text-night-300">{t('hero.badge')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-night-800 bg-night-900/60">
        <div className="container-px flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-5">
          <span className="flex items-center gap-2 text-sm font-semibold text-night-200">
            <span className="flex text-gold-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </span>
            {t('home.ratingTitle')}
          </span>
          <span className="hidden text-night-600 sm:block">|</span>
          <span className="text-sm text-night-400">{t('home.ratingReviews')}</span>
        </div>
      </section>

      <section className="container-px py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-extrabold text-night-50">{t('home.deals')}</h2>
            <p className="mt-1 text-night-400">{t('menu.subtitle')}</p>
          </div>
          <Link to="/menu" className="hidden text-sm font-bold text-brand-500 hover:text-brand-400 sm:block">
            {t('common.viewAll')}
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {offers.isLoading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5]" />)
            : offers.data?.map((product) => <ProductCard key={product._id} product={product} />)}
        </div>
      </section>

      <section className="bg-night-900 py-16">
        <div className="container-px">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold text-night-50">{t('home.bestSellers')}</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {bestSellers.isLoading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="aspect-[4/5]" />)
              : bestSellers.data?.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        </div>
      </section>

      <section className="container-px grid gap-8 py-16 md:grid-cols-3">
        {features.map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            className="rounded-2xl border border-night-800 bg-night-900 p-7 text-center transition-colors hover:border-brand-600/50"
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600/15 text-brand-500">
              <Icon className="h-7 w-7" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-night-50">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-night-400">{desc}</p>
          </div>
        ))}
      </section>

      <section className="container-px pb-20">
        <div className="relative overflow-hidden rounded-3xl border border-brand-800/40 bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-10 text-center md:p-16">
          <h2 className="text-3xl font-extrabold text-white md:text-4xl">{t('home.ctaTitle')}</h2>
          <p className="mt-3 text-lg text-white/80">{t('home.ctaSubtitle')}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/menu">
              <Button variant="gold" size="lg">
                {t('home.ctaOrder')}
              </Button>
            </Link>
            <Link to="/branches">
              <Button variant="ghost" size="lg" className="border border-white/30 text-white hover:bg-white/10">
                <Phone className="h-5 w-5" />
                {t('common.contactUs')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
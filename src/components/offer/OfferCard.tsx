import { useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { CalendarClock, Percent, Tag } from 'lucide-react';
import type { OfferWithProducts } from '@/api/offers';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Card';
import { offerThemeClasses } from '@/components/offer/offerTheme';
import { cn, formatPrice } from '@/lib/utils';

export function OfferCard({ offer }: { offer: OfferWithProducts }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const title = lang === 'ar' ? offer.title : offer.titleEn || offer.title;
  const description = lang === 'ar' ? offer.description : offer.descriptionEn || offer.description;

  const discountLabel = useMemo(() => {
    if (offer.discountType === 'percent') {
      return `-${offer.discountValue}%`;
    }
    return `-${formatPrice(offer.discountValue, lang)}`;
  }, [offer.discountType, offer.discountValue, lang]);

  const endsLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-EG', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(offer.endDate)),
    [offer.endDate, lang],
  );

  const previewImages = offer.products.slice(0, 4).map((p) => p.images[0]).filter(Boolean);
  const remaining = offer.products.length - previewImages.length;

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-3xl border bg-gradient-to-br p-7 shadow-xl md:p-8',
        offerThemeClasses(offer.theme),
      )}
    >
      <span className="pointer-events-none absolute -start-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
      <span className="pointer-events-none absolute -bottom-16 -end-10 h-52 w-52 rounded-full bg-black/20 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <Badge
          tone="gold"
          className={cn(
            'text-sm',
            offer.theme === 'gold' && 'border-night-900/50 bg-night-950/60 text-gold-200',
          )}
        >
          <Percent className="h-3.5 w-3.5" />
          {discountLabel}
        </Badge>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-white/70">
          <CalendarClock className="h-4 w-4" />
          {t('offers.endsAt')} {endsLabel}
        </span>
      </div>

      <h3 className="relative mt-5 text-2xl font-extrabold text-white">{title}</h3>
      {description ? (
        <p className="relative mt-2 line-clamp-2 text-sm leading-relaxed text-white/80">{description}</p>
      ) : null}

      {previewImages.length > 0 ? (
        <div className="relative mt-6 flex items-center">
          <div className="flex -space-x-3 rtl:space-x-reverse">
            {previewImages.map((img, i) => (
              <img
                key={i}
                src={img}
                alt=""
                loading="lazy"
                className="h-12 w-12 rounded-xl border-2 border-white/20 object-cover"
              />
            ))}
            {remaining > 0 ? (
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-white/20 bg-night-800/70 text-sm font-bold text-white">
                +{remaining}
              </span>
            ) : null}
          </div>
          <span className="ms-4 flex items-center gap-1 text-xs font-semibold text-white/70">
            <Tag className="h-3.5 w-3.5" />
            {offer.products.length} {t('offers.items')}
          </span>
        </div>
      ) : null}

      <div className="relative mt-auto pt-7">
        <Link to={`/offers/${offer._id}`}>
          <Button variant={offer.theme === 'gold' ? 'primary' : 'gold'} className="w-full">
            {t('offers.viewItems')}
          </Button>
        </Link>
      </div>
    </div>
  );
}

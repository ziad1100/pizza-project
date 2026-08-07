import { useTranslation } from 'react-i18next';

type GalleryItem = { src: string; label: string };

// Curated real dish photos from public/images/products (verified to exist).
const items: GalleryItem[] = [
  { src: '/images/products/margherita-cheese.jpg', label: 'margherita' },
  { src: '/images/products/chicken-bbq-chicken.jpg', label: 'bbqChicken' },
  { src: '/images/products/fajita-chicken.jpg', label: 'fajita' },
  { src: '/images/products/shrimp-seafood.jpg', label: 'shrimp' },
  { src: '/images/products/meat-mix-mix.jpg', label: 'meatMix' },
  { src: '/images/products/kunafa-sweet-feteer.jpg', label: 'kunafa' },
  { src: '/images/products/basbousa-kunafa-sweet-feteer.jpg', label: 'basbousa' },
  { src: '/images/products/chocolate-oreo-sweet-feteer.jpg', label: 'oreoChocolate' },
  { src: '/images/products/white-chocolate-sweet-feteer.jpg', label: 'whiteChocolate' },
  { src: '/images/products/meshaltet-butter-meshaltet.jpg', label: 'meshaltet' },
  { src: '/images/products/sausage-kiri-rocket-roll.jpg', label: 'sausageRoll' },
  { src: '/images/products/tuna-seafood.jpg', label: 'tuna' },
  { src: '/images/products/mozzarella-cheese.jpg', label: 'mozzarella' },
  { src: '/images/products/vegetables-cheese.jpg', label: 'vegetables' },
  { src: '/images/products/strips-chicken.jpg', label: 'strips' },
  { src: '/images/products/beef-meat.jpg', label: 'beef' },
];

export function GalleryPage() {
  const { t } = useTranslation();

  return (
    <div className="container-px py-16">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-extrabold text-night-50">{t('gallery.title')}</h1>
        <p className="mt-2 text-night-400">{t('gallery.subtitle')}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.src}
            className="group relative aspect-square overflow-hidden rounded-2xl border border-night-800 bg-night-900"
          >
            <img
              src={item.src}
              alt={t(`gallery.items.${item.label}`)}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night-950/90 to-transparent px-3 pb-2 pt-8">
              <span className="text-sm font-bold text-night-50">{t(`gallery.items.${item.label}`)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

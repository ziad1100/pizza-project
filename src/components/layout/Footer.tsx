import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Clock, MessageCircle, Phone } from 'lucide-react';
import { Logo } from '@/components/logo/Logo';

const socials = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/ORABIRestaurant',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/orabirestaurant',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
];

export function Footer() {
  const { t } = useTranslation();

  const nav = [
    { to: '/menu', key: 'menu' },
    { to: '/about', key: 'about' },
    { to: '/branches', key: 'branches' },
    { to: '/blog', key: 'blog' },
    { to: '/gallery', key: 'gallery' },
    { to: '/contact', key: 'contact' },
  ];

  return (
    <footer className="border-t border-night-800 bg-night-950">
      <div className="container-px grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-10 w-10 rounded-xl" />
            <span className="text-xl font-extrabold text-night-50">
              O<span className="text-brand-500">RABI</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-night-400">{t('footer.tagline')}</p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-night-300">
            {t('footer.quickLinks')}
          </h3>
          <ul className="space-y-2.5">
            {nav.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="text-sm text-night-400 transition-colors hover:text-brand-500"
                >
                  {t(`nav.${item.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-night-300">
            {t('footer.contact')}
          </h3>
          <ul className="space-y-3 text-sm text-night-400">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-brand-500" />
              <span dir="ltr">
                <a href="tel:+201278767679" className="transition-colors hover:text-brand-500">
                  +20 127 876 7679
                </a>
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-brand-500" />
              <span dir="ltr">
                <a href="tel:+201111475556" className="transition-colors hover:text-brand-500">
                  +20 111 475 556
                </a>
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-brand-500" />
              <span dir="ltr">
                <a href="tel:+201037472446" className="transition-colors hover:text-brand-500">
                  +20 103 747 2446
                </a>
              </span>
            </li>
            <li className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-brand-500" />
              <span dir="ltr">
                <a
                  href="https://wa.me/201278767679"
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-brand-500"
                >
                  01278767679
                </a>
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-500" />
              <span>{t('footer.hoursValue')}</span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-night-300">Social</h3>
          <div className="flex gap-2">
            {socials.map(({ label, href, path }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-night-800 text-night-300 transition-colors hover:border-brand-500 hover:text-brand-500"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                  <path d={path} />
                </svg>
              </a>
            ))}
          </div>
          <p className="mt-4 text-sm text-night-500">
            © {new Date().getFullYear()} ORABI Restaurant. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
}
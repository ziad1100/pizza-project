import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Clock, Phone } from 'lucide-react';
import { Logo } from '@/components/logo/Logo';

// Official brand glyphs (viewBox 0 0 24 24, fill=currentColor).
const FACEBOOK_PATH =
  'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z';

const WHATSAPP_PATH =
  'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z';

const socials = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/share/1Bj37phnYw/',
    path: FACEBOOK_PATH,
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
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 shrink-0 text-brand-500" aria-hidden="true">
                <path d={WHATSAPP_PATH} />
              </svg>
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
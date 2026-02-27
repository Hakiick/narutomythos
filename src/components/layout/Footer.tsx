import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('Footer');

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div>
            <h3 className="mb-2 text-lg font-bold text-primary">
              Naruto Mythos
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('description')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-2 font-semibold">{t('links')}</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <a href="https://narutomythos.com" className="hover:text-primary">
                  {t('officialLink')}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-2 font-semibold">{t('legal')}</h4>
            <p className="text-xs text-muted-foreground">
              {t('legalDisclaimer')}
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          {t('madeWith')}
        </div>
      </div>
    </footer>
  );
}

'use client';

import { useTranslations } from 'next-intl';

export function ScannerTips() {
  const t = useTranslations('Scanner');

  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-4">
      <h3 className="mb-2 text-sm font-semibold">{t('tipTitle')}</h3>
      <ul className="space-y-1 text-xs text-muted-foreground">
        <li>• {t('tip1')}</li>
        <li>• {t('tip2')}</li>
        <li>• {t('tip3')}</li>
      </ul>
    </div>
  );
}

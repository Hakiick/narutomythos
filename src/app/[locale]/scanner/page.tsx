import { getTranslations } from 'next-intl/server';
import { ScannerClient } from '@/components/scanner/ScannerClient';

export default async function ScannerPage() {
  const t = await getTranslations('Scanner');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold md:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
      </div>
      <ScannerClient />
    </div>
  );
}

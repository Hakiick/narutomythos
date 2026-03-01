import { getTranslations } from 'next-intl/server';
import { ScannerClient } from '@/components/scanner/ScannerClient';
import { PageHeroBg } from '@/components/layout/PageHeroBg';

const heroCards = [
  { id: 'KS-014', alt: 'Sasuke Uchiha — Sharingan' },
  { id: 'KS-136', alt: 'Sasuke Uchiha — Heaven Curse Mark' },
];

export default async function ScannerPage() {
  const t = await getTranslations('Scanner');

  return (
    <div>
      <PageHeroBg title={t('title')} subtitle={t('subtitle')} cards={heroCards} />
      <div className="container mx-auto px-4 py-8">
        <ScannerClient />
      </div>
    </div>
  );
}

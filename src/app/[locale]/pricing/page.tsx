import { getTranslations } from 'next-intl/server';
import { getCards } from '@/lib/services/card-service';
import { getAllMarketPrices } from '@/lib/services/price-service';
import { PricingGrid } from '@/components/pricing/PricingGrid';
import { PageHeroBg } from '@/components/layout/PageHeroBg';
import type { MarketPriceResult } from '@/lib/services/price-utils';

const heroCards = [
  { id: 'KS-131', alt: 'Tsunade — Fifth Hokage' },
  { id: 'KS-003', alt: 'Tsunade — Master Medical Ninja' },
];

export default async function PricingPage() {
  const t = await getTranslations('Pricing');
  const cards = await getCards();

  const cardIds = cards.map((c) => c.id);
  const priceMap = await getAllMarketPrices(cardIds, 'EUR');

  // Convert Map to plain object for serialization to client component
  const prices: Record<string, MarketPriceResult> = {};
  for (const [cardId, result] of priceMap) {
    prices[cardId] = result;
  }

  return (
    <div>
      <PageHeroBg title={t('title')} subtitle={t('subtitle')} cards={heroCards} />
      <div className="container mx-auto px-4 py-8">
        <PricingGrid cards={cards} prices={prices} currency="EUR" />
      </div>
    </div>
  );
}

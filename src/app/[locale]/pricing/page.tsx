import { getTranslations } from 'next-intl/server';
import { getCards } from '@/lib/services/card-service';
import { getAllMarketPrices } from '@/lib/services/price-service';
import { PricingGrid } from '@/components/pricing/PricingGrid';
import type { MarketPriceResult } from '@/lib/services/price-utils';

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
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold md:text-4xl">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
      </div>

      <PricingGrid cards={cards} prices={prices} currency="EUR" />
    </div>
  );
}

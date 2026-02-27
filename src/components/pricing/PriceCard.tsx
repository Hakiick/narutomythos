'use client';

import { useTranslations, useLocale } from 'next-intl';
import type { MarketPriceResult } from '@/lib/services/price-utils';
import { PriceBadge } from './PriceBadge';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const rarityColors: Record<string, string> = {
  C: 'bg-gray-600',
  UC: 'bg-green-700',
  R: 'bg-blue-700',
  AR: 'bg-purple-700',
  S: 'bg-yellow-600',
  L: 'bg-amber-500',
};

interface PriceCardProps {
  cardId: string;
  nameEn: string;
  nameFr: string;
  rarity: string;
  marketPrice: MarketPriceResult;
}

export function PriceCard({ cardId, nameEn, nameFr, rarity, marketPrice }: PriceCardProps) {
  const t = useTranslations('Pricing');
  const locale = useLocale();

  const name = locale === 'fr' ? nameFr : nameEn;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30">
      {/* Card info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{name}</span>
          <Badge
            className={cn(
              'shrink-0 border-transparent text-[10px] text-white',
              rarityColors[rarity] || 'bg-gray-600'
            )}
          >
            {rarity}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{cardId}</span>
          {marketPrice.sampleSize > 0 && (
            <span>{t('sampleSize', { count: marketPrice.sampleSize })}</span>
          )}
          {marketPrice.isStale && (
            <span className="text-yellow-500">{t('staleWarning')}</span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="shrink-0 text-right">
        {marketPrice.marketPrice > 0 ? (
          <PriceBadge
            price={marketPrice.marketPrice}
            currency={marketPrice.currency}
            trend={marketPrice.trend}
            isStale={marketPrice.isStale}
          />
        ) : (
          <span className="text-xs text-muted-foreground">{t('noPrice')}</span>
        )}
      </div>
    </div>
  );
}

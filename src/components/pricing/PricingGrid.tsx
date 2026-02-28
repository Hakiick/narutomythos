'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type { Card } from '@prisma/client';
import type { MarketPriceResult } from '@/lib/services/price-utils';
import { PriceCard } from './PriceCard';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

type SortKey = 'name' | 'priceAsc' | 'priceDesc' | 'rarity';

const rarityOrder: Record<string, number> = {
  C: 0, UC: 1, R: 2, AR: 3, S: 4, L: 5,
};

interface PricingGridProps {
  cards: Card[];
  prices: Record<string, MarketPriceResult>;
  currency: string;
}

export function PricingGrid({ cards, prices, currency }: PricingGridProps) {
  const t = useTranslations('Pricing');
  const locale = useLocale();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('rarity');
  const [rarityFilter, setRarityFilter] = useState('');

  const filteredAndSorted = useMemo(() => {
    let result = cards;

    // Filter by rarity
    if (rarityFilter) {
      result = result.filter((c) => c.rarity === rarityFilter);
    }

    // Filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) => {
        const name = (locale === 'fr' ? c.nameFr : c.nameEn) || c.nameEn;
        return name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
      });
    }

    // Sort
    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name': {
          const nameA = (locale === 'fr' ? a.nameFr : a.nameEn) || a.nameEn;
          const nameB = (locale === 'fr' ? b.nameFr : b.nameEn) || b.nameEn;
          return nameA.localeCompare(nameB);
        }
        case 'priceAsc': {
          const priceA = prices[a.id]?.marketPrice ?? 0;
          const priceB = prices[b.id]?.marketPrice ?? 0;
          return priceA - priceB;
        }
        case 'priceDesc': {
          const priceA = prices[a.id]?.marketPrice ?? 0;
          const priceB = prices[b.id]?.marketPrice ?? 0;
          return priceB - priceA;
        }
        case 'rarity':
          return (rarityOrder[b.rarity] ?? 0) - (rarityOrder[a.rarity] ?? 0);
        default:
          return 0;
      }
    });
  }, [cards, prices, searchQuery, sortBy, rarityFilter, locale]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="w-auto"
          aria-label={t('sortBy')}
        >
          <option value="rarity">{t('sortRarity')}</option>
          <option value="name">{t('sortName')}</option>
          <option value="priceDesc">{t('sortPriceDesc')}</option>
          <option value="priceAsc">{t('sortPriceAsc')}</option>
        </Select>
        <Select
          value={rarityFilter}
          onChange={(e) => setRarityFilter(e.target.value)}
          className="w-auto"
        >
          <option value="">All</option>
          <option value="C">C</option>
          <option value="UC">UC</option>
          <option value="R">R</option>
          <option value="AR">AR</option>
          <option value="S">S</option>
          <option value="L">L</option>
        </Select>
      </div>

      {/* Card count */}
      <p className="text-sm text-muted-foreground">
        {t('cardCount', { count: filteredAndSorted.length })}
      </p>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground">{t('priceDisclaimer')}</p>

      {/* Cards */}
      {filteredAndSorted.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {t('noPriceData')}
        </p>
      ) : (
        <div className="space-y-2">
          {filteredAndSorted.map((card) => {
            const mp = prices[card.id];
            const marketPrice: MarketPriceResult = mp || {
              marketPrice: 0,
              currency: currency as 'EUR' | 'USD' | 'GBP',
              trend: 'stable' as const,
              sampleSize: 0,
              isStale: true,
              confidence: 0,
              lastUpdated: null,
            };

            return (
              <PriceCard
                key={card.id}
                cardId={card.id}
                nameEn={card.nameEn}
                nameFr={card.nameFr}
                rarity={card.rarity}
                marketPrice={marketPrice}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

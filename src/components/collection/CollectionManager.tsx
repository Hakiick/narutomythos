'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { LayoutGrid, List } from 'lucide-react';
import type { Card, CollectionStatus } from '@prisma/client';
import type { CollectionCardWithCard, CollectionStats } from '@/lib/services/collection-service';
import type { CardSet } from '@/lib/services/card-service';
import { CollectionStatsPanel } from './CollectionStatsPanel';
import { CollectionCardItem } from './CollectionCardItem';
import { AddToCollectionButton } from './AddToCollectionButton';
import { SetSelector } from './SetSelector';
import { CollectionSetGrid } from './CollectionSetGrid';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CollectionManagerProps {
  initialCards: CollectionCardWithCard[];
  initialStats: CollectionStats;
  allCards: Card[];
  sets: CardSet[];
  initialSetCards: Card[];
  initialPrices: Record<string, number>;
  initialOwnedQuantities: Record<string, number>;
}

export function CollectionManager({
  initialCards,
  initialStats,
  allCards,
  sets,
  initialSetCards,
  initialPrices,
  initialOwnedQuantities,
}: CollectionManagerProps) {
  const t = useTranslations('Collection');

  const [cards, setCards] = useState(initialCards);
  const [stats, setStats] = useState(initialStats);
  const [activeTab, setActiveTab] = useState<CollectionStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'gallery' | 'list'>('gallery');
  const [activeSet, setActiveSet] = useState(sets[0]?.code ?? 'KS');
  const [setCards2, setSetCards] = useState(initialSetCards);
  const [prices, setPrices] = useState(initialPrices);
  const [ownedQuantities, setOwnedQuantities] = useState(initialOwnedQuantities);
  const [loadingSet, setLoadingSet] = useState(false);

  // Compute owned count by set from the collection cards
  const ownedCountBySet: Record<string, number> = {};
  for (const entry of cards) {
    if (entry.status === 'OWNED') {
      const set = entry.card.set;
      const existing = ownedCountBySet[set] ?? 0;
      if (!ownedCountBySet[`_ids_${set}`]) {
        ownedCountBySet[`_ids_${set}`] = 0;
      }
      ownedCountBySet[set] = existing + 1;
    }
  }
  // Simpler: count unique card ids per set
  const uniqueOwnedBySet: Record<string, number> = {};
  const seenBySet = new Map<string, Set<string>>();
  for (const entry of cards) {
    if (entry.status === 'OWNED') {
      const set = entry.card.set;
      if (!seenBySet.has(set)) seenBySet.set(set, new Set());
      seenBySet.get(set)!.add(entry.cardId);
    }
  }
  for (const [set, ids] of seenBySet) {
    uniqueOwnedBySet[set] = ids.size;
  }

  const handleSetChange = useCallback(async (setCode: string) => {
    setActiveSet(setCode);
    setLoadingSet(true);
    try {
      const [cardsRes, pricesRes, ownedRes] = await Promise.all([
        fetch(`/api/cards?set=${setCode}`),
        fetch(`/api/collection/value?set=${setCode}`),
        fetch(`/api/collection?set=${setCode}`),
      ]);

      if (cardsRes.ok) {
        const { data } = await cardsRes.json();
        if (data) setSetCards(Array.isArray(data) ? data : data.cards ?? []);
      }
      if (pricesRes.ok) {
        const { data } = await pricesRes.json();
        if (data) setPrices(typeof data === 'object' && !Array.isArray(data) && !data.cardValues ? data : {});
      }
      if (ownedRes.ok) {
        const { data } = await ownedRes.json();
        if (data?.ownedQuantities) {
          setOwnedQuantities(data.ownedQuantities);
        }
      }
    } catch { /* no-op */ }
    setLoadingSet(false);
  }, []);

  const filteredCards = cards.filter((entry) => {
    if (activeTab !== 'ALL' && entry.status !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const nameEn = entry.card.nameEn.toLowerCase();
      const nameFr = entry.card.nameFr.toLowerCase();
      const id = entry.card.id.toLowerCase();
      if (!nameEn.includes(q) && !nameFr.includes(q) && !id.includes(q)) return false;
    }
    return true;
  });

  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch('/api/collection?status=');
      if (!res.ok) return;
      const { data } = await res.json();
      if (data?.stats) setStats(data.stats);
    } catch { /* no-op */ }
  }, []);

  const handleAdd = useCallback(async (data: { cardId: string; status: string; condition: string; quantity: number; language: string }) => {
    const res = await fetch('/api/collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return;

    const listRes = await fetch('/api/collection');
    if (listRes.ok) {
      const { data: listData } = await listRes.json();
      if (listData?.cards) setCards(listData.cards);
      if (listData?.stats) setStats(listData.stats);
    }

    // Also refresh the gallery owned quantities for current set
    try {
      const ownedRes = await fetch(`/api/collection?set=${activeSet}`);
      if (ownedRes.ok) {
        const { data: ownedData } = await ownedRes.json();
        if (ownedData?.ownedQuantities) setOwnedQuantities(ownedData.ownedQuantities);
      }
    } catch { /* no-op */ }
  }, [activeSet]);

  const handleUpdate = useCallback(async (id: string, data: { status?: string; condition?: string; quantity?: number; language?: string }) => {
    const res = await fetch(`/api/collection/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return;

    setCards((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              ...(data.status !== undefined && { status: data.status as CollectionStatus }),
              ...(data.condition !== undefined && { condition: data.condition as CollectionCardWithCard['condition'] }),
              ...(data.quantity !== undefined && { quantity: data.quantity }),
              ...(data.language !== undefined && { language: data.language }),
            }
          : entry
      )
    );

    await refreshStats();
  }, [refreshStats]);

  const handleRemove = useCallback(async (id: string) => {
    const res = await fetch(`/api/collection/${id}`, { method: 'DELETE' });
    if (!res.ok) return;

    setCards((prev) => prev.filter((entry) => entry.id !== id));
    await refreshStats();
  }, [refreshStats]);

  const tabs: { key: CollectionStatus | 'ALL'; label: string }[] = [
    { key: 'ALL', label: t('all') },
    { key: 'OWNED', label: t('owned') },
    { key: 'WISHLIST', label: t('wishlist') },
    { key: 'TRADE', label: t('forTrade') },
  ];

  // Calculate collection value from prices and owned quantities
  const collectionValue = Object.entries(ownedQuantities).reduce((sum, [cardId, qty]) => {
    return sum + (prices[cardId] ?? 0) * qty;
  }, 0);

  return (
    <div className="space-y-6">
      {/* View mode toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-border p-0.5">
          <Button
            variant={viewMode === 'gallery' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('gallery')}
            className="gap-1.5 text-xs"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            {t('viewGallery')}
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="gap-1.5 text-xs"
          >
            <List className="h-3.5 w-3.5" />
            {t('viewList')}
          </Button>
        </div>

        <AddToCollectionButton allCards={allCards} onAdd={handleAdd} />
      </div>

      {viewMode === 'gallery' ? (
        /* Gallery view — by set */
        <div className="space-y-6">
          <SetSelector
            sets={sets}
            activeSet={activeSet}
            onSetChange={handleSetChange}
            ownedCountBySet={uniqueOwnedBySet}
          />

          <CollectionStatsPanel stats={stats} collectionValue={collectionValue > 0 ? collectionValue : undefined} />

          {loadingSet ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : (
            <CollectionSetGrid
              cards={setCards2}
              ownedQuantities={ownedQuantities}
              prices={prices}
            />
          )}
        </div>
      ) : (
        /* List view — original tabs */
        <div className="space-y-6">
          <CollectionStatsPanel stats={stats} />

          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <Button
                  key={tab.key}
                  variant={activeTab === tab.key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'text-xs',
                    activeTab === tab.key && 'pointer-events-none'
                  )}
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sm:max-w-xs"
            />
          </div>

          {/* Card list */}
          {filteredCards.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {cards.length === 0 ? t('noCards') : t('noCardsFiltered')}
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {t('cardCount', { count: filteredCards.length })}
              </p>
              {filteredCards.map((entry) => (
                <CollectionCardItem
                  key={entry.id}
                  entry={entry}
                  onUpdate={handleUpdate}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

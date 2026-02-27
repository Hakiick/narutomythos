'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { Card, CollectionStatus } from '@prisma/client';
import type { CollectionCardWithCard, CollectionStats } from '@/lib/services/collection-service';
import { CollectionStatsPanel } from './CollectionStatsPanel';
import { CollectionCardItem } from './CollectionCardItem';
import { AddToCollectionButton } from './AddToCollectionButton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CollectionManagerProps {
  initialCards: CollectionCardWithCard[];
  initialStats: CollectionStats;
  allCards: Card[];
}

export function CollectionManager({ initialCards, initialStats, allCards }: CollectionManagerProps) {
  const t = useTranslations('Collection');

  const [cards, setCards] = useState(initialCards);
  const [stats, setStats] = useState(initialStats);
  const [activeTab, setActiveTab] = useState<CollectionStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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

    // Refresh the full list to get updated quantities and the card relation
    const listRes = await fetch('/api/collection');
    if (listRes.ok) {
      const { data: listData } = await listRes.json();
      if (listData?.cards) setCards(listData.cards);
      if (listData?.stats) setStats(listData.stats);
    }
  }, []);

  const handleUpdate = useCallback(async (id: string, data: { status?: string; condition?: string; quantity?: number; language?: string }) => {
    const res = await fetch(`/api/collection/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return;

    // Optimistic update for quantity/status/condition/language
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

  return (
    <div className="space-y-6">
      {/* Stats */}
      <CollectionStatsPanel stats={stats} />

      {/* Add card */}
      <AddToCollectionButton allCards={allCards} onAdd={handleAdd} />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Status tabs */}
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

        {/* Search */}
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
  );
}

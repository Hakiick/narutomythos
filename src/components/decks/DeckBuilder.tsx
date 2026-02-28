'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type { Card } from '@prisma/client';
import type { DeckWithCards, DeckCardWithCard } from '@/lib/services/deck-service';
import { validateDeck, calculateStats } from '@/lib/services/deck-validator';
import { DeckHeader } from './DeckHeader';
import { DeckCardList } from './DeckCardList';
import { DeckStats } from './DeckStats';
import { DeckValidation } from './DeckValidation';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

const rarityColors: Record<string, string> = {
  C: 'bg-gray-600',
  UC: 'bg-green-700',
  R: 'bg-blue-700',
  AR: 'bg-purple-700',
  S: 'bg-yellow-600',
  L: 'bg-amber-500',
};

interface DeckBuilderProps {
  deck: DeckWithCards;
  allCards: Card[];
  isOwner: boolean;
}

export function DeckBuilder({ deck, allCards, isOwner }: DeckBuilderProps) {
  const t = useTranslations('Decks');
  const tCards = useTranslations('Cards');
  const locale = useLocale();

  const [deckCards, setDeckCards] = useState<DeckCardWithCard[]>(deck.cards);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchRarity, setSearchRarity] = useState('');

  // Computed values
  const totalCards = useMemo(
    () => deckCards.reduce((sum, dc) => sum + dc.quantity, 0),
    [deckCards]
  );

  const cardQuantityMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const dc of deckCards) {
      map.set(dc.cardId, dc.quantity);
    }
    return map;
  }, [deckCards]);

  const expandedCards = useMemo(() => {
    const cards: Card[] = [];
    for (const dc of deckCards) {
      for (let i = 0; i < dc.quantity; i++) {
        cards.push(dc.card);
      }
    }
    return cards;
  }, [deckCards]);

  const stats = useMemo(() => calculateStats(expandedCards), [expandedCards]);
  const validation = useMemo(() => validateDeck(expandedCards, []), [expandedCards]);

  // Filtered available cards
  const filteredCards = useMemo(() => {
    return allCards.filter((card) => {
      if (searchType && card.type !== searchType) return false;
      if (searchRarity && card.rarity !== searchRarity) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = (locale === 'fr' ? card.nameFr : card.nameEn) || card.nameEn;
        if (
          !name.toLowerCase().includes(query) &&
          !card.id.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [allCards, searchQuery, searchType, searchRarity, locale]);

  const handleAddCard = async (card: Card) => {
    const currentQty = cardQuantityMap.get(card.id) || 0;
    if (currentQty >= 2 || totalCards >= 30) return;

    const newQuantity = currentQty + 1;

    try {
      const res = await fetch(`/api/decks/${deck.id}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId: card.id, quantity: newQuantity }),
      });
      if (!res.ok) return;

      setDeckCards((prev) => {
        const existing = prev.find((dc) => dc.cardId === card.id);
        if (existing) {
          return prev.map((dc) =>
            dc.cardId === card.id ? { ...dc, quantity: newQuantity } : dc
          );
        }
        return [...prev, {
          id: '',
          deckId: deck.id,
          cardId: card.id,
          quantity: newQuantity,
          card,
        }].sort((a, b) => a.card.cardNumber - b.card.cardNumber);
      });
    } catch { /* Network error — no-op */ }
  };

  const handleRemoveCard = async (cardId: string) => {
    try {
      const res = await fetch(`/api/decks/${deck.id}/cards/${cardId}`, {
        method: 'DELETE',
      });
      if (!res.ok) return;

      setDeckCards((prev) => prev.filter((dc) => dc.cardId !== cardId));
    } catch { /* Network error — no-op */ }
  };

  const handleUpdateQuantity = async (cardId: string, quantity: number) => {
    if (quantity < 1) {
      handleRemoveCard(cardId);
      return;
    }
    if (quantity > 2) return;

    const currentEntry = deckCards.find((dc) => dc.cardId === cardId);
    if (!currentEntry) return;

    const quantityDiff = quantity - currentEntry.quantity;
    if (totalCards + quantityDiff > 30) return;

    try {
      const res = await fetch(`/api/decks/${deck.id}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, quantity }),
      });
      if (!res.ok) return;

      setDeckCards((prev) =>
        prev.map((dc) => (dc.cardId === cardId ? { ...dc, quantity } : dc))
      );
    } catch { /* Network error — no-op */ }
  };

  const handleUpdateDeck = async (data: { name?: string; description?: string | null; isPublic?: boolean }) => {
    await fetch(`/api/decks/${deck.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
  };

  const handleDeleteDeck = async () => {
    await fetch(`/api/decks/${deck.id}`, { method: 'DELETE' });
  };

  return (
    <div>
      <DeckHeader
        deck={deck}
        isOwner={isOwner}
        onUpdate={handleUpdateDeck}
        onDelete={handleDeleteDeck}
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left panel: Card Search */}
        {isOwner && (
          <div className="lg:w-1/2">
            <h2 className="mb-3 text-lg font-semibold">{t('cardSearch')}</h2>
            <div className="mb-4 flex flex-col gap-3">
              <Input
                type="text"
                placeholder={t('searchCards')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="flex gap-2">
                <Select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-auto"
                >
                  <option value="">{tCards('allTypes')}</option>
                  <option value="CHARACTER">{tCards('character')}</option>
                  <option value="MISSION">{tCards('mission')}</option>
                  <option value="JUTSU">{tCards('jutsu')}</option>
                </Select>
                <Select
                  value={searchRarity}
                  onChange={(e) => setSearchRarity(e.target.value)}
                  className="w-auto"
                >
                  <option value="">{tCards('allRarities')}</option>
                  <option value="C">{tCards('rarityC')}</option>
                  <option value="UC">{tCards('rarityUC')}</option>
                  <option value="R">{tCards('rarityR')}</option>
                  <option value="AR">{tCards('rarityAR')}</option>
                  <option value="S">{tCards('rarityS')}</option>
                  <option value="L">{tCards('rarityL')}</option>
                </Select>
              </div>
            </div>

            {/* Available cards grid */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filteredCards.map((card) => {
                const name = (locale === 'fr' ? card.nameFr : card.nameEn) || card.nameEn;
                const currentQty = cardQuantityMap.get(card.id) || 0;
                const isMaxed = currentQty >= 2;
                const isDeckFull = totalCards >= 30;
                const disabled = isMaxed || isDeckFull;

                return (
                  <div
                    key={card.id}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border border-border p-2 text-sm transition-colors',
                      disabled
                        ? 'opacity-40'
                        : 'cursor-pointer hover:border-primary/50'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium">{name}</span>
                        <Badge
                          className={cn(
                            'shrink-0 border-transparent text-[10px] text-white',
                            rarityColors[card.rarity] || 'bg-gray-600'
                          )}
                        >
                          {card.rarity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{card.id}</span>
                        {card.chakra !== null && (
                          <span className="text-blue-400">C:{card.chakra}</span>
                        )}
                        {card.power !== null && (
                          <span className="text-red-400">P:{card.power}</span>
                        )}
                      </div>
                    </div>
                    {currentQty > 0 && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        x{currentQty}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => handleAddCard(card)}
                      disabled={disabled}
                      aria-label={t('addCard')}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Right panel: Deck Composition */}
        <div className={isOwner ? 'lg:w-1/2' : 'w-full'}>
          <h2 className="mb-3 text-lg font-semibold">{t('deckComposition')}</h2>

          <div className="space-y-4">
            <DeckValidation validationResult={validation} />

            <DeckCardList
              cards={deckCards}
              onRemoveCard={handleRemoveCard}
              onUpdateQuantity={handleUpdateQuantity}
              readonly={!isOwner}
            />

            {totalCards > 0 && <DeckStats stats={stats} />}
          </div>
        </div>
      </div>
    </div>
  );
}

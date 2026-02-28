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
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Plus, ChevronDown } from 'lucide-react';

const EFFECT_TYPES = ['MAIN', 'UPGRADE', 'AMBUSH', 'SCORE'] as const;

const rarityColors: Record<string, string> = {
  C: 'bg-gray-600',
  UC: 'bg-green-700',
  R: 'bg-blue-700',
  AR: 'bg-purple-700',
  S: 'bg-yellow-600',
  L: 'bg-amber-500',
  MYTHOS: 'bg-rose-600',
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
  const [searchGroup, setSearchGroup] = useState('');
  const [chakraMin, setChakraMin] = useState<number | undefined>();
  const [chakraMax, setChakraMax] = useState<number | undefined>();
  const [powerMin, setPowerMin] = useState<number | undefined>();
  const [powerMax, setPowerMax] = useState<number | undefined>();
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [selectedEffectTypes, setSelectedEffectTypes] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Computed values
  const totalCards = useMemo(
    () => deckCards.reduce((sum, dc) => sum + dc.quantity, 0),
    [deckCards]
  );

  const mainDeckCount = useMemo(
    () => deckCards.filter((dc) => dc.card.type !== 'MISSION').reduce((sum, dc) => sum + dc.quantity, 0),
    [deckCards]
  );

  const missionCount = useMemo(
    () => deckCards.filter((dc) => dc.card.type === 'MISSION').reduce((sum, dc) => sum + dc.quantity, 0),
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

  const mainDeckCards = useMemo(() => expandedCards.filter((c) => c.type !== 'MISSION'), [expandedCards]);
  const stats = useMemo(() => calculateStats(mainDeckCards), [mainDeckCards]);
  const validation = useMemo(() => validateDeck(expandedCards), [expandedCards]);

  const availableGroups = useMemo(() => {
    const groups = new Set<string>();
    for (const card of allCards) {
      if (card.group) groups.add(card.group);
    }
    return Array.from(groups).sort();
  }, [allCards]);

  const availableKeywords = useMemo(() => {
    const kws = new Set<string>();
    for (const card of allCards) {
      for (const kw of card.keywords) {
        kws.add(kw);
      }
    }
    return Array.from(kws).sort();
  }, [allCards]);

  // Filtered available cards
  const filteredCards = useMemo(() => {
    return allCards.filter((card) => {
      if (searchType && card.type !== searchType) return false;
      if (searchRarity && card.rarity !== searchRarity) return false;
      if (searchGroup && card.group !== searchGroup) return false;
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
      if (chakraMin !== undefined && (card.chakra === null || card.chakra < chakraMin)) return false;
      if (chakraMax !== undefined && (card.chakra === null || card.chakra > chakraMax)) return false;
      if (powerMin !== undefined && (card.power === null || card.power < powerMin)) return false;
      if (powerMax !== undefined && (card.power === null || card.power > powerMax)) return false;
      if (selectedKeywords.length > 0) {
        if (!selectedKeywords.some((kw) => card.keywords.includes(kw))) return false;
      }
      if (selectedEffectTypes.length > 0) {
        const effectText = ((locale === 'fr' ? card.effectFr : card.effectEn) || card.effectEn || '');
        if (!selectedEffectTypes.some((et) => effectText.includes(et))) return false;
      }
      return true;
    });
  }, [allCards, searchQuery, searchType, searchRarity, searchGroup, chakraMin, chakraMax, powerMin, powerMax, selectedKeywords, selectedEffectTypes, locale]);

  const handleAddCard = async (card: Card) => {
    const currentQty = cardQuantityMap.get(card.id) || 0;
    if (currentQty >= 2) return;
    // Mission cards have a separate cap of 3, main deck cards cap at 30
    if (card.type === 'MISSION' && missionCount >= 3) return;
    if (card.type !== 'MISSION' && mainDeckCount >= 30) return;

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
    const isMission = currentEntry.card.type === 'MISSION';
    if (isMission && missionCount + quantityDiff > 3) return;
    if (!isMission && mainDeckCount + quantityDiff > 30) return;

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
              <div className="flex flex-wrap gap-2">
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
                  <option value="MYTHOS">{tCards('rarityMYTHOS')}</option>
                </Select>
                <Select
                  value={searchGroup}
                  onChange={(e) => setSearchGroup(e.target.value)}
                  className="w-auto"
                >
                  <option value="">{tCards('allGroups')}</option>
                  {availableGroups.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </Select>
              </div>

              {/* Advanced Filters Toggle */}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={cn(
                  'flex w-fit items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground',
                  (selectedKeywords.length > 0 || selectedEffectTypes.length > 0 || chakraMin !== undefined || chakraMax !== undefined || powerMin !== undefined || powerMax !== undefined) && 'text-primary'
                )}
              >
                <ChevronDown className={cn('h-3 w-3 transition-transform', showAdvanced && 'rotate-180')} />
                {showAdvanced ? tCards('hideAdvancedFilters') : tCards('showAdvancedFilters')}
              </button>

              {showAdvanced && (
                <div className="flex flex-col gap-3 rounded-lg border border-border p-3">
                  {/* Chakra & Power ranges */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="mb-1 text-xs">{tCards('chakraRange')}</Label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          max={8}
                          placeholder="0"
                          className="w-14 text-xs"
                          value={chakraMin ?? ''}
                          onChange={(e) => setChakraMin(e.target.value ? Number(e.target.value) : undefined)}
                        />
                        <span className="text-xs text-muted-foreground">—</span>
                        <Input
                          type="number"
                          min={0}
                          max={8}
                          placeholder="8"
                          className="w-14 text-xs"
                          value={chakraMax ?? ''}
                          onChange={(e) => setChakraMax(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="mb-1 text-xs">{tCards('powerRange')}</Label>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min={0}
                          max={9}
                          placeholder="0"
                          className="w-14 text-xs"
                          value={powerMin ?? ''}
                          onChange={(e) => setPowerMin(e.target.value ? Number(e.target.value) : undefined)}
                        />
                        <span className="text-xs text-muted-foreground">—</span>
                        <Input
                          type="number"
                          min={0}
                          max={9}
                          placeholder="9"
                          className="w-14 text-xs"
                          value={powerMax ?? ''}
                          onChange={(e) => setPowerMax(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Keywords badges */}
                  {availableKeywords.length > 0 && (
                    <div>
                      <Label className="mb-1 text-xs">{tCards('keywordsFilter')}</Label>
                      <div className="flex flex-wrap gap-1">
                        {availableKeywords.map((kw) => (
                          <Badge
                            key={kw}
                            variant={selectedKeywords.includes(kw) ? 'default' : 'outline'}
                            className="cursor-pointer text-[10px]"
                            onClick={() =>
                              setSelectedKeywords((prev) =>
                                prev.includes(kw) ? prev.filter((k) => k !== kw) : [...prev, kw]
                              )
                            }
                          >
                            {kw}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Effect Type badges */}
                  <div>
                    <Label className="mb-1 text-xs">{tCards('effectType')}</Label>
                    <div className="flex flex-wrap gap-1">
                      {EFFECT_TYPES.map((et) => {
                        const labelKey = `effect${et.charAt(0) + et.slice(1).toLowerCase()}` as 'effectMain' | 'effectUpgrade' | 'effectAmbush' | 'effectScore';
                        return (
                          <Badge
                            key={et}
                            variant={selectedEffectTypes.includes(et) ? 'default' : 'outline'}
                            className="cursor-pointer text-[10px]"
                            onClick={() =>
                              setSelectedEffectTypes((prev) =>
                                prev.includes(et) ? prev.filter((e) => e !== et) : [...prev, et]
                              )
                            }
                          >
                            {tCards(labelKey)}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Available cards grid */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filteredCards.map((card) => {
                const name = (locale === 'fr' ? card.nameFr : card.nameEn) || card.nameEn;
                const currentQty = cardQuantityMap.get(card.id) || 0;
                const isMaxed = currentQty >= 2;
                const isMission = card.type === 'MISSION';
                const isDeckFull = isMission ? missionCount >= 3 : mainDeckCount >= 30;
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

'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type { Card } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

const rarityColors: Record<string, string> = {
  C: 'bg-gray-600',
  UC: 'bg-green-700',
  R: 'bg-blue-700',
  AR: 'bg-purple-700',
  S: 'bg-yellow-600',
  L: 'bg-amber-500',
};

interface AddToCollectionButtonProps {
  allCards: Card[];
  onAdd: (data: { cardId: string; status: string; condition: string; quantity: number; language: string }) => Promise<void>;
}

export function AddToCollectionButton({ allCards, onAdd }: AddToCollectionButtonProps) {
  const t = useTranslations('Collection');
  const locale = useLocale();

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCardId, setSelectedCardId] = useState('');
  const [status, setStatus] = useState('OWNED');
  const [condition, setCondition] = useState('NEAR_MINT');
  const [quantity, setQuantity] = useState(1);
  const [language, setLanguage] = useState(locale === 'fr' ? 'fr' : 'en');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCards = useMemo(() => {
    if (!searchQuery) return allCards.slice(0, 20);
    const q = searchQuery.toLowerCase();
    return allCards.filter((card) => {
      const name = locale === 'fr' ? card.nameFr : card.nameEn;
      return name.toLowerCase().includes(q) || card.id.toLowerCase().includes(q);
    }).slice(0, 20);
  }, [allCards, searchQuery, locale]);

  const selectedCard = allCards.find((c) => c.id === selectedCardId);

  const handleSubmit = async () => {
    if (!selectedCardId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAdd({ cardId: selectedCardId, status, condition, quantity, language });
      setSelectedCardId('');
      setSearchQuery('');
      setQuantity(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4" />
        {t('addCard')}
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{t('addCardTitle')}</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => { setIsOpen(false); setSelectedCardId(''); setSearchQuery(''); }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {/* Card search */}
        {!selectedCard ? (
          <>
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <div className="max-h-48 space-y-1 overflow-y-auto">
              {filteredCards.map((card) => {
                const name = locale === 'fr' ? card.nameFr : card.nameEn;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => { setSelectedCardId(card.id); setSearchQuery(''); }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                  >
                    <span className="truncate">{name}</span>
                    <Badge
                      className={cn(
                        'shrink-0 border-transparent text-[10px] text-white',
                        rarityColors[card.rarity] || 'bg-gray-600'
                      )}
                    >
                      {card.rarity}
                    </Badge>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">{card.id}</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {/* Selected card display */}
            <div className="flex items-center gap-2 rounded-md bg-accent/50 px-3 py-2 text-sm">
              <span className="font-medium">
                {locale === 'fr' ? selectedCard.nameFr : selectedCard.nameEn}
              </span>
              <Badge
                className={cn(
                  'shrink-0 border-transparent text-[10px] text-white',
                  rarityColors[selectedCard.rarity] || 'bg-gray-600'
                )}
              >
                {selectedCard.rarity}
              </Badge>
              <span className="text-xs text-muted-foreground">{selectedCard.id}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto h-6 w-6"
                onClick={() => setSelectedCardId('')}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">{t('status')}</label>
                <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="OWNED">{t('owned')}</option>
                  <option value="WISHLIST">{t('wishlist')}</option>
                  <option value="TRADE">{t('forTrade')}</option>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">{t('condition')}</label>
                <Select value={condition} onChange={(e) => setCondition(e.target.value)}>
                  <option value="MINT">{t('conditionMint')}</option>
                  <option value="NEAR_MINT">{t('conditionNearMint')}</option>
                  <option value="EXCELLENT">{t('conditionExcellent')}</option>
                  <option value="GOOD">{t('conditionGood')}</option>
                  <option value="PLAYED">{t('conditionPlayed')}</option>
                  <option value="POOR">{t('conditionPoor')}</option>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">{t('quantity')}</label>
                <Input
                  type="number"
                  min={1}
                  max={99}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(99, parseInt(e.target.value) || 1)))}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">{t('language')}</label>
                <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="en">{t('langEn')}</option>
                  <option value="fr">{t('langFr')}</option>
                </Select>
              </div>
            </div>

            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
              {isSubmitting ? '...' : t('addCard')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

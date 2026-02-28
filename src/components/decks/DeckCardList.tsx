'use client';

import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import type { DeckCardWithCard } from '@/lib/services/deck-service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Minus, Plus, X } from 'lucide-react';

const rarityColors: Record<string, string> = {
  C: 'bg-gray-600',
  UC: 'bg-green-700',
  R: 'bg-blue-700',
  AR: 'bg-purple-700',
  S: 'bg-yellow-600',
  L: 'bg-amber-500',
};

interface DeckCardListProps {
  cards: DeckCardWithCard[];
  onRemoveCard: (cardId: string) => void;
  onUpdateQuantity: (cardId: string, quantity: number) => void;
  readonly?: boolean;
}

export function DeckCardList({ cards, onRemoveCard, onUpdateQuantity, readonly = false }: DeckCardListProps) {
  const t = useTranslations('Decks');
  const tCards = useTranslations('Cards');
  const locale = useLocale();

  const totalCards = cards.reduce((sum, dc) => sum + dc.quantity, 0);

  if (cards.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('emptyDeck')}
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3 text-sm font-medium text-muted-foreground">
        {t('cardCount', { count: totalCards })}
      </div>
      <div className="space-y-2">
        {cards.map((dc) => {
          const name = (locale === 'fr' ? dc.card.nameFr : dc.card.nameEn) || dc.card.nameEn;
          const typeLabel =
            dc.card.type === 'CHARACTER' ? tCards('character') :
            dc.card.type === 'MISSION' ? tCards('mission') :
            tCards('jutsu');

          return (
            <div
              key={dc.cardId}
              className="flex items-center gap-2 rounded-lg border border-border bg-card p-2 text-sm"
            >
              {/* Card thumbnail */}
              {dc.card.imageUrl && (
                <div className="relative h-10 w-7 shrink-0 overflow-hidden rounded">
                  <Image
                    src={dc.card.imageUrl}
                    alt={name}
                    fill
                    sizes="28px"
                    className="object-cover"
                  />
                </div>
              )}

              {/* Card info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{name}</span>
                  <Badge
                    className={cn(
                      'shrink-0 border-transparent text-[10px] text-white',
                      rarityColors[dc.card.rarity] || 'bg-gray-600'
                    )}
                  >
                    {dc.card.rarity}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{dc.card.id}</span>
                  <span>{typeLabel}</span>
                  {dc.card.chakra !== null && (
                    <span className="text-blue-400">{tCards('chakra')}: {dc.card.chakra}</span>
                  )}
                </div>
              </div>

              {/* Quantity controls */}
              {!readonly && (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      if (dc.quantity > 1) {
                        onUpdateQuantity(dc.cardId, dc.quantity - 1);
                      } else {
                        onRemoveCard(dc.cardId);
                      }
                    }}
                    aria-label={t('decreaseQuantity')}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-5 text-center font-semibold">{dc.quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onUpdateQuantity(dc.cardId, dc.quantity + 1)}
                    disabled={dc.quantity >= 2}
                    aria-label={t('increaseQuantity')}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveCard(dc.cardId)}
                    aria-label={t('removeCard')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Read-only quantity */}
              {readonly && (
                <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                  x{dc.quantity}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

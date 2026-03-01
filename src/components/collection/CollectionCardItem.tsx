'use client';

import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import type { CollectionCardWithCard } from '@/lib/services/collection-service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/storage';
import { Minus, Plus, Trash2 } from 'lucide-react';

const rarityColors: Record<string, string> = {
  C: 'bg-gray-600',
  UC: 'bg-green-700',
  R: 'bg-blue-700',
  AR: 'bg-purple-700',
  S: 'bg-yellow-600',
  L: 'bg-amber-500',
};

const statusColors: Record<string, string> = {
  OWNED: 'bg-green-600',
  WISHLIST: 'bg-blue-600',
  TRADE: 'bg-orange-600',
};

interface CollectionCardItemProps {
  entry: CollectionCardWithCard;
  onUpdate: (id: string, data: { status?: string; condition?: string; quantity?: number; language?: string }) => void;
  onRemove: (id: string) => void;
}

export function CollectionCardItem({ entry, onUpdate, onRemove }: CollectionCardItemProps) {
  const t = useTranslations('Collection');
  const tCards = useTranslations('Cards');
  const locale = useLocale();

  const name = (locale === 'fr' ? entry.card.nameFr : entry.card.nameEn) || entry.card.nameEn;
  const resolvedImageUrl = getImageUrl(entry.card.imageUrl);
  const typeLabel =
    entry.card.type === 'CHARACTER' ? tCards('character') :
    entry.card.type === 'MISSION' ? tCards('mission') :
    tCards('jutsu');

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center">
      {/* Card thumbnail */}
      {resolvedImageUrl && (
        <div className="relative hidden h-12 w-9 shrink-0 overflow-hidden rounded sm:block">
          <Image
            src={resolvedImageUrl}
            alt={name}
            fill
            sizes="36px"
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
              rarityColors[entry.card.rarity] || 'bg-gray-600'
            )}
          >
            {entry.card.rarity}
          </Badge>
          <Badge
            className={cn(
              'shrink-0 border-transparent text-[10px] text-white',
              statusColors[entry.status] || 'bg-gray-600'
            )}
          >
            {entry.status === 'OWNED' ? t('owned') :
             entry.status === 'WISHLIST' ? t('wishlist') :
             t('forTrade')}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{entry.card.id}</span>
          <span>{typeLabel}</span>
          {entry.card.chakra !== null && (
            <span className="text-blue-400">{tCards('chakra')}: {entry.card.chakra}</span>
          )}
          {entry.card.power !== null && (
            <span className="text-red-400">{tCards('power')}: {entry.card.power}</span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status */}
        <Select
          value={entry.status}
          onChange={(e) => onUpdate(entry.id, { status: e.target.value })}
          className="h-8 w-auto text-xs"
          aria-label={t('status')}
        >
          <option value="OWNED">{t('owned')}</option>
          <option value="WISHLIST">{t('wishlist')}</option>
          <option value="TRADE">{t('forTrade')}</option>
        </Select>

        {/* Condition */}
        <Select
          value={entry.condition}
          onChange={(e) => onUpdate(entry.id, { condition: e.target.value })}
          className="h-8 w-auto text-xs"
          aria-label={t('condition')}
        >
          <option value="MINT">{t('conditionMint')}</option>
          <option value="NEAR_MINT">{t('conditionNearMint')}</option>
          <option value="EXCELLENT">{t('conditionExcellent')}</option>
          <option value="GOOD">{t('conditionGood')}</option>
          <option value="PLAYED">{t('conditionPlayed')}</option>
          <option value="POOR">{t('conditionPoor')}</option>
        </Select>

        {/* Language */}
        <Select
          value={entry.language}
          onChange={(e) => onUpdate(entry.id, { language: e.target.value })}
          className="h-8 w-auto text-xs"
          aria-label={t('language')}
        >
          <option value="en">{t('langEn')}</option>
          <option value="fr">{t('langFr')}</option>
        </Select>

        {/* Quantity */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              if (entry.quantity > 1) {
                onUpdate(entry.id, { quantity: entry.quantity - 1 });
              } else {
                onRemove(entry.id);
              }
            }}
            aria-label={t('decreaseQuantity')}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-6 text-center text-sm font-semibold">{entry.quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onUpdate(entry.id, { quantity: entry.quantity + 1 })}
            disabled={entry.quantity >= 99}
            aria-label={t('increaseQuantity')}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        {/* Remove */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(entry.id)}
          aria-label={t('removeCard')}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

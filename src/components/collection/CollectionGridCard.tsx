'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import type { Card } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/storage';
import { CardDetailDialog } from '@/components/cards/CardDetailDialog';

interface CollectionGridCardProps {
  card: Card;
  isOwned: boolean;
  quantity: number;
  price?: number;
}

const rarityColors: Record<string, string> = {
  C: 'bg-gray-600',
  UC: 'bg-green-700',
  R: 'bg-blue-700',
  AR: 'bg-purple-700',
  S: 'bg-yellow-600',
  L: 'bg-amber-500',
  MYTHOS: 'bg-rose-600',
};

export function CollectionGridCard({ card, isOwned, quantity, price }: CollectionGridCardProps) {
  const t = useTranslations('Collection');
  const locale = useLocale();
  const [dialogOpen, setDialogOpen] = useState(false);

  const name = (locale === 'fr' ? card.nameFr : card.nameEn) || card.nameEn;
  const resolvedImageUrl = getImageUrl(card.imageUrl);

  return (
    <>
      <div
        className={cn(
          'group relative cursor-pointer rounded-xl border border-border bg-card p-3 shadow-sm transition-all',
          isOwned
            ? 'hover:border-primary/50 hover:shadow-md'
            : 'opacity-40 grayscale hover:opacity-60 hover:grayscale-[50%]'
        )}
        onClick={() => setDialogOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setDialogOpen(true);
          }
        }}
      >
        {/* Quantity badge */}
        {isOwned && quantity > 0 && (
          <div className="absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-[10px] font-bold text-white shadow-sm">
            {quantity}
          </div>
        )}

        {/* Card header */}
        <div className="mb-2 flex items-start justify-between gap-1">
          <span className="text-xs text-muted-foreground">{card.id}</span>
          <Badge
            className={cn(
              'border-transparent text-[10px] text-white',
              rarityColors[card.rarity] || 'bg-gray-600'
            )}
          >
            {card.rarity}
          </Badge>
        </div>

        {/* Card image */}
        <div className={cn(
          'relative mb-3 overflow-hidden rounded-lg bg-secondary',
          card.type === 'MISSION' ? 'aspect-[88/63]' : 'aspect-[63/88]'
        )}>
          {resolvedImageUrl ? (
            <Image
              src={resolvedImageUrl}
              alt={name}
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 768px) 30vw, (max-width: 1024px) 22vw, 16vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl">
              {card.type === 'CHARACTER' ? '\u{1F977}' : card.type === 'MISSION' ? '\u{1F4DC}' : '\u26A1'}
            </div>
          )}
        </div>

        {/* Card name */}
        <h3 className="mb-1 text-sm font-semibold leading-tight group-hover:text-primary">
          {name}
        </h3>

        {/* Price */}
        {price !== undefined && price > 0 ? (
          <p className="text-xs font-medium text-emerald-500">
            {price.toFixed(2)} €
          </p>
        ) : (
          !isOwned && (
            <p className="text-[10px] text-muted-foreground">{t('notOwned')}</p>
          )
        )}
      </div>

      <CardDetailDialog
        card={card}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import type { Card } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CardDetailDialog } from './CardDetailDialog';

interface CardItemProps {
  card: Card;
}

export const rarityColors: Record<string, string> = {
  C: 'bg-gray-600 hover:bg-gray-600/80',
  UC: 'bg-green-700 hover:bg-green-700/80',
  R: 'bg-blue-700 hover:bg-blue-700/80',
  AR: 'bg-purple-700 hover:bg-purple-700/80',
  S: 'bg-yellow-600 hover:bg-yellow-600/80',
  L: 'bg-amber-500 hover:bg-amber-500/80',
};

export function CardItem({ card }: CardItemProps) {
  const t = useTranslations('Cards');
  const locale = useLocale();
  const [dialogOpen, setDialogOpen] = useState(false);

  const name = (locale === 'fr' ? card.nameFr : card.nameEn) || card.nameEn;

  return (
    <>
      <div
        className="group cursor-pointer rounded-xl border border-border bg-card p-3 shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
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
          {card.imageUrl ? (
            <Image
              src={card.imageUrl}
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

        {/* Type badge */}
        <span className="text-[10px] font-medium uppercase text-muted-foreground">
          {card.type === 'CHARACTER'
            ? t('character')
            : card.type === 'MISSION'
              ? t('mission')
              : t('jutsu')}
        </span>

        {/* Stats */}
        {card.type === 'CHARACTER' && (
          <div className="mt-2 flex gap-3 text-xs">
            {card.chakra !== null && (
              <span>
                <span className="text-muted-foreground">{t('chakra')}:</span>{' '}
                <span className="font-semibold text-blue-400">{card.chakra}</span>
              </span>
            )}
            {card.power !== null && (
              <span>
                <span className="text-muted-foreground">{t('power')}:</span>{' '}
                <span className="font-semibold text-red-400">{card.power}</span>
              </span>
            )}
          </div>
        )}

        {/* Keywords */}
        {card.keywords.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {card.keywords.map((keyword) => (
              <Badge
                key={keyword}
                variant="secondary"
                className="text-[10px]"
              >
                {keyword}
              </Badge>
            ))}
          </div>
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

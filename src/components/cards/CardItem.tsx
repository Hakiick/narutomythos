'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import type { Card } from '@prisma/client';

interface CardItemProps {
  card: Card;
}

const rarityColors: Record<string, string> = {
  C: 'bg-gray-600',
  UC: 'bg-green-700',
  R: 'bg-blue-700',
  AR: 'bg-purple-700',
  S: 'bg-yellow-600',
  L: 'bg-amber-500',
};

export function CardItem({ card }: CardItemProps) {
  const t = useTranslations('Cards');
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);

  const name = locale === 'fr' ? card.nameFr : card.nameEn;
  const effect = locale === 'fr' ? card.effectFr : card.effectEn;

  return (
    <div
      className="group cursor-pointer rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/50"
      onClick={() => setExpanded(!expanded)}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setExpanded(!expanded);
        }
      }}
    >
      {/* Card header */}
      <div className="mb-2 flex items-start justify-between gap-1">
        <span className="text-xs text-muted-foreground">{card.id}</span>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${rarityColors[card.rarity] || 'bg-gray-600'}`}
        >
          {card.rarity}
        </span>
      </div>

      {/* Card image placeholder */}
      <div className="mb-3 flex aspect-[63/88] items-center justify-center rounded bg-secondary text-4xl">
        {card.type === 'CHARACTER' ? '🥷' : card.type === 'MISSION' ? '📜' : '⚡'}
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
            <span
              key={keyword}
              className="rounded bg-secondary px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {keyword}
            </span>
          ))}
        </div>
      )}

      {/* Expanded: effect */}
      {expanded && effect && (
        <p className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
          {effect}
        </p>
      )}
    </div>
  );
}

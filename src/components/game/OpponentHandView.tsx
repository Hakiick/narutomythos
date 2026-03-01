'use client';

import { useTranslations } from 'next-intl';

interface OpponentHandViewProps {
  cardCount: number;
}

export function OpponentHandView({ cardCount }: OpponentHandViewProps) {
  const t = useTranslations('Play');

  return (
    <div className="flex flex-col items-center gap-1 py-1">
      <span className="text-[10px] text-muted-foreground">
        {t('game.opponentHand')}: {cardCount}
      </span>
      <div className="flex items-center justify-center -space-x-4">
        {Array.from({ length: Math.min(cardCount, 10) }, (_, i) => (
          <div
            key={i}
            className="card-back-pattern h-10 w-7 flex-shrink-0 rounded-sm border border-slate-600/50 sm:h-12 sm:w-[34px]"
            style={{ zIndex: i }}
          />
        ))}
        {cardCount === 0 && (
          <span className="text-[10px] text-muted-foreground">&mdash;</span>
        )}
      </div>
    </div>
  );
}

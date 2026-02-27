'use client';

import { useTranslations } from 'next-intl';
import type { DeckStats as DeckStatsType } from '@/lib/services/deck-validator';
import { Badge } from '@/components/ui/badge';

interface DeckStatsProps {
  stats: DeckStatsType;
}

export function DeckStats({ stats }: DeckStatsProps) {
  const t = useTranslations('Decks');
  const tCards = useTranslations('Cards');

  const maxChakraCount = Math.max(...Object.values(stats.chakraCurve), 1);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">{t('stats')}</h3>

      {/* Chakra Curve */}
      <div>
        <p className="mb-2 text-xs text-muted-foreground">{t('chakraCurve')}</p>
        <div className="flex items-end gap-1">
          {[0, 1, 2, 3, 4, 5].map((cost) => {
            const count = stats.chakraCurve[cost] || 0;
            const height = maxChakraCount > 0 ? (count / maxChakraCount) * 100 : 0;
            return (
              <div key={cost} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-muted-foreground">{count}</span>
                <div className="w-full rounded-t bg-secondary" style={{ height: '60px' }}>
                  <div
                    className="mt-auto w-full rounded-t bg-blue-500 transition-all"
                    style={{ height: `${height}%`, marginTop: `${100 - height}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {cost === 5 ? '5+' : cost}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Type Distribution */}
      <div>
        <p className="mb-2 text-xs text-muted-foreground">{t('typeDistribution')}</p>
        <div className="flex flex-wrap gap-2">
          {(['CHARACTER', 'JUTSU', 'MISSION'] as const).map((type) => {
            const count = stats.typeDistribution[type] || 0;
            const label = type === 'CHARACTER' ? tCards('character') : type === 'MISSION' ? tCards('mission') : tCards('jutsu');
            return (
              <Badge key={type} variant="secondary" className="text-xs">
                {label}: {count}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Rarity Distribution */}
      <div>
        <p className="mb-2 text-xs text-muted-foreground">{t('rarityDistribution')}</p>
        <div className="flex flex-wrap gap-2">
          {(['C', 'UC', 'R', 'AR', 'S', 'L'] as const).map((rarity) => {
            const count = stats.rarityDistribution[rarity] || 0;
            if (count === 0) return null;
            return (
              <Badge key={rarity} variant="secondary" className="text-xs">
                {rarity}: {count}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Averages */}
      <div className="flex gap-4">
        <div>
          <p className="text-xs text-muted-foreground">{t('averageChakra')}</p>
          <p className="text-lg font-semibold text-blue-400">{stats.averageChakra}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{t('averagePower')}</p>
          <p className="text-lg font-semibold text-red-400">{stats.averagePower}</p>
        </div>
      </div>
    </div>
  );
}

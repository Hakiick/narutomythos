'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { DeckStats as DeckStatsType } from '@/lib/services/deck-validator';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface DeckStatsProps {
  stats: DeckStatsType;
}

const typeColors: Record<string, string> = {
  CHARACTER: 'bg-blue-500',
  JUTSU: 'bg-purple-500',
  MISSION: 'bg-amber-500',
};

const rarityBarColors: Record<string, string> = {
  C: 'bg-gray-500',
  UC: 'bg-green-600',
  R: 'bg-blue-600',
  AR: 'bg-purple-600',
  S: 'bg-yellow-500',
  L: 'bg-amber-500',
};

const villageColors: Record<string, string> = {
  'Leaf Village': 'bg-green-600 text-white',
  'Sand Village': 'bg-yellow-600 text-white',
  'Sound Village': 'bg-purple-600 text-white',
  'Akatsuki': 'bg-red-600 text-white',
  'Independent': 'bg-gray-500 text-white',
};

export function DeckStats({ stats }: DeckStatsProps) {
  const t = useTranslations('Decks');
  const tCards = useTranslations('Cards');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const maxChakraCount = Math.max(...Object.values(stats.chakraCurve), 1);

  const typeEntries = (['CHARACTER', 'JUTSU', 'MISSION'] as const)
    .map((type) => ({ type, count: stats.typeDistribution[type] || 0 }))
    .filter((e) => e.count > 0);
  const typeTotal = typeEntries.reduce((s, e) => s + e.count, 0);

  const rarityEntries = (['C', 'UC', 'R', 'AR', 'S', 'L'] as const)
    .map((rarity) => ({ rarity, count: stats.rarityDistribution[rarity] || 0 }))
    .filter((e) => e.count > 0);
  const rarityTotal = rarityEntries.reduce((s, e) => s + e.count, 0);

  const groupEntries = Object.entries(stats.groupDistribution)
    .sort(([, a], [, b]) => b - a);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-sm">{t('stats')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Section 1: Chakra Curve */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">{t('chakraCurve')}</p>
          <div className="flex items-end gap-1">
            {[0, 1, 2, 3, 4, 5].map((cost) => {
              const count = stats.chakraCurve[cost] || 0;
              const height = maxChakraCount > 0 ? (count / maxChakraCount) * 100 : 0;
              return (
                <div key={cost} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-semibold">{count}</span>
                  <div className="w-full rounded-t-md bg-secondary" style={{ height: '100px' }}>
                    <div
                      className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-500 ease-out hover:shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                      style={{
                        height: mounted ? `${height}%` : '0%',
                        marginTop: mounted ? `${100 - height}%` : '100%',
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {cost === 5 ? '5+' : cost}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Section 2: Type Distribution (stacked bar) */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">{t('typeDistribution')}</p>
          {typeTotal > 0 && (
            <>
              <div className="h-6 overflow-hidden rounded-full bg-secondary">
                <div className="flex h-full">
                  {typeEntries.map(({ type, count }) => (
                    <div
                      key={type}
                      className={`${typeColors[type]} transition-all duration-500`}
                      style={{ width: `${(count / typeTotal) * 100}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-3">
                {typeEntries.map(({ type, count }) => {
                  const label = type === 'CHARACTER' ? tCards('character') : type === 'MISSION' ? tCards('mission') : tCards('jutsu');
                  return (
                    <div key={type} className="flex items-center gap-1.5">
                      <div className={`h-2.5 w-2.5 rounded-full ${typeColors[type]}`} />
                      <span className="text-xs text-muted-foreground">{label}: {count}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Section 3: Rarity Distribution (stacked bar) */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">{t('rarityDistribution')}</p>
          {rarityTotal > 0 && (
            <>
              <div className="h-6 overflow-hidden rounded-full bg-secondary">
                <div className="flex h-full">
                  {rarityEntries.map(({ rarity, count }) => (
                    <div
                      key={rarity}
                      className={`${rarityBarColors[rarity]} transition-all duration-500`}
                      style={{ width: `${(count / rarityTotal) * 100}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {rarityEntries.map(({ rarity, count }) => (
                  <div key={rarity} className="flex items-center gap-1.5">
                    <div className={`h-2.5 w-2.5 rounded-full ${rarityBarColors[rarity]}`} />
                    <span className="text-xs text-muted-foreground">{rarity}: {count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Section 4: Averages (mini cards) */}
        <div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-center">
              <p className="text-xs text-muted-foreground">{t('averageChakra')}</p>
              <p className="text-2xl font-bold text-blue-400">{stats.averageChakra}</p>
            </div>
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center">
              <p className="text-xs text-muted-foreground">{t('averagePower')}</p>
              <p className="text-2xl font-bold text-red-400">{stats.averagePower}</p>
            </div>
          </div>
        </div>

        {/* Section 5: Village Distribution */}
        {groupEntries.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">{t('groupDistribution')}</p>
              <div className="flex flex-wrap gap-2">
                {groupEntries.map(([village, count]) => (
                  <Badge
                    key={village}
                    className={`border-transparent text-xs ${villageColors[village] || 'bg-gray-500 text-white'}`}
                  >
                    {village}: {count}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

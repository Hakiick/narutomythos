'use client';

import { useTranslations } from 'next-intl';
import type { CollectionStats } from '@/lib/services/collection-service';

interface CollectionStatsPanelProps {
  stats: CollectionStats;
}

export function CollectionStatsPanel({ stats }: CollectionStatsPanelProps) {
  const t = useTranslations('Collection');

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-xs text-muted-foreground">{t('totalOwned')}</p>
        <p className="text-2xl font-bold">{stats.totalOwned}</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-xs text-muted-foreground">{t('uniqueOwned')}</p>
        <p className="text-2xl font-bold">{stats.uniqueOwned}</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-xs text-muted-foreground">{t('totalWishlist')}</p>
        <p className="text-2xl font-bold">{stats.totalWishlist}</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-xs text-muted-foreground">{t('totalTrade')}</p>
        <p className="text-2xl font-bold">{stats.totalTrade}</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-xs text-muted-foreground">{t('completion')}</p>
        <p className="text-2xl font-bold">{t('completionPercent', { percent: stats.completionPercent })}</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="text-xs text-muted-foreground">{t('completion')}</p>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${stats.completionPercent}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {stats.uniqueOwned}/{stats.totalCards}
        </p>
      </div>
    </div>
  );
}

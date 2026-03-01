'use client';

import { cn } from '@/lib/utils';
import type { CardSet } from '@/lib/services/card-service';

interface SetSelectorProps {
  sets: CardSet[];
  activeSet: string;
  onSetChange: (setCode: string) => void;
  ownedCountBySet?: Record<string, number>;
}

const setNames: Record<string, string> = {
  KS: 'Konoha Shidō',
};

export function SetSelector({ sets, activeSet, onSetChange, ownedCountBySet }: SetSelectorProps) {

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory sm:flex-wrap sm:overflow-visible">
      {sets.map((set) => {
        const isActive = set.code === activeSet;
        const owned = ownedCountBySet?.[set.code] ?? 0;
        const percent = set.cardCount > 0 ? Math.round((owned / set.cardCount) * 100) : 0;
        const displayName = setNames[set.code] ?? set.code;

        return (
          <button
            key={set.code}
            onClick={() => onSetChange(set.code)}
            className={cn(
              'flex snap-start flex-col gap-1 rounded-lg border px-3 py-2 text-left transition-all min-w-[140px] sm:min-w-0',
              isActive
                ? 'border-primary bg-primary/10 shadow-sm'
                : 'border-border bg-card hover:border-primary/40'
            )}
          >
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-sm font-semibold',
                isActive ? 'text-primary' : 'text-foreground'
              )}>
                {displayName}
              </span>
              <span className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                {set.code}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {owned}/{set.cardCount}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

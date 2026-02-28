'use client';

import { useTranslations, useLocale } from 'next-intl';
import { RefreshCw, Check, Zap, Shield, Swords, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GameCardInstance } from '@/lib/game/types';
import { cn } from '@/lib/utils';

interface MulliganViewProps {
  hand: GameCardInstance[];
  onKeep: () => void;
  onMulligan: () => void;
  mulliganDone: boolean;
}

export function MulliganView({ hand, onKeep, onMulligan, mulliganDone }: MulliganViewProps) {
  const t = useTranslations('Play');
  const locale = useLocale();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      {/* Title */}
      <h2 className="mb-2 text-xl font-bold sm:text-2xl">{t('game.mulligan')}</h2>
      <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
        {t('game.mulliganDesc')}
      </p>

      {/* Hand Display */}
      <div className="mb-8 flex flex-wrap justify-center gap-2 sm:gap-3">
        {hand.map((inst) => {
          const name = locale === 'fr' ? inst.card.nameFr : inst.card.nameEn;
          const isCharacter = inst.card.type === 'CHARACTER';

          return (
            <div
              key={inst.instanceId}
              className={cn(
                'flex w-[100px] flex-col rounded-lg border border-border bg-card p-2 shadow-sm sm:w-[130px] sm:p-3',
                mulliganDone && 'opacity-60'
              )}
            >
              {/* Type */}
              <div className="mb-1 flex items-center gap-1">
                <Swords className="h-3 w-3 text-muted-foreground" />
                <span className="text-[9px] uppercase text-muted-foreground">
                  {inst.card.type}
                </span>
              </div>

              {/* Name */}
              <p className="mb-2 line-clamp-2 text-[11px] font-medium leading-tight sm:text-xs">
                {name}
              </p>

              {/* Stats */}
              <div className="mt-auto flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  <Zap className="h-3 w-3 text-blue-500" />
                  <span className="text-[10px] font-medium text-blue-500">
                    {inst.card.chakra}
                  </span>
                </div>
                {isCharacter && (
                  <div className="flex items-center gap-0.5">
                    <Shield className="h-3 w-3 text-amber-500" />
                    <span className="text-[10px] font-medium text-amber-500">
                      {inst.card.power}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      {!mulliganDone ? (
        <div className="flex gap-3">
          <Button variant="outline" size="lg" onClick={onMulligan}>
            <RefreshCw className="h-4 w-4" />
            {t('game.newHand')}
          </Button>
          <Button size="lg" onClick={onKeep}>
            <Check className="h-4 w-4" />
            {t('game.keepHand')}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('game.aiThinking')}
        </div>
      )}
    </div>
  );
}

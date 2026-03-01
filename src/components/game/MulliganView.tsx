'use client';

import { useTranslations, useLocale } from 'next-intl';
import { RefreshCw, Check, Zap, Shield, Sword, Scroll, Star, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { GameCardInstance } from '@/lib/game/types';
import { useGameTheme, themeBoardClass } from '@/hooks/useGameTheme';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/storage';

const typeIcons: Record<string, typeof Sword> = {
  CHARACTER: Sword,
  MISSION: Scroll,
  JUTSU: Star,
};

const typeIconColors: Record<string, string> = {
  CHARACTER: 'text-orange-400/60',
  MISSION: 'text-sky-400/60',
  JUTSU: 'text-violet-400/60',
};

const typeBorderColors: Record<string, string> = {
  CHARACTER: 'border-orange-500/20',
  MISSION: 'border-sky-500/20',
  JUTSU: 'border-violet-500/20',
};

interface MulliganViewProps {
  hand: GameCardInstance[];
  onKeep: () => void;
  onMulligan: () => void;
  mulliganDone: boolean;
}

export function MulliganView({ hand, onKeep, onMulligan, mulliganDone }: MulliganViewProps) {
  const t = useTranslations('Play');
  const locale = useLocale();
  const { theme } = useGameTheme();

  return (
    <div className={`${themeBoardClass(theme)} flex min-h-[60vh] flex-col items-center justify-center px-4`}>
      {/* Themed header — Squad Formation */}
      <div className="relative mb-2">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
        <h2 className="text-xl font-bold tracking-wide sm:text-2xl">
          {t('game.squadFormation')}
        </h2>
      </div>
      <p className="mb-6 max-w-md text-center text-sm text-muted-foreground">
        {t('game.mulliganDesc')}
      </p>

      {/* Hand Display — themed cards with images */}
      <div className="mb-8 flex flex-wrap justify-center gap-2 sm:gap-3">
        {hand.map((inst) => {
          const name = locale === 'fr' ? inst.card.nameFr : inst.card.nameEn;
          const displayName = name.split(' \u2014 ')[0];
          const isCharacter = inst.card.type === 'CHARACTER';
          const imageUrl = getImageUrl(inst.card.imageUrl);
          const TypeIcon = typeIcons[inst.card.type] ?? Sword;
          const typeIconColor = typeIconColors[inst.card.type] ?? 'text-orange-400/60';
          const borderColor = typeBorderColors[inst.card.type] ?? 'border-orange-500/20';

          return (
            <div
              key={inst.instanceId}
              className={cn(
                // TCG card ratio 5:7 — 100x140 / 115x161
                'mulligan-card-shimmer relative flex w-[100px] h-[140px] flex-col overflow-hidden rounded-lg border shadow-md transition-transform hover:scale-105 sm:w-[115px] sm:h-[161px]',
                borderColor,
                mulliganDone && 'opacity-60'
              )}
            >
              {/* Accent top edge */}
              <div className="absolute inset-x-0 top-0 z-10 h-px rounded-t-lg bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

              {/* Card image or fallback */}
              {imageUrl ? (
                <>
                  <Image
                    src={imageUrl}
                    alt={name}
                    fill
                    sizes="115px"
                    className="object-cover"
                  />
                  {/* Type badge over image */}
                  <div className="absolute left-1 top-1 z-10 flex items-center gap-0.5 rounded-full bg-black/60 px-1 py-0.5">
                    <TypeIcon className={cn('h-2.5 w-2.5', typeIconColor)} />
                    <span className={cn('text-[8px] font-medium uppercase tracking-wider', typeIconColor)}>
                      {inst.card.type}
                    </span>
                  </div>
                  {/* Bottom overlay with name + stats */}
                  <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-1.5 pb-1.5 pt-6">
                    <p className="truncate text-[10px] font-semibold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:text-[11px]">
                      {displayName}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        <Zap className="h-3 w-3 text-blue-400" />
                        <span className="text-[10px] font-bold text-blue-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                          {inst.card.chakra}
                        </span>
                      </div>
                      {isCharacter && (
                        <div className="flex items-center gap-0.5">
                          <Shield className="h-3 w-3 text-amber-400" />
                          <span className="text-[10px] font-bold text-amber-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                            {inst.card.power}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Fallback card frame — text-based */
                <div className="flex h-full w-full flex-col bg-gradient-to-b from-zinc-900 to-zinc-950 p-2 sm:p-3">
                  <div className="mb-1 flex items-center gap-1">
                    <TypeIcon className={cn('h-3 w-3', typeIconColor)} />
                    <span className={cn('text-[9px] font-medium uppercase tracking-wider', typeIconColor)}>
                      {inst.card.type}
                    </span>
                  </div>
                  <p className="mb-2 line-clamp-3 text-[11px] font-semibold leading-tight text-zinc-100 sm:text-xs">
                    {name}
                  </p>
                  <div className="mt-auto flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      <Zap className="h-3 w-3 text-blue-400" />
                      <span className="text-[10px] font-bold text-blue-400">
                        {inst.card.chakra}
                      </span>
                    </div>
                    {isCharacter && (
                      <div className="flex items-center gap-0.5">
                        <Shield className="h-3 w-3 text-amber-400" />
                        <span className="text-[10px] font-bold text-amber-400">
                          {inst.card.power}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons — Naruto-themed */}
      {!mulliganDone ? (
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={onMulligan}
            className="border-zinc-700 bg-zinc-900/80 text-zinc-200 hover:border-orange-500/40 hover:bg-zinc-800/80 hover:text-orange-300"
          >
            <RefreshCw className="h-4 w-4" />
            {t('game.newHand')}
          </Button>
          <Button
            size="lg"
            onClick={onKeep}
            className="border-orange-500/50 bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.25)] hover:from-orange-500 hover:to-orange-400"
          >
            <Check className="h-4 w-4" />
            {t('game.keepHand')}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-orange-300/70">
          <Loader2 className="h-4 w-4 animate-spin text-orange-400" />
          {t('game.aiThinking')}
        </div>
      )}
    </div>
  );
}

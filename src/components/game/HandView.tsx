'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Zap, Shield } from 'lucide-react';
import Image from 'next/image';
import { GameActionType, type AvailableAction, type GameCardInstance, type GameState } from '@/lib/game/types';
import { getCharacterBaseName, hasCharacterWithName } from '@/lib/game/utils';
import { cn } from '@/lib/utils';

interface HandViewProps {
  hand: GameCardInstance[];
  availableActions: AvailableAction[];
  selectedCardId: string | null;
  onSelectCard: (instanceId: string) => void;
  disabled: boolean;
  gameState: GameState;
}

export function HandView({
  hand,
  availableActions,
  selectedCardId,
  onSelectCard,
  disabled,
  gameState,
}: HandViewProps) {
  const t = useTranslations('Play');
  const locale = useLocale();

  const isPlayable = (instanceId: string): boolean => {
    if (disabled) return false;
    return availableActions.some(
      (a) =>
        a.cardInstanceId === instanceId &&
        (a.type === GameActionType.PLAY_CHARACTER ||
          a.type === GameActionType.PLAY_HIDDEN ||
          a.type === GameActionType.UPGRADE ||
          a.type === GameActionType.PLAY_JUTSU)
    );
  };

  const getUnplayableReason = (inst: GameCardInstance): string | null => {
    if (disabled) return null;
    if (isPlayable(inst.instanceId)) return null;

    const card = inst.card;
    const playerChakra = gameState.player.chakra;

    if (card.chakra > playerChakra && playerChakra < 1) {
      return t('game.reasonNotEnoughChakra', { cost: card.chakra, current: playerChakra });
    }

    if (card.type === 'CHARACTER' && card.chakra > playerChakra) {
      return t('game.reasonNotEnoughChakra', { cost: card.chakra, current: playerChakra });
    }

    if (card.type === 'CHARACTER') {
      const baseName = getCharacterBaseName(card);
      const allMissionsHaveName = gameState.missions
        .filter((m) => m.missionCard && !m.resolved)
        .every((m) => hasCharacterWithName(m, 'player', baseName));
      if (allMissionsHaveName && gameState.missions.some((m) => m.missionCard && !m.resolved)) {
        return t('game.reasonNameAtMission');
      }
    }

    if (card.type === 'CHARACTER') {
      return t('game.reasonNoValidMission');
    }

    return null;
  };

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between px-1">
        <span className="text-xs font-medium text-muted-foreground">
          {t('game.hand')} ({hand.length})
        </span>
      </div>

      <div
        className={cn(
          'flex gap-2 overflow-x-auto pb-2',
          disabled && 'opacity-60'
        )}
      >
        {hand.map((inst) => {
          const playable = isPlayable(inst.instanceId);
          const selected = selectedCardId === inst.instanceId;
          const name = locale === 'fr' ? inst.card.nameFr : inst.card.nameEn;
          const isCharacter = inst.card.type === 'CHARACTER';
          const unplayableReason = getUnplayableReason(inst);
          const imageUrl = inst.card.imageUrl;

          return (
            <button
              key={inst.instanceId}
              type="button"
              onClick={() => {
                if (!disabled && playable) {
                  onSelectCard(inst.instanceId);
                }
              }}
              disabled={disabled || !playable}
              className={cn(
                'relative flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200',
                'w-[100px] sm:w-[115px]',
                'h-[140px] sm:h-[160px]',
                selected && 'border-primary ring-2 ring-primary/40 -translate-y-3 shadow-lg shadow-primary/30 scale-105',
                playable && !selected && 'border-green-500/50 hover:border-green-500 hover:-translate-y-1 cursor-pointer',
                !playable && 'border-border/50 cursor-default grayscale-[40%]',
                disabled && 'pointer-events-none'
              )}
            >
              {/* Card image */}
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={name}
                  fill
                  sizes="115px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted/30 p-2 text-center text-[10px] text-muted-foreground">
                  {name}
                </div>
              )}

              {/* Bottom info overlay */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-1.5 pb-1.5 pt-6">
                {/* Card name */}
                <p className="truncate text-[10px] font-semibold leading-tight text-white sm:text-[11px]">
                  {name.split(' \u2014 ')[0]}
                </p>

                {/* Stats row */}
                <div className="mt-0.5 flex items-center gap-2">
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

                {/* Unplayable reason */}
                {unplayableReason && (
                  <p className="mt-0.5 line-clamp-2 text-[8px] leading-tight text-red-400">
                    {unplayableReason}
                  </p>
                )}
              </div>

              {/* Playable glow indicator */}
              {playable && !selected && (
                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-green-500/30" />
              )}

              {/* Selected indicator */}
              {selected && (
                <div className="absolute inset-0 rounded-xl ring-2 ring-inset ring-primary/50" />
              )}
            </button>
          );
        })}

        {hand.length === 0 && (
          <p className="w-full py-4 text-center text-xs text-muted-foreground">
            &mdash;
          </p>
        )}
      </div>
    </div>
  );
}

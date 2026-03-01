'use client';

import { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Zap, Shield, Sword, Scroll, Star, Info } from 'lucide-react';
import Image from 'next/image';
import { GameActionType, type AvailableAction, type GameCard, type GameCardInstance, type GameState } from '@/lib/game/types';
import { getCharacterBaseName, hasCharacterWithName } from '@/lib/game/utils';
import { parseEffects } from '@/lib/game/effects/parser';
import { EffectTrigger } from '@/lib/game/effects/types';
import { useLongPress } from '@/hooks/useLongPress';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/storage';

interface HandViewProps {
  hand: GameCardInstance[];
  availableActions: AvailableAction[];
  selectedCardId: string | null;
  onSelectCard: (instanceId: string) => void;
  disabled: boolean;
  gameState: GameState;
  onInspectCard?: (card: GameCard) => void;
}

export function HandView({
  hand,
  availableActions,
  selectedCardId,
  onSelectCard,
  disabled,
  gameState,
  onInspectCard,
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
        {hand.map((inst) => (
          <HandCard
            key={inst.instanceId}
            inst={inst}
            playable={isPlayable(inst.instanceId)}
            selected={selectedCardId === inst.instanceId}
            unplayableReason={getUnplayableReason(inst)}
            disabled={disabled}
            onSelect={() => {
              if (!disabled && isPlayable(inst.instanceId)) {
                onSelectCard(inst.instanceId);
              }
            }}
            onInspect={onInspectCard ? () => onInspectCard(inst.card) : undefined}
            locale={locale}
          />
        ))}

        {hand.length === 0 && (
          <p className="w-full py-4 text-center text-xs text-muted-foreground">
            &mdash;
          </p>
        )}
      </div>
    </div>
  );
}

// =============================================
// HandCard Sub-Component (uses useLongPress hook)
// =============================================

const triggerBadgeColors: Record<string, string> = {
  [EffectTrigger.MAIN]: 'bg-orange-500',
  [EffectTrigger.UPGRADE]: 'bg-green-500',
  [EffectTrigger.AMBUSH]: 'bg-red-500',
  [EffectTrigger.SCORE]: 'bg-yellow-500',
};

// Type-specific border colors for card type distinction
const typeBorderColors: Record<string, { active: string; playable: string; default: string }> = {
  CHARACTER: {
    active: 'border-primary ring-2 ring-primary/40',
    playable: 'border-orange-500/50 hover:border-orange-500',
    default: 'border-orange-900/30',
  },
  MISSION: {
    active: 'border-primary ring-2 ring-primary/40',
    playable: 'border-sky-500/50 hover:border-sky-500',
    default: 'border-sky-900/30',
  },
  JUTSU: {
    active: 'border-primary ring-2 ring-primary/40',
    playable: 'border-violet-500/50 hover:border-violet-500',
    default: 'border-violet-900/30',
  },
};

const typeIcons: Record<string, typeof Sword> = {
  CHARACTER: Sword,
  MISSION: Scroll,
  JUTSU: Star,
};

const typeIconColors: Record<string, string> = {
  CHARACTER: 'text-orange-400',
  MISSION: 'text-sky-400',
  JUTSU: 'text-violet-400',
};

interface HandCardProps {
  inst: GameCardInstance;
  playable: boolean;
  selected: boolean;
  unplayableReason: string | null;
  disabled: boolean;
  onSelect: () => void;
  onInspect?: () => void;
  locale: string;
}

function HandCard({
  inst,
  playable,
  selected,
  unplayableReason,
  disabled,
  onSelect,
  onInspect,
  locale,
}: HandCardProps) {
  const name = locale === 'fr' ? inst.card.nameFr : inst.card.nameEn;
  const displayName = name.split(' \u2014 ')[0];
  const isCharacter = inst.card.type === 'CHARACTER';
  const imageUrl = getImageUrl(inst.card.imageUrl);
  const cardType = inst.card.type;
  const borders = typeBorderColors[cardType] ?? typeBorderColors.CHARACTER;
  const TypeIcon = typeIcons[cardType] ?? Sword;
  const typeIconColor = typeIconColors[cardType] ?? 'text-orange-400';
  const hasEffect = !!inst.card.effectEn;

  const triggerBadges = useMemo(() => {
    const effects = parseEffects(inst.card.effectEn);
    const triggers = new Set(effects.map((e) => e.trigger));
    return Array.from(triggers);
  }, [inst.card.effectEn]);

  const { handlers: longPressHandlers, isPressing } = useLongPress({
    onLongPress: () => onInspect?.(),
    onShortPress: playable && !disabled ? onSelect : undefined,
  });

  return (
    <div
      {...longPressHandlers}
      role="button"
      tabIndex={0}
      className={cn(
        'relative flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200',
        // TCG card ratio 5:7 — 72x100 / 82x115
        'w-[72px] h-[100px] sm:w-[82px] sm:h-[115px]',
        selected && cn(borders.active, '-translate-y-3 shadow-lg shadow-primary/30 scale-105'),
        playable && !selected && cn(borders.playable, 'hover:-translate-y-1 cursor-pointer'),
        !playable && cn(borders.default, 'cursor-default grayscale-[40%]'),
        disabled && 'pointer-events-none',
        isPressing && !selected && 'scale-[0.96] opacity-85 transition-transform duration-150'
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
        /* Fallback card frame — shows card info when no image */
        <div className="flex h-full w-full flex-col bg-gradient-to-b from-zinc-900 to-zinc-950 p-1.5">
          {/* Type indicator */}
          <div className="mb-1 flex items-center gap-0.5">
            <TypeIcon className={cn('h-2.5 w-2.5', typeIconColor)} />
            <span className={cn('text-[8px] font-medium uppercase tracking-wider', typeIconColor)}>
              {cardType}
            </span>
          </div>
          {/* Name */}
          <p className="mb-1 line-clamp-3 text-[10px] font-semibold leading-tight text-zinc-100 sm:text-[11px]">
            {name}
          </p>
          {/* Stats at bottom */}
          <div className="mt-auto flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              <Zap className="h-3 w-3 text-blue-400" />
              <span className="text-[10px] font-bold text-blue-400">{inst.card.chakra}</span>
            </div>
            {isCharacter && (
              <div className="flex items-center gap-0.5">
                <Shield className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400">{inst.card.power}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Type icon badge (top-left) — only when image is present */}
      {imageUrl && (
        <div className={cn(
          'absolute left-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60',
        )}>
          <TypeIcon className={cn('h-2.5 w-2.5', typeIconColor)} />
        </div>
      )}

      {/* Effect trigger badges */}
      {triggerBadges.length > 0 && (
        <div className="absolute right-0.5 top-0.5 flex flex-col gap-0.5">
          {triggerBadges.map((trigger) => (
            <div
              key={trigger}
              className={cn(
                'h-2 w-2 rounded-full shadow',
                triggerBadgeColors[trigger] ?? 'bg-gray-500'
              )}
              title={trigger}
            />
          ))}
        </div>
      )}

      {/* Info hint for inspectable cards with no trigger badges */}
      {onInspect && hasEffect && triggerBadges.length === 0 && (
        <div className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-black/40">
          <Info className="h-2.5 w-2.5 text-white/50" />
        </div>
      )}

      {/* Bottom info overlay — only when image is present */}
      {imageUrl && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-1.5 pb-1.5 pt-6">
          {/* Card name */}
          <p className="truncate text-[10px] font-semibold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:text-[11px]">
            {displayName}
          </p>

          {/* Effect preview */}
          {(() => {
            const effectText = locale === 'fr' ? inst.card.effectFr : inst.card.effectEn;
            if (!effectText) return null;
            const firstLine = effectText.split('\n')[0];
            const cleaned = firstLine.replace(/^(MAIN|UPGRADE|AMBUSH|SCORE)\s*[⚡✖]\s*/, '');
            return (
              <p className="line-clamp-1 text-[7px] leading-tight text-white/60 sm:text-[8px]">
                {cleaned}
              </p>
            );
          })()}

          {/* Stats row */}
          <div className="mt-0.5 flex items-center gap-2">
            <div className="flex items-center gap-0.5">
              <Zap className="h-3 w-3 text-blue-400 drop-shadow-[0_0_2px_rgba(59,130,246,0.5)]" />
              <span className="text-[10px] font-bold text-blue-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                {inst.card.chakra}
              </span>
            </div>
            {isCharacter && (
              <div className="flex items-center gap-0.5">
                <Shield className="h-3 w-3 text-amber-400 drop-shadow-[0_0_2px_rgba(245,158,11,0.5)]" />
                <span className="text-[10px] font-bold text-amber-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
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
      )}

      {/* Playable glow indicator */}
      {playable && !selected && (
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-green-500/30" />
      )}

      {/* Selected indicator */}
      {selected && (
        <div className="absolute inset-0 rounded-xl ring-2 ring-inset ring-primary/50" />
      )}
    </div>
  );
}

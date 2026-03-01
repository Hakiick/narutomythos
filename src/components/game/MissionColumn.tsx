'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Lock, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CharacterSlot } from './CharacterSlot';
import { rankLabels, rankPoints, rankTheme } from './mission-constants';
import { calculateMissionPower } from '@/lib/game/utils';
import { useGameTheme, themeLaneClass } from '@/hooks/useGameTheme';
import type { MissionSlot, DeployedCharacter, GameCard } from '@/lib/game/types';
import { useLongPress } from '@/hooks/useLongPress';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { getImageUrl } from '@/lib/storage';

interface MissionColumnProps {
  mission: MissionSlot;
  missionIndex: number;
  isActive: boolean;
  isLocked: boolean;
  isHighlighted: boolean;
  onMissionClick: (index: number) => void;
  onInspectCharacter?: (character: DeployedCharacter) => void;
  onInspectMission?: (card: GameCard) => void;
  onRevealCharacter?: (character: DeployedCharacter, missionIndex: number) => void;
  revealableInstanceIds?: Set<string>;
}

export function MissionColumn({
  mission,
  missionIndex,
  isActive,
  isLocked,
  isHighlighted,
  onMissionClick,
  onInspectCharacter,
  onInspectMission,
  onRevealCharacter,
  revealableInstanceIds,
}: MissionColumnProps) {
  const t = useTranslations('Play');
  const locale = useLocale();
  const { theme: gameTheme } = useGameTheme();

  const playerPower = calculateMissionPower(mission.playerCharacters, mission.missionCard);
  const opponentPower = calculateMissionPower(mission.opponentCharacters, mission.missionCard);
  const labelKey = rankLabels[mission.rank] as 'missionD' | 'missionC' | 'missionB' | 'missionA';
  const points = rankPoints[mission.rank] ?? 1;
  const theme = rankTheme[mission.rank] ?? rankTheme.D;

  const missionName = mission.missionCard
    ? (locale === 'fr' ? mission.missionCard.nameFr : mission.missionCard.nameEn)
    : null;

  const { handlers: missionLongPressHandlers, isPressing: isMissionPressing } = useLongPress({
    onLongPress: () => {
      if (mission.missionCard && onInspectMission) {
        onInspectMission(mission.missionCard);
      }
    },
    onShortPress: isHighlighted ? () => onMissionClick(missionIndex) : undefined,
  });

  if (isLocked) {
    return (
      <div className={cn(
        'flex flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/10 p-2',
        theme.lockedBorder
      )}>
        <Lock className="mb-1 h-4 w-4 text-muted-foreground/50" />
        <span className="text-[10px] text-muted-foreground/50">
          {t(`game.${labelKey}`)}
        </span>
        <span className="text-[9px] text-muted-foreground/30">
          {t('game.locked')}
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onMissionClick(missionIndex)}
      className={cn(
        'flex flex-1 flex-col rounded-lg border-2 transition-all',
        // Highlighted state
        isHighlighted && 'border-primary bg-primary/5 ring-2 ring-primary/30 animate-column-highlight cursor-pointer',
        // Active rank
        isActive && !isHighlighted && [
          theme.activeBorder,
          theme.activeBg,
          'ring-1',
          theme.activeRing,
          theme.activeGlow,
          themeLaneClass(gameTheme, true),
        ],
        // Resolved
        mission.resolved && 'opacity-60',
        // Idle
        !isHighlighted && !isActive && !mission.resolved && [
          theme.border,
          theme.bg,
        ],
        !isHighlighted && 'cursor-default'
      )}
      disabled={!isHighlighted}
    >
      {/* Opponent power badge */}
      <div className="flex items-center justify-center py-0.5">
        <div className="flex items-center gap-0.5 rounded-full bg-red-500/10 px-1.5 py-0">
          <Shield className="h-2.5 w-2.5 text-red-400" />
          <span className="text-[9px] font-bold text-red-400">{opponentPower}</span>
        </div>
      </div>

      {/* Opponent characters — 3 per row */}
      <div className="px-1">
        {mission.opponentCharacters.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-0.5">
            {mission.opponentCharacters.map((char) => (
              <CharacterSlot
                key={char.instanceId}
                character={char}
                isOwn={false}
                isSelectable={false}
                onInspect={onInspectCharacter ? () => onInspectCharacter(char) : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="h-4" />
        )}
      </div>

      {/* Mission card — center (compact), long-press to inspect */}
      <div
        {...(mission.missionCard ? missionLongPressHandlers : {})}
        role={mission.missionCard ? 'button' : undefined}
        tabIndex={mission.missionCard ? 0 : undefined}
        className={cn(
          'mx-1 my-1',
          mission.missionCard && onInspectMission && 'cursor-pointer',
          isMissionPressing && 'scale-[0.97] opacity-85 transition-transform duration-150'
        )}
        onClick={(e) => { if (mission.missionCard) e.stopPropagation(); }}
      >
        <div className={cn(
          'relative overflow-hidden rounded-md border',
          isActive ? cn(theme.badgeBorder, 'bg-gradient-to-b from-black/60 to-black/80') : 'border-border/30 bg-black/40',
          'h-[48px] sm:h-[56px]'
        )}>
          {/* Mission image if available */}
          {mission.missionCard?.imageUrl && (
            <Image
              src={getImageUrl(mission.missionCard.imageUrl) ?? ''}
              alt={missionName ?? ''}
              fill
              sizes="120px"
              className="object-cover opacity-40"
            />
          )}
          {/* Rank badge top-left */}
          <Badge
            variant="outline"
            className={cn(
              'absolute left-1 top-1 text-[8px] px-1 py-0 border',
              theme.badgeBorder, theme.badgeText
            )}
          >
            {mission.rank}
          </Badge>
          {/* Points badge top-right */}
          <span className={cn(
            'absolute right-1 top-1 text-[9px] font-bold',
            theme.badgeText
          )}>
            {points} {t('game.missionPts')}
          </span>
          {/* Mission name */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-1 pb-0.5 pt-2">
            <p className="truncate text-center text-[8px] font-medium text-white/80">
              {missionName ?? t(`game.${labelKey}`)}
            </p>
          </div>
          {/* Winner overlay */}
          {mission.resolved && mission.winner && (
            <div className={cn(
              'absolute inset-0 flex items-center justify-center',
              mission.winner === 'player' ? 'bg-green-500/20' : 'bg-red-500/20'
            )}>
              <span className={cn(
                'text-xs font-bold',
                mission.winner === 'player' ? 'text-green-400' : 'text-red-400'
              )}>
                {mission.winner === 'player' ? t('game.player') : t('game.opponent')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Player characters — 3 per row */}
      <div className="px-1">
        {mission.playerCharacters.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-0.5">
            {mission.playerCharacters.map((char) => {
              const canReveal = char.hidden && revealableInstanceIds?.has(char.instanceId);
              return (
                <CharacterSlot
                  key={char.instanceId}
                  character={char}
                  isOwn={true}
                  isSelectable={!!canReveal}
                  onClick={canReveal && onRevealCharacter
                    ? () => onRevealCharacter(char, missionIndex)
                    : undefined}
                  onInspect={onInspectCharacter ? () => onInspectCharacter(char) : undefined}
                />
              );
            })}
          </div>
        ) : (
          <div className="h-4" />
        )}
      </div>

      {/* Player power badge */}
      <div className="flex items-center justify-center py-0.5">
        <div className="flex items-center gap-0.5 rounded-full bg-orange-500/10 px-1.5 py-0">
          <Shield className="h-2.5 w-2.5 text-orange-400" />
          <span className="text-[9px] font-bold text-orange-400">{playerPower}</span>
        </div>
      </div>
    </button>
  );
}

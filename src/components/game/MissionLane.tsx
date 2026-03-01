'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Star, Lock, Trophy, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CharacterSlot } from './CharacterSlot';
import { calculateMissionPower } from '@/lib/game/utils';
import { useGameTheme, themeLaneClass } from '@/hooks/useGameTheme';
import type { MissionSlot } from '@/lib/game/types';
import { cn } from '@/lib/utils';

interface MissionLaneProps {
  mission: MissionSlot;
  missionIndex: number;
  isActive: boolean;
  isLocked: boolean;
  isHighlighted: boolean;
  onMissionClick: (index: number) => void;
  onInspectCharacter?: (character: import('@/lib/game/types').DeployedCharacter) => void;
}

const rankLabels: Record<string, string> = {
  D: 'missionD',
  C: 'missionC',
  B: 'missionB',
  A: 'missionA',
};

const rankPoints: Record<string, number> = {
  D: 1,
  C: 2,
  B: 3,
  A: 4,
};

/** Rank-specific color config for mission lanes */
const rankTheme: Record<string, {
  border: string;
  bg: string;
  activeBorder: string;
  activeBg: string;
  activeRing: string;
  activeGlow: string;
  starFill: string;
  starText: string;
  badgeBorder: string;
  badgeText: string;
  lockedBorder: string;
}> = {
  D: {
    border: 'border-slate-700/50',
    bg: 'bg-slate-900/20',
    activeBorder: 'border-slate-500/60',
    activeBg: 'bg-slate-800/15',
    activeRing: 'ring-slate-500/25',
    activeGlow: 'rank-d-glow',
    starFill: 'fill-slate-400',
    starText: 'text-slate-400',
    badgeBorder: 'border-slate-600/50',
    badgeText: 'text-slate-400',
    lockedBorder: 'border-slate-700/30',
  },
  C: {
    border: 'border-amber-800/40',
    bg: 'bg-amber-950/15',
    activeBorder: 'border-amber-600/60',
    activeBg: 'bg-amber-900/15',
    activeRing: 'ring-amber-600/25',
    activeGlow: 'rank-c-glow',
    starFill: 'fill-amber-500',
    starText: 'text-amber-500',
    badgeBorder: 'border-amber-700/50',
    badgeText: 'text-amber-400',
    lockedBorder: 'border-amber-800/30',
  },
  B: {
    border: 'border-slate-500/40',
    bg: 'bg-slate-800/15',
    activeBorder: 'border-slate-400/60',
    activeBg: 'bg-slate-700/15',
    activeRing: 'ring-slate-400/25',
    activeGlow: 'rank-b-glow',
    starFill: 'fill-slate-300',
    starText: 'text-slate-300',
    badgeBorder: 'border-slate-500/50',
    badgeText: 'text-slate-300',
    lockedBorder: 'border-slate-500/30',
  },
  A: {
    border: 'border-yellow-700/40',
    bg: 'bg-yellow-950/15',
    activeBorder: 'border-yellow-500/60',
    activeBg: 'bg-yellow-900/15',
    activeRing: 'ring-yellow-500/30',
    activeGlow: 'rank-a-glow',
    starFill: 'fill-yellow-400',
    starText: 'text-yellow-400',
    badgeBorder: 'border-yellow-600/50',
    badgeText: 'text-yellow-400',
    lockedBorder: 'border-yellow-700/30',
  },
};

export function MissionLane({
  mission,
  missionIndex,
  isActive,
  isLocked,
  isHighlighted,
  onMissionClick,
  onInspectCharacter,
}: MissionLaneProps) {
  const t = useTranslations('Play');
  const locale = useLocale();
  const { theme: gameTheme } = useGameTheme();

  const playerPower = calculateMissionPower(mission.playerCharacters, mission.missionCard);
  const opponentPower = calculateMissionPower(mission.opponentCharacters, mission.missionCard);
  const labelKey = rankLabels[mission.rank] as 'missionD' | 'missionC' | 'missionB' | 'missionA';
  const points = rankPoints[mission.rank] ?? 1;
  const theme = rankTheme[mission.rank] ?? rankTheme.D;

  const totalPower = playerPower + opponentPower;
  const playerPercent = totalPower > 0 ? (playerPower / totalPower) * 100 : 50;
  const opponentPercent = totalPower > 0 ? (opponentPower / totalPower) * 100 : 50;

  const powerComparison = playerPower > opponentPower
    ? 'winning'
    : playerPower < opponentPower
      ? 'losing'
      : 'tied';

  if (isLocked) {
    return (
      <div className={cn(
        'flex items-center justify-center rounded-lg border border-dashed bg-muted/20 px-3 py-1',
        theme.lockedBorder
      )}>
        <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {t(`game.${labelKey}`)} &mdash; {t('game.locked')}
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onMissionClick(missionIndex)}
      className={cn(
        'w-full rounded-lg border px-2 py-1 text-left transition-all sm:px-3',
        // Highlighted state (card selected, valid mission target) — overrides everything
        isHighlighted && 'border-primary bg-primary/5 ring-2 ring-primary/30',
        // Active rank (current round mission) with rank-specific glow + theme glow
        isActive && !isHighlighted && [
          theme.activeBorder,
          theme.activeBg,
          'ring-1',
          theme.activeRing,
          theme.activeGlow,
          themeLaneClass(gameTheme, true),
        ],
        // Resolved missions — slight fade
        mission.resolved && 'opacity-70',
        // Idle state — rank-tinted border and bg
        !isHighlighted && !isActive && !mission.resolved && [
          theme.border,
          theme.bg,
        ],
        isHighlighted && 'cursor-pointer hover:bg-primary/10',
        !isHighlighted && 'cursor-default'
      )}
      disabled={!isHighlighted}
    >
      {/* Mission Header */}
      <div className="mb-1 flex items-center justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {isActive && (
            <Star className={cn('h-3.5 w-3.5 flex-shrink-0', theme.starFill, theme.starText)} />
          )}
          <Badge
            variant="outline"
            className={cn(
              'flex-shrink-0 text-[10px]',
              isActive
                ? cn(theme.badgeBorder, theme.badgeText)
                : cn(theme.badgeBorder, theme.badgeText, 'opacity-70')
            )}
          >
            {t(`game.${labelKey}`)}
          </Badge>
          {mission.missionCard && (
            <>
              <span className="truncate text-[10px] font-medium text-foreground/80">
                {locale === 'fr' ? mission.missionCard.nameFr : mission.missionCard.nameEn}
              </span>
              {(() => {
                const effectText = locale === 'fr' ? mission.missionCard.effectFr : mission.missionCard.effectEn;
                if (!effectText) return null;
                return (
                  <span className="hidden truncate text-[9px] text-muted-foreground sm:inline">
                    &mdash; {effectText.split('\n')[0]}
                  </span>
                );
              })()}
            </>
          )}
          {!mission.missionCard && (
            <span className="text-[10px] text-muted-foreground">
              ({points} {t('game.missionPoints').toLowerCase()})
            </span>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-1.5">
          {/* Points badge */}
          {mission.missionCard && (
            <span className={cn('text-[10px] font-semibold', theme.badgeText)}>
              {points} {t('game.missionPts')}
            </span>
          )}

          {/* Winner indicator */}
          {mission.resolved && mission.winner && (
            <div className="flex items-center gap-1 animate-power-pop">
              <Trophy className="h-3 w-3 text-yellow-500" />
              <span className="text-[10px] font-medium text-yellow-500">
                {mission.winner === 'player'
                  ? t('game.player')
                  : mission.winner === 'opponent'
                    ? t('game.opponent')
                    : null}
              </span>
            </div>
          )}
          {mission.resolved && !mission.winner && (
            <div className="flex items-center gap-1">
              <Minus className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Characters + Power */}
      <div className="flex items-center gap-2">
        {/* Opponent Characters */}
        <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
          <div className="flex flex-wrap gap-1">
            {mission.opponentCharacters.length > 0 ? (
              mission.opponentCharacters.map((char) => (
                <CharacterSlot
                  key={char.instanceId}
                  character={char}
                  isOwn={false}
                  isSelectable={false}
                  onInspect={onInspectCharacter ? () => onInspectCharacter(char) : undefined}
                />
              ))
            ) : (
              <span className="text-[10px] text-muted-foreground">&mdash;</span>
            )}
          </div>
        </div>

        {/* VS divider */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-muted-foreground">{t('game.vs')}</span>
        </div>

        {/* Player Characters */}
        <div className="flex min-w-0 flex-1 flex-col items-end gap-1">
          <div className="flex flex-wrap justify-end gap-1">
            {mission.playerCharacters.length > 0 ? (
              mission.playerCharacters.map((char) => (
                <CharacterSlot
                  key={char.instanceId}
                  character={char}
                  isOwn={true}
                  isSelectable={false}
                  onInspect={onInspectCharacter ? () => onInspectCharacter(char) : undefined}
                />
              ))
            ) : (
              <span className="text-[10px] text-muted-foreground">&mdash;</span>
            )}
          </div>
        </div>
      </div>

      {/* Power comparison bar */}
      {(mission.playerCharacters.length > 0 || mission.opponentCharacters.length > 0) && (
        <div className="mt-1.5">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted/40">
            <div
              className="h-full bg-red-500/70 transition-all duration-500"
              style={{ width: `${opponentPercent}%` }}
            />
            <div
              className="h-full bg-orange-500/70 transition-all duration-500"
              style={{ width: `${playerPercent}%` }}
            />
          </div>
          <div className="mt-0.5 flex items-center justify-between">
            <span className="text-[9px] font-medium text-red-400">
              {t('game.opponent')}: {opponentPower}
            </span>
            {!mission.resolved && totalPower > 0 && (
              <span className={cn(
                'text-[9px] font-medium',
                powerComparison === 'winning' && 'text-green-400',
                powerComparison === 'losing' && 'text-red-400',
                powerComparison === 'tied' && 'text-muted-foreground'
              )}>
                {powerComparison === 'winning' && t('game.youreWinning')}
                {powerComparison === 'losing' && t('game.aiWinning')}
                {powerComparison === 'tied' && t('game.tied')}
              </span>
            )}
            <span className="text-[9px] font-medium text-orange-400">
              {t('game.player')}: {playerPower}
            </span>
          </div>
        </div>
      )}
    </button>
  );
}

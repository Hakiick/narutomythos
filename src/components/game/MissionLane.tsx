'use client';

import { useTranslations } from 'next-intl';
import { Star, Lock, Trophy, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CharacterSlot } from './CharacterSlot';
import { calculateMissionPower } from '@/lib/game/utils';
import type { MissionSlot } from '@/lib/game/types';
import { cn } from '@/lib/utils';

interface MissionLaneProps {
  mission: MissionSlot;
  missionIndex: number;
  isActive: boolean;
  isLocked: boolean;
  isHighlighted: boolean;
  onMissionClick: (index: number) => void;
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

export function MissionLane({
  mission,
  missionIndex,
  isActive,
  isLocked,
  isHighlighted,
  onMissionClick,
}: MissionLaneProps) {
  const t = useTranslations('Play');

  const playerPower = calculateMissionPower(mission.playerCharacters, mission.missionCard);
  const opponentPower = calculateMissionPower(mission.opponentCharacters, mission.missionCard);
  const labelKey = rankLabels[mission.rank] as 'missionD' | 'missionC' | 'missionB' | 'missionA';
  const points = rankPoints[mission.rank] ?? 1;

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
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2">
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
        'w-full rounded-lg border px-2 py-2 text-left transition-all sm:px-3',
        isHighlighted && 'border-primary bg-primary/5 ring-2 ring-primary/30',
        isActive && !isHighlighted && 'border-amber-500/50 bg-amber-500/5 ring-1 ring-amber-500/20 shadow-sm shadow-amber-500/10',
        mission.resolved && 'opacity-70',
        !isHighlighted && !isActive && !mission.resolved && 'border-border bg-background',
        isHighlighted && 'cursor-pointer hover:bg-primary/10',
        !isHighlighted && 'cursor-default'
      )}
      disabled={!isHighlighted}
    >
      {/* Mission Header */}
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isActive && (
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          )}
          <Badge
            variant="outline"
            className={cn(
              'text-[10px]',
              isActive && 'border-amber-500/50 text-amber-500'
            )}
          >
            {t(`game.${labelKey}`)}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            ({points} {t('game.missionPoints').toLowerCase()})
          </span>
        </div>

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
              className="h-full bg-blue-500/70 transition-all duration-500"
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
            <span className="text-[9px] font-medium text-blue-400">
              {t('game.player')}: {playerPower}
            </span>
          </div>
        </div>
      )}
    </button>
  );
}

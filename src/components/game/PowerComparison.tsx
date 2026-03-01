'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { type MissionSlot, MissionRank } from '@/lib/game/types';
import { calculateMissionPower, getMissionCharacters } from '@/lib/game/utils';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ScoreAnimation } from './ScoreAnimation';

interface PowerComparisonProps {
  mission: MissionSlot;
  playerHasEdge: boolean;
  animate?: boolean;
}

const missionRankConfig: Record<MissionRank, {
  color: string;
  gradient: string;
  glowColor: string;
  points: number;
  label: string;
}> = {
  [MissionRank.D]: {
    color: 'bg-gray-500',
    gradient: 'from-gray-600 to-gray-500',
    glowColor: 'rgba(107, 114, 128, 0.3)',
    points: 1,
    label: 'game.missionD',
  },
  [MissionRank.C]: {
    color: 'bg-blue-500',
    gradient: 'from-blue-600 to-blue-400',
    glowColor: 'rgba(59, 130, 246, 0.3)',
    points: 2,
    label: 'game.missionC',
  },
  [MissionRank.B]: {
    color: 'bg-purple-500',
    gradient: 'from-purple-600 to-purple-400',
    glowColor: 'rgba(147, 51, 234, 0.3)',
    points: 3,
    label: 'game.missionB',
  },
  [MissionRank.A]: {
    color: 'bg-amber-500',
    gradient: 'from-amber-600 to-amber-400',
    glowColor: 'rgba(245, 158, 11, 0.3)',
    points: 4,
    label: 'game.missionA',
  },
};

function useCountUp(targetValue: number, animate: boolean, duration = 800): number {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : targetValue);

  useEffect(() => {
    if (!animate) {
      setDisplayValue(targetValue);
      return;
    }

    setDisplayValue(0);
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setDisplayValue(Math.round(progress * targetValue));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    const animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [targetValue, animate, duration]);

  return displayValue;
}

export function PowerComparison({ mission, playerHasEdge, animate = true }: PowerComparisonProps) {
  const t = useTranslations('Play');
  const locale = useLocale();
  const config = missionRankConfig[mission.rank];

  const playerChars = getMissionCharacters(mission, 'player');
  const opponentChars = getMissionCharacters(mission, 'opponent');

  // Use evaluation-time snapshot if available, otherwise recalculate
  const playerPower = mission.playerPowerAtEval ?? calculateMissionPower(playerChars);
  const opponentPower = mission.opponentPowerAtEval ?? calculateMissionPower(opponentChars);

  const displayPlayerPower = useCountUp(playerPower, animate);
  const displayOpponentPower = useCountUp(opponentPower, animate);

  const [showResult, setShowResult] = useState(!animate);

  useEffect(() => {
    if (!animate) {
      setShowResult(true);
      return;
    }
    const timer = setTimeout(() => setShowResult(true), 850);
    return () => clearTimeout(timer);
  }, [animate]);

  const getCharacterName = useCallback(
    (card: { nameEn: string; nameFr: string | null }): string => {
      const fullName = (locale === 'fr' ? card.nameFr : card.nameEn) || card.nameEn;
      // Extract main name (before " — " subtitle)
      return fullName.includes(' — ') ? fullName.split(' — ')[0] : fullName;
    },
    [locale]
  );

  const playerWins = mission.winner === 'player';
  const opponentWins = mission.winner === 'opponent';
  const isDraw = mission.winner === 'tie';

  const totalPower = playerPower + opponentPower;
  const playerPercent = totalPower > 0 ? (playerPower / totalPower) * 100 : 50;

  return (
    <div
      className="w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden"
      style={
        mission.winner !== null && showResult
          ? {
              boxShadow: playerWins
                ? '0 0 20px 4px rgba(249, 115, 22, 0.2), 0 0 8px 2px rgba(251, 191, 36, 0.15)'
                : opponentWins
                  ? '0 0 20px 4px rgba(239, 68, 68, 0.2)'
                  : undefined,
            }
          : undefined
      }
    >
      {/* Mission rank header with gradient */}
      <div className={cn(
        'flex items-center justify-center gap-2 border-b border-border p-3 bg-gradient-to-r',
        config.gradient
      )}>
        <Badge className="border-transparent bg-black/30 text-white backdrop-blur-sm">
          {t(config.label)}
        </Badge>
        <span className="text-xs font-medium text-white/80">
          ({config.points} {t('game.missionPoints').toLowerCase()})
        </span>
      </div>

      {/* Player side — orange theme */}
      <div className={cn(
        'border-b border-border p-4 transition-colors',
        showResult && playerWins && 'bg-orange-500/5'
      )}>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-orange-400">
          <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
          {t('game.player')}
        </p>
        <div className="space-y-1">
          {playerChars.length === 0 ? (
            <p className="text-sm text-muted-foreground">-</p>
          ) : (
            playerChars.map((char) => (
              <div key={char.instanceId} className="flex items-center justify-between text-sm">
                <span className={cn(char.hidden && 'italic text-muted-foreground')}>
                  {char.hidden
                    ? 'Hidden'
                    : getCharacterName(char.card)}
                </span>
                <span className="font-mono font-medium text-orange-300">
                  {char.hidden
                    ? '(0)'
                    : char.powerTokens > 0
                      ? `(${char.card.power ?? 0}+${char.powerTokens})`
                      : `(${char.card.power ?? 0})`}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-orange-500/20 pt-2">
          <span className="text-xs font-medium text-muted-foreground">
            {t('game.power')}
          </span>
          <span className={cn(
            'text-xl font-black tabular-nums',
            showResult && playerWins && 'text-orange-400 animate-power-pop'
          )}>
            {displayPlayerPower}
          </span>
        </div>
      </div>

      {/* VS divider — chakra-style bar */}
      <div className="relative flex items-center justify-center py-2">
        {/* Power ratio bar */}
        <div className="absolute inset-x-4 h-1 overflow-hidden rounded-full bg-muted/40">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-700"
            style={{ width: `${playerPercent}%` }}
          />
        </div>
        <span className="relative z-10 rounded-full bg-card px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
          {t('game.vs')}
        </span>
      </div>

      {/* Opponent side — red theme */}
      <div className={cn(
        'border-b border-border p-4 transition-colors',
        showResult && opponentWins && 'bg-red-500/5'
      )}>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-red-400">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
          {t('game.opponent')}
        </p>
        <div className="space-y-1">
          {opponentChars.length === 0 ? (
            <p className="text-sm text-muted-foreground">-</p>
          ) : (
            opponentChars.map((char) => (
              <div key={char.instanceId} className="flex items-center justify-between text-sm">
                <span className={cn(char.hidden && 'italic text-muted-foreground')}>
                  {char.hidden
                    ? 'Hidden'
                    : getCharacterName(char.card)}
                </span>
                <span className="font-mono font-medium text-red-300">
                  {char.hidden
                    ? '(0)'
                    : char.powerTokens > 0
                      ? `(${char.card.power ?? 0}+${char.powerTokens})`
                      : `(${char.card.power ?? 0})`}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-red-500/20 pt-2">
          <span className="text-xs font-medium text-muted-foreground">
            {t('game.power')}
          </span>
          <span className={cn(
            'text-xl font-black tabular-nums',
            showResult && opponentWins && 'text-red-400 animate-power-pop'
          )}>
            {displayOpponentPower}
          </span>
        </div>
      </div>

      {/* Result banner */}
      {showResult && mission.winner !== null && (
        <div className={cn(
          'flex flex-col items-center gap-2 rounded-b-xl border-t p-4',
          playerWins && 'border-orange-500/30 bg-gradient-to-b from-orange-500/10 to-amber-500/5',
          opponentWins && 'border-red-500/30 bg-gradient-to-b from-red-500/10 to-red-900/5',
          isDraw && 'border-muted bg-muted/30'
        )}>
          <p className={cn(
            'text-base font-black uppercase tracking-wider',
            playerWins && 'text-orange-400',
            opponentWins && 'text-red-400',
            isDraw && 'text-muted-foreground'
          )}>
            {playerWins
              ? t('game.victory')
              : opponentWins
                ? t('game.defeat')
                : t('game.draw')}
          </p>
          {isDraw && playerHasEdge && (
            <p className="text-xs text-muted-foreground">
              {t('game.edge')}
            </p>
          )}
          {!isDraw && (
            <ScoreAnimation
              points={config.points}
              winner={mission.winner as 'player' | 'opponent'}
              missionRank={mission.rank}
            />
          )}
        </div>
      )}
    </div>
  );
}

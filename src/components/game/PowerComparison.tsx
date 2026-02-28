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

const missionRankConfig: Record<MissionRank, { color: string; points: number; label: string }> = {
  [MissionRank.D]: { color: 'bg-gray-500', points: 1, label: 'game.missionD' },
  [MissionRank.C]: { color: 'bg-blue-500', points: 2, label: 'game.missionC' },
  [MissionRank.B]: { color: 'bg-purple-500', points: 3, label: 'game.missionB' },
  [MissionRank.A]: { color: 'bg-amber-500', points: 4, label: 'game.missionA' },
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

  const playerPower = calculateMissionPower(playerChars);
  const opponentPower = calculateMissionPower(opponentChars);

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

  const winnerBg =
    mission.winner === 'player'
      ? 'border-green-500/30 bg-green-500/10'
      : mission.winner === 'opponent'
        ? 'border-red-500/30 bg-red-500/10'
        : 'border-muted bg-muted/50';

  const winnerText =
    mission.winner === 'player'
      ? 'text-green-500'
      : mission.winner === 'opponent'
        ? 'text-red-500'
        : 'text-muted-foreground';

  return (
    <div className="w-full rounded-xl border border-border bg-card shadow-lg">
      {/* Mission rank header */}
      <div className="flex items-center justify-center gap-2 border-b border-border p-3">
        <Badge className={cn('border-transparent text-white', config.color)}>
          {t(config.label)}
        </Badge>
      </div>

      {/* Player side */}
      <div className="border-b border-border p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                <span className="font-mono font-medium">
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
        <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
          <span className="text-xs font-medium text-muted-foreground">
            {t('game.power')}
          </span>
          <span className="text-lg font-bold">{displayPlayerPower}</span>
        </div>
      </div>

      {/* VS divider */}
      <div className="flex items-center justify-center py-1">
        <span className="text-xs font-bold uppercase text-muted-foreground">
          {t('game.vs')}
        </span>
      </div>

      {/* Opponent side */}
      <div className="border-b border-border p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
                <span className="font-mono font-medium">
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
        <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
          <span className="text-xs font-medium text-muted-foreground">
            {t('game.power')}
          </span>
          <span className="text-lg font-bold">{displayOpponentPower}</span>
        </div>
      </div>

      {/* Result banner */}
      {showResult && mission.winner !== null && (
        <div className={cn('flex flex-col items-center gap-1 rounded-b-xl border-t p-4', winnerBg)}>
          <p className={cn('text-sm font-bold', winnerText)}>
            {mission.winner === 'player'
              ? t('game.victory')
              : mission.winner === 'opponent'
                ? t('game.defeat')
                : t('game.draw')}
          </p>
          {mission.winner === 'tie' && playerHasEdge && (
            <p className="text-xs text-muted-foreground">
              {t('game.edge')}
            </p>
          )}
          {mission.winner !== 'tie' && (
            <ScoreAnimation
              points={config.points}
              winner={mission.winner}
              missionRank={mission.rank}
            />
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  type GameState,
  type MissionSlot,
  MissionRank,
  GameActionType,
} from '@/lib/game/types';
import { calculateMissionPower, getMissionCharacters } from '@/lib/game/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface GameSummaryProps {
  gameState: GameState;
}

const missionRankConfig: Record<MissionRank, { color: string; borderColor: string; label: string }> = {
  [MissionRank.D]: { color: 'text-slate-400', borderColor: 'border-slate-600/50', label: 'game.missionD' },
  [MissionRank.C]: { color: 'text-amber-400', borderColor: 'border-amber-700/50', label: 'game.missionC' },
  [MissionRank.B]: { color: 'text-slate-300', borderColor: 'border-slate-500/50', label: 'game.missionB' },
  [MissionRank.A]: { color: 'text-yellow-400', borderColor: 'border-yellow-600/50', label: 'game.missionA' },
};

function getMissionRoundBreakdown(mission: MissionSlot) {
  // Use evaluation-time snapshot if available, otherwise recalculate from current state
  const playerPower = mission.playerPowerAtEval ?? calculateMissionPower(getMissionCharacters(mission, 'player'));
  const opponentPower = mission.opponentPowerAtEval ?? calculateMissionPower(getMissionCharacters(mission, 'opponent'));
  return { playerPower, opponentPower, winner: mission.winner };
}

export function GameSummary({ gameState }: GameSummaryProps) {
  const t = useTranslations('Play');

  const stats = useMemo(() => {
    const actions = gameState.actionHistory;

    const charactersPlayed = actions.filter(
      (a) => a.type === GameActionType.PLAY_CHARACTER && a.side === 'player'
    ).length;

    const chakraSpent = actions
      .filter((a) => a.side === 'player' && (
        a.type === GameActionType.PLAY_CHARACTER ||
        a.type === GameActionType.PLAY_HIDDEN ||
        a.type === GameActionType.UPGRADE ||
        a.type === GameActionType.REVEAL
      ))
      .length * 3; // approximate average cost

    // Cards drawn is hard to track from actions — use deck size difference
    const cardsDrawn = 5 + (gameState.round > 1 ? (gameState.round - 1) * 2 : 0);

    const hiddenPlayed = actions.filter(
      (a) => a.type === GameActionType.PLAY_HIDDEN && a.side === 'player'
    ).length;

    const upgradesUsed = actions.filter(
      (a) => a.type === GameActionType.UPGRADE && a.side === 'player'
    ).length;

    return { charactersPlayed, chakraSpent, cardsDrawn, hiddenPlayed, upgradesUsed };
  }, [gameState.actionHistory]);

  const roundBreakdowns = useMemo(
    () => gameState.missions.filter((m) => m.resolved).map(getMissionRoundBreakdown),
    [gameState.missions]
  );

  return (
    <div className="w-full space-y-4">
      {/* Round Breakdown */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">
          {t('game.roundBreakdown')}
        </h3>
        <div className="space-y-2">
          {gameState.missions
            .filter((m) => m.resolved)
            .map((mission, i) => {
              const breakdown = roundBreakdowns[i];
              const config = missionRankConfig[mission.rank];

              return (
                <div
                  key={mission.rank}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm"
                >
                  <Badge variant="outline" className={cn('text-xs', config.color, config.borderColor)}>
                    {t(config.label)}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">
                      {t('game.player')} {breakdown.playerPower}
                    </span>
                    <span className="text-xs text-muted-foreground">{t('game.vs')}</span>
                    <span className="font-mono">
                      {t('game.opponent')} {breakdown.opponentPower}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-semibold',
                      breakdown.winner === 'player'
                        ? 'text-green-500'
                        : breakdown.winner === 'opponent'
                          ? 'text-red-500'
                          : 'text-muted-foreground'
                    )}
                  >
                    {breakdown.winner === 'player'
                      ? t('game.player')
                      : breakdown.winner === 'opponent'
                        ? t('game.opponent')
                        : t('game.edge')}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      <Separator />

      {/* Game Statistics */}
      <div>
        <h3 className="mb-3 text-sm font-semibold">
          {t('game.stats')}
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <StatItem label={t('game.charactersPlayed')} value={stats.charactersPlayed} />
          <StatItem label={t('game.chakraSpent')} value={stats.chakraSpent} />
          <StatItem label={t('game.cardsDrawn')} value={stats.cardsDrawn} />
          <StatItem label={t('game.hiddenPlayed')} value={stats.hiddenPlayed} />
          <StatItem label={t('game.upgradesUsed')} value={stats.upgradesUsed} />
          <StatItem label={t('game.missionPoints')} value={gameState.player.missionPoints} />
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

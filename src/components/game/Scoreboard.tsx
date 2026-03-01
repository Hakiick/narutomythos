'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Trophy } from 'lucide-react';
import { MissionPointsIcon } from './icons';
import type { PlayerState } from '@/lib/game/types';
import { cn } from '@/lib/utils';

interface ScoreboardProps {
  player: PlayerState;
  opponent: PlayerState;
  round: number;
}

function ScoreDelta({ delta }: { delta: number }) {
  if (delta === 0) return null;
  return (
    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-yellow-300 animate-delta-float">
      +{delta}
    </span>
  );
}

export function Scoreboard({ player, opponent, round }: ScoreboardProps) {
  const t = useTranslations('Play');
  const [playerDelta, setPlayerDelta] = useState(0);
  const [oppDelta, setOppDelta] = useState(0);
  const prevPlayer = useRef(player.missionPoints);
  const prevOpp = useRef(opponent.missionPoints);
  const pTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const oTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const diff = player.missionPoints - prevPlayer.current;
    if (diff > 0) {
      setPlayerDelta(diff);
      if (pTimer.current) clearTimeout(pTimer.current);
      pTimer.current = setTimeout(() => setPlayerDelta(0), 1500);
    }
    prevPlayer.current = player.missionPoints;
  }, [player.missionPoints]);

  useEffect(() => {
    const diff = opponent.missionPoints - prevOpp.current;
    if (diff > 0) {
      setOppDelta(diff);
      if (oTimer.current) clearTimeout(oTimer.current);
      oTimer.current = setTimeout(() => setOppDelta(0), 1500);
    }
    prevOpp.current = opponent.missionPoints;
  }, [opponent.missionPoints]);

  useEffect(() => {
    return () => {
      if (pTimer.current) clearTimeout(pTimer.current);
      if (oTimer.current) clearTimeout(oTimer.current);
    };
  }, []);

  const winning = player.missionPoints > opponent.missionPoints
    ? 'player'
    : opponent.missionPoints > player.missionPoints
      ? 'opponent'
      : null;

  return (
    <div className="flex items-center justify-center gap-3 px-2 py-0.5">
      {/* Player score */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] font-medium text-orange-400">{t('game.player')}</span>
        <div className={cn(
          'relative flex items-center gap-1 rounded-lg border px-2.5 py-0.5',
          winning === 'player'
            ? 'border-yellow-500/50 bg-yellow-500/10'
            : 'border-border bg-muted/30'
        )}>
          {winning === 'player' && (
            <Trophy className="h-3 w-3 text-yellow-500" />
          )}
          <MissionPointsIcon className="h-3.5 w-3.5 text-yellow-500" />
          <span className={cn(
            'text-base font-bold tabular-nums',
            winning === 'player' ? 'text-yellow-400' : 'text-yellow-500/80'
          )}>
            {player.missionPoints}
          </span>
          <ScoreDelta delta={playerDelta} />
        </div>
      </div>

      {/* Separator */}
      <div className="flex flex-col items-center">
        <span className="text-[8px] font-medium uppercase tracking-wider text-muted-foreground">
          {t('game.scoreLabel')}
        </span>
        <span className="text-[9px] text-muted-foreground">R{round}/4</span>
      </div>

      {/* Opponent score */}
      <div className="flex items-center gap-1.5">
        <div className={cn(
          'relative flex items-center gap-1 rounded-lg border px-2.5 py-0.5',
          winning === 'opponent'
            ? 'border-red-500/50 bg-red-500/10'
            : 'border-border bg-muted/30'
        )}>
          <MissionPointsIcon className="h-3.5 w-3.5 text-red-400" />
          <span className={cn(
            'text-base font-bold tabular-nums',
            winning === 'opponent' ? 'text-red-400' : 'text-red-500/80'
          )}>
            {opponent.missionPoints}
          </span>
          {winning === 'opponent' && (
            <Trophy className="h-3 w-3 text-red-400" />
          )}
          <ScoreDelta delta={oppDelta} />
        </div>
        <span className="text-[10px] font-medium text-red-400">{t('game.opponent')}</span>
      </div>
    </div>
  );
}

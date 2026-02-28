'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { type PlayerSide, MissionRank } from '@/lib/game/types';
import { cn } from '@/lib/utils';

interface ScoreAnimationProps {
  points: number;
  winner: PlayerSide;
  missionRank: MissionRank;
}

const rankLabels: Record<MissionRank, string> = {
  [MissionRank.D]: 'game.missionD',
  [MissionRank.C]: 'game.missionC',
  [MissionRank.B]: 'game.missionB',
  [MissionRank.A]: 'game.missionA',
};

export function ScoreAnimation({ points, winner, missionRank }: ScoreAnimationProps) {
  const t = useTranslations('Play');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  const isPlayer = winner === 'player';

  return (
    <div
      className={cn(
        'pointer-events-none flex items-center gap-1 text-lg font-bold animate-float-up',
        isPlayer ? 'text-green-500' : 'text-red-500'
      )}
    >
      <span>+{points}</span>
      <span className="text-sm font-medium text-muted-foreground">
        {t(rankLabels[missionRank])}
      </span>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Trophy } from 'lucide-react';
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

const rankColors: Record<MissionRank, string> = {
  [MissionRank.D]: 'from-gray-400 to-gray-500',
  [MissionRank.C]: 'from-blue-400 to-blue-500',
  [MissionRank.B]: 'from-purple-400 to-purple-500',
  [MissionRank.A]: 'from-amber-400 to-amber-500',
};

export function ScoreAnimation({ points, winner, missionRank }: ScoreAnimationProps) {
  const t = useTranslations('Play');
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    const enterTimer = setTimeout(() => setPhase('hold'), 300);
    const exitTimer = setTimeout(() => setPhase('exit'), 800);
    const hideTimer = setTimeout(() => setVisible(false), 1200);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  const isPlayer = winner === 'player';

  return (
    <div
      className={cn(
        'pointer-events-none flex flex-col items-center gap-1',
        phase === 'enter' && 'animate-score-burst',
        phase === 'exit' && 'animate-float-up'
      )}
    >
      {/* Points badge */}
      <div
        className={cn(
          'flex items-center gap-1.5 rounded-full px-3 py-1',
          isPlayer
            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
            : 'bg-gradient-to-r from-red-600 to-red-500 text-white'
        )}
      >
        <Trophy className="h-4 w-4" />
        <span className="text-lg font-black tracking-wide">+{points}</span>
      </div>

      {/* Rank label with gradient text */}
      <span
        className={cn(
          'bg-clip-text text-sm font-bold text-transparent bg-gradient-to-r',
          rankColors[missionRank]
        )}
      >
        {t(rankLabels[missionRank])}
      </span>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { MissionSlot } from '@/lib/game/types';
import { MissionRank } from '@/lib/game/types';
import { PowerComparison } from './PowerComparison';
import { cn } from '@/lib/utils';

interface MissionEvaluationProps {
  missions: MissionSlot[];
  playerHasEdge: boolean;
  onComplete: () => void;
}

const STEP_DELAY_MS = 3000;

const rankDotColors: Record<string, { active: string; done: string }> = {
  [MissionRank.D]: { active: 'bg-gray-400', done: 'bg-gray-500/50' },
  [MissionRank.C]: { active: 'bg-blue-400', done: 'bg-blue-500/50' },
  [MissionRank.B]: { active: 'bg-purple-400', done: 'bg-purple-500/50' },
  [MissionRank.A]: { active: 'bg-amber-400', done: 'bg-amber-500/50' },
};

export function MissionEvaluation({
  missions,
  playerHasEdge,
  onComplete,
}: MissionEvaluationProps) {
  const t = useTranslations('Play');
  const resolvedMissions = missions.filter((m) => m.resolved);
  const [currentIndex, setCurrentIndex] = useState(0);

  const advance = useCallback(() => {
    setCurrentIndex((prev) => {
      const next = prev + 1;
      if (next >= resolvedMissions.length) {
        return prev;
      }
      return next;
    });
  }, [resolvedMissions.length]);

  const handleClick = useCallback(() => {
    if (currentIndex >= resolvedMissions.length - 1) {
      onComplete();
    } else {
      advance();
    }
  }, [currentIndex, resolvedMissions.length, advance, onComplete]);

  // Auto-advance through missions
  useEffect(() => {
    if (resolvedMissions.length === 0) {
      onComplete();
      return;
    }

    if (currentIndex >= resolvedMissions.length - 1) {
      // Last mission shown, wait then complete
      const timer = setTimeout(onComplete, STEP_DELAY_MS);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(advance, STEP_DELAY_MS);
    return () => clearTimeout(timer);
  }, [currentIndex, resolvedMissions.length, advance, onComplete]);

  if (resolvedMissions.length === 0) return null;

  const currentMission = resolvedMissions[currentIndex];
  const playerWins = currentMission.winner === 'player';
  const opponentWins = currentMission.winner === 'opponent';

  // Background glow color based on winner
  const glowStyle = playerWins
    ? 'radial-gradient(ellipse at 50% 50%, rgba(249, 115, 22, 0.12) 0%, transparent 70%)'
    : opponentWins
      ? 'radial-gradient(ellipse at 50% 50%, rgba(239, 68, 68, 0.10) 0%, transparent 70%)'
      : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center p-4"
      data-testid="mission-evaluation"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Winner glow */}
      {glowStyle && (
        <div className="absolute inset-0" style={{ background: glowStyle }} />
      )}

      <div className="relative w-full max-w-sm animate-card-play">
        <PowerComparison
          mission={currentMission}
          playerHasEdge={playerHasEdge}
          animate
        />

        {/* Progress dots — rank-colored */}
        <div className="mt-4 flex items-center justify-center gap-2.5">
          {resolvedMissions.map((m, i) => {
            const colors = rankDotColors[m.rank] ?? rankDotColors[MissionRank.D];
            return (
              <div
                key={m.rank}
                className={cn(
                  'h-2.5 w-2.5 rounded-full transition-all duration-300',
                  i === currentIndex && cn(colors.active, 'scale-125 ring-2 ring-white/20'),
                  i < currentIndex && colors.done,
                  i > currentIndex && 'bg-muted-foreground/20'
                )}
              />
            );
          })}
        </div>

        {/* Round label */}
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {t('game.round', { round: currentIndex + 1 })} / {resolvedMissions.length}
        </p>

        {/* Tap to continue */}
        <p className="mt-3 text-center text-xs text-muted-foreground/60 animate-pulse">
          {t('game.tapToContinue')}
        </p>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import type { MissionSlot } from '@/lib/game/types';
import { PowerComparison } from './PowerComparison';

interface MissionEvaluationProps {
  missions: MissionSlot[];
  playerHasEdge: boolean;
  onComplete: () => void;
}

const STEP_DELAY_MS = 3000;

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

  return (
    <div
      className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/60 p-4"
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
      <div className="w-full max-w-sm animate-card-play">
        <PowerComparison
          mission={currentMission}
          playerHasEdge={playerHasEdge}
          animate
        />

        {/* Progress dots */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {resolvedMissions.map((m, i) => (
            <div
              key={m.rank}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === currentIndex
                  ? 'bg-primary'
                  : i < currentIndex
                    ? 'bg-primary/40'
                    : 'bg-muted-foreground/30'
              }`}
            />
          ))}
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

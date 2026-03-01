'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Flame, Star, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { PlayerState, PlayerSide } from '@/lib/game/types';
import { useGameTheme, type GameTheme } from '@/hooks/useGameTheme';
import { cn } from '@/lib/utils';

interface PlayerHUDProps {
  playerState: PlayerState;
  side: PlayerSide;
  isCurrentTurn: boolean;
  label: string;
  variant?: 'default' | 'compact';
  round?: number;
}

/** Renders a floating +N / -N delta that fades out */
function DeltaIndicator({ delta, color }: { delta: number; color: string }) {
  if (delta === 0) return null;
  const sign = delta > 0 ? '+' : '';
  return (
    <span className={cn('absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold animate-delta-float', color)}>
      {sign}{delta}
    </span>
  );
}

function themeHudClass(theme: GameTheme): string {
  switch (theme) {
    case 'scroll': return 'theme-scroll-hud-active';
    case 'chakra': return 'theme-chakra-hud-active';
    case 'konoha': return 'theme-konoha-hud-active';
  }
}

export function PlayerHUD({ playerState, side, isCurrentTurn, label, variant = 'default', round }: PlayerHUDProps) {
  const t = useTranslations('Play');
  const { theme } = useGameTheme();

  // Track deltas for chakra and mission points
  const [chakraDelta, setChakraDelta] = useState(0);
  const [pointsDelta, setPointsDelta] = useState(0);
  const prevChakraRef = useRef(playerState.chakra);
  const prevPointsRef = useRef(playerState.missionPoints);
  const chakraTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const diff = playerState.chakra - prevChakraRef.current;
    if (diff !== 0) {
      setChakraDelta(diff);
      if (chakraTimerRef.current) clearTimeout(chakraTimerRef.current);
      chakraTimerRef.current = setTimeout(() => setChakraDelta(0), 1200);
    }
    prevChakraRef.current = playerState.chakra;
  }, [playerState.chakra]);

  useEffect(() => {
    const diff = playerState.missionPoints - prevPointsRef.current;
    if (diff !== 0) {
      setPointsDelta(diff);
      if (pointsTimerRef.current) clearTimeout(pointsTimerRef.current);
      pointsTimerRef.current = setTimeout(() => setPointsDelta(0), 1200);
    }
    prevPointsRef.current = playerState.missionPoints;
  }, [playerState.missionPoints]);

  useEffect(() => {
    return () => {
      if (chakraTimerRef.current) clearTimeout(chakraTimerRef.current);
      if (pointsTimerRef.current) clearTimeout(pointsTimerRef.current);
    };
  }, []);

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg border px-3 py-1 transition-all',
        isCurrentTurn
          ? cn('border-amber-500/50 bg-amber-500/5 naruto-glow', themeHudClass(theme))
          : 'border-border bg-muted/30'
      )}
    >
      {/* Left: Player Label + Edge */}
      <div className="flex items-center gap-2">
        <span className={cn('font-semibold', variant === 'compact' ? 'text-xs' : 'text-sm')}>{label}</span>
        {playerState.hasEdge && (
          <div className="animate-edge-flip" title={t('game.edge')}>
            <Badge variant="secondary" className="bg-violet-500/10 px-1.5 py-0 text-[10px] text-violet-500">
              {t('game.edge')}
            </Badge>
          </div>
        )}
        {isCurrentTurn && variant === 'default' && (
          <Badge variant="default" className="text-[10px]">
            {side === 'player' ? t('game.yourTurn') : t('game.aiTurn')}
          </Badge>
        )}
      </div>

      {/* Center: Round/Phase info (player side, compact) */}
      {variant === 'compact' && side === 'player' && round && (
        <div className="hidden items-center gap-1.5 sm:flex">
          <span className="text-[10px] text-muted-foreground">
            {t('game.turnOf', { turn: round })}
          </span>
          {isCurrentTurn && (
            <Badge variant="default" className="text-[9px] px-1.5 py-0">
              {t('game.actionPhase')}
            </Badge>
          )}
        </div>
      )}

      {/* Right: Stats Row */}
      <div className="flex items-center gap-3">
        {/* Chakra */}
        <div className="relative flex items-center gap-1" title={t('game.chakra')}>
          <Flame className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-medium text-orange-500">
            {playerState.chakra}
          </span>
          <DeltaIndicator delta={chakraDelta} color="text-orange-400" />
        </div>

        {/* Mission Points */}
        <div
          className="relative flex items-center gap-1"
          title={t('game.missionPoints')}
          data-tutorial={side === 'player' ? 'score' : undefined}
        >
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-medium text-yellow-500">
            {playerState.missionPoints}
          </span>
          <DeltaIndicator delta={pointsDelta} color="text-yellow-400" />
        </div>

        {/* Deck visual stack */}
        <div className="relative flex items-center gap-1" title={t('game.deck')}>
          <div className="relative h-5 w-4">
            <div className="absolute inset-0 rounded-[2px] border border-muted-foreground/30 bg-muted/50" />
            <div className="absolute inset-0 translate-x-[1px] -translate-y-[1px] rounded-[2px] border border-muted-foreground/20 bg-muted/30" />
            <div className="absolute inset-0 translate-x-[2px] -translate-y-[2px] rounded-[2px] border border-muted-foreground/10 bg-muted/20" />
          </div>
          <span className="text-xs text-muted-foreground">
            {playerState.deck.length}
          </span>
        </div>

        {/* Discard Count */}
        <div className="flex items-center gap-1" title={t('game.discard')}>
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {playerState.discardPile.length}
          </span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { type GameState, MissionRank } from '@/lib/game/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Trophy,
  RotateCcw,
  ArrowLeft,
  Layers,
  Star,
  Shield,
  Swords,
} from 'lucide-react';
import { useGameTheme } from '@/hooks/useGameTheme';
import { cn } from '@/lib/utils';
import { GameSummary } from './GameSummary';

interface GameOverScreenProps {
  gameState: GameState;
  onPlayAgain: () => void;
  onChangeDeck: () => void;
  onBackToLobby: () => void;
}

/** Points for each mission rank */
const rankPoints: Record<MissionRank, number> = {
  [MissionRank.D]: 1,
  [MissionRank.C]: 2,
  [MissionRank.B]: 3,
  [MissionRank.A]: 4,
};

/** Star color per mission rank */
const rankStarColor: Record<MissionRank, string> = {
  [MissionRank.D]: 'text-slate-400 fill-slate-400',
  [MissionRank.C]: 'text-amber-500 fill-amber-500',
  [MissionRank.B]: 'text-slate-300 fill-slate-300',
  [MissionRank.A]: 'text-yellow-400 fill-yellow-400',
};

export function GameOverScreen({
  gameState,
  onPlayAgain,
  onChangeDeck,
  onBackToLobby,
}: GameOverScreenProps) {
  const t = useTranslations('Play');
  const { theme } = useGameTheme();

  const result = gameState.winner;
  const isVictory = result === 'player';
  const isDefeat = result === 'opponent';

  // Compute per-mission star data for the player
  const missionStars = gameState.missions
    .filter((m) => m.resolved)
    .map((m) => ({
      rank: m.rank,
      points: rankPoints[m.rank] ?? 1,
      won: m.winner === 'player',
    }));

  return (
    <div data-testid="game-over-screen" className={cn(
      'fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4',
      isVictory
        ? cn(
            'bg-gradient-to-b from-orange-950/80 via-black/70 to-black/80',
            theme === 'scroll' && 'theme-scroll-victory',
            theme === 'chakra' && 'theme-chakra-victory',
            theme === 'konoha' && 'theme-konoha-victory'
          )
        : isDefeat
          ? cn(
              'bg-gradient-to-b from-red-950/60 via-black/70 to-black/80',
              theme === 'scroll' && 'theme-scroll-defeat',
              theme === 'chakra' && 'theme-chakra-defeat',
              theme === 'konoha' && 'theme-konoha-defeat'
            )
          : 'bg-black/70'
    )}>
      <div
        className={cn(
          'w-full max-w-md space-y-5 rounded-2xl border p-6 shadow-2xl animate-game-over-in',
          isVictory && 'border-orange-500/30 bg-gradient-to-b from-orange-950/40 via-background to-background animate-victory-pulse',
          isDefeat && 'border-red-900/40 bg-gradient-to-b from-red-950/30 via-background to-background animate-defeat-pulse',
          !isVictory && !isDefeat && 'border-border bg-background'
        )}
      >
        {/* Result Banner */}
        <div className={cn(
          'relative flex flex-col items-center gap-3 rounded-xl border p-6 overflow-hidden',
          isVictory && 'border-orange-500/30 bg-gradient-to-b from-orange-500/10 to-yellow-500/5',
          isDefeat && 'border-red-800/30 bg-gradient-to-b from-red-900/15 to-red-950/10',
          !isVictory && !isDefeat && 'border-border bg-muted/30'
        )}>
          {/* Decorative top accent line */}
          <div className={cn(
            'absolute inset-x-0 top-0 h-0.5',
            isVictory && 'bg-gradient-to-r from-transparent via-orange-500 to-transparent',
            isDefeat && 'bg-gradient-to-r from-transparent via-red-600 to-transparent',
            !isVictory && !isDefeat && 'bg-gradient-to-r from-transparent via-muted-foreground/30 to-transparent'
          )} />

          {/* Icon */}
          {isVictory ? (
            <Trophy className="h-12 w-12 text-orange-400 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
          ) : isDefeat ? (
            <Shield className="h-12 w-12 text-red-500/80" />
          ) : (
            <Swords className="h-12 w-12 text-muted-foreground" />
          )}

          {/* Title */}
          <h1 className={cn(
            'text-2xl font-extrabold uppercase tracking-wider sm:text-3xl',
            isVictory && 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-300 to-orange-400',
            isDefeat && 'text-red-500',
            !isVictory && !isDefeat && 'text-muted-foreground'
          )}>
            {isVictory
              ? t('game.victory')
              : isDefeat
                ? t('game.defeat')
                : t('game.draw')}
          </h1>

          {/* Subtitle */}
          <p className={cn(
            'text-xs font-medium tracking-wide uppercase',
            isVictory && 'text-orange-400/70',
            isDefeat && 'text-red-400/60',
            !isVictory && !isDefeat && 'text-muted-foreground/60'
          )}>
            {isVictory
              ? t('game.missionComplete')
              : isDefeat
                ? t('game.missionFailed')
                : t('game.missionDraw')}
          </p>
        </div>

        {/* Mission Stars — visual representation of points earned */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('game.missionPoints')}
          </p>
          <div className="flex items-end gap-3">
            {missionStars.map((ms, idx) => (
              <div key={ms.rank} className="flex flex-col items-center gap-1">
                <div className="flex gap-0.5">
                  {Array.from({ length: ms.points }).map((_, starIdx) => (
                    <Star
                      key={starIdx}
                      className={cn(
                        'h-4 w-4 animate-star-burst',
                        ms.won
                          ? cn(rankStarColor[ms.rank], 'animate-star-shimmer')
                          : 'text-muted-foreground/30 fill-muted-foreground/10'
                      )}
                      style={{
                        animationDelay: `${idx * 200 + starIdx * 100}ms`,
                      }}
                    />
                  ))}
                </div>
                <span className={cn(
                  'text-[10px] font-semibold',
                  ms.won ? 'text-foreground' : 'text-muted-foreground/40'
                )}>
                  {ms.rank}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Final Score */}
        <div className="text-center">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('game.finalScore')}
          </p>
          <div className="flex items-center justify-center gap-6">
            <div
              className="animate-score-count text-center"
              style={{ animationDelay: '300ms' }}
            >
              <p className={cn(
                'text-4xl font-black tabular-nums',
                isVictory ? 'text-orange-400' : 'text-foreground'
              )}>
                {gameState.player.missionPoints}
              </p>
              <p className="text-xs text-muted-foreground">{t('game.player')}</p>
            </div>
            <span className="text-lg font-bold text-muted-foreground/50">{t('game.vs')}</span>
            <div
              className="animate-score-count text-center"
              style={{ animationDelay: '500ms' }}
            >
              <p className={cn(
                'text-4xl font-black tabular-nums',
                isDefeat ? 'text-red-400' : 'text-foreground'
              )}>
                {gameState.opponent.missionPoints}
              </p>
              <p className="text-xs text-muted-foreground">{t('game.opponent')}</p>
            </div>
          </div>
        </div>

        <Separator className={cn(
          isVictory && 'bg-orange-500/20',
          isDefeat && 'bg-red-500/20'
        )} />

        {/* Game Summary */}
        <GameSummary gameState={gameState} />

        <Separator className={cn(
          isVictory && 'bg-orange-500/20',
          isDefeat && 'bg-red-500/20'
        )} />

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Button
            onClick={onPlayAgain}
            className={cn(
              'flex-1 gap-2 font-semibold',
              isVictory
                ? 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white shadow-lg shadow-orange-500/20'
                : 'bg-orange-600 hover:bg-orange-500 text-white'
            )}
          >
            <RotateCcw className="h-4 w-4" />
            {t('game.rematch')}
          </Button>
          <Button
            onClick={onChangeDeck}
            variant="secondary"
            className="flex-1 gap-2 border border-orange-500/20 bg-orange-500/5 text-orange-300 hover:bg-orange-500/10"
          >
            <Layers className="h-4 w-4" />
            {t('game.changeDeck')}
          </Button>
        </div>
        <Button
          onClick={onBackToLobby}
          variant="outline"
          className="w-full gap-2 border-border/50 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('game.backToLobby')}
        </Button>
      </div>
    </div>
  );
}

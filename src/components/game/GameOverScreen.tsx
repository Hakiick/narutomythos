'use client';

import { useTranslations } from 'next-intl';
import { type GameState } from '@/lib/game/types';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Trophy, RotateCcw, ArrowLeft, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GameSummary } from './GameSummary';

interface GameOverScreenProps {
  gameState: GameState;
  onPlayAgain: () => void;
  onChangeDeck: () => void;
  onBackToLobby: () => void;
}

export function GameOverScreen({
  gameState,
  onPlayAgain,
  onChangeDeck,
  onBackToLobby,
}: GameOverScreenProps) {
  const t = useTranslations('Play');

  const result = gameState.winner;
  const isVictory = result === 'player';
  const isDefeat = result === 'opponent';

  const titleText = isVictory
    ? t('game.victory')
    : isDefeat
      ? t('game.defeat')
      : t('game.draw');

  const titleColor = isVictory
    ? 'text-green-500'
    : isDefeat
      ? 'text-red-500'
      : 'text-muted-foreground';

  const titleBg = isVictory
    ? 'border-green-500/20 bg-green-500/5'
    : isDefeat
      ? 'border-red-500/20 bg-red-500/5'
      : 'border-border bg-muted/50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
      <div
        className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-background p-6 shadow-2xl animate-game-over-in"
      >
        {/* Title */}
        <div className={cn('flex flex-col items-center gap-2 rounded-xl border p-6', titleBg)}>
          <Trophy className={cn('h-10 w-10', titleColor)} />
          <h1 className={cn('text-3xl font-extrabold uppercase', titleColor)}>
            {titleText}
          </h1>
          <p className="text-sm text-muted-foreground">{t('game.gameOver')}</p>
        </div>

        {/* Final Score */}
        <div className="text-center">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('game.finalScore')}
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">
                {gameState.player.missionPoints}
              </p>
              <p className="text-xs text-muted-foreground">{t('game.player')}</p>
            </div>
            <span className="text-lg font-bold text-muted-foreground">{t('game.vs')}</span>
            <div className="text-center">
              <p className="text-3xl font-bold text-red-500">
                {gameState.opponent.missionPoints}
              </p>
              <p className="text-xs text-muted-foreground">{t('game.opponent')}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Game Summary */}
        <GameSummary gameState={gameState} />

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Button onClick={onPlayAgain} className="flex-1 gap-2">
            <RotateCcw className="h-4 w-4" />
            {t('game.playAgain')}
          </Button>
          <Button onClick={onChangeDeck} variant="secondary" className="flex-1 gap-2">
            <Layers className="h-4 w-4" />
            {t('game.changeDeck')}
          </Button>
        </div>
        <Button onClick={onBackToLobby} variant="outline" className="w-full gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t('game.backToLobby')}
        </Button>
      </div>

    </div>
  );
}

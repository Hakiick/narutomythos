'use client';

import { useTranslations } from 'next-intl';
import { Hand, EyeOff, Loader2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GamePhase, GameActionType, type PendingEffect } from '@/lib/game/types';
import { cn } from '@/lib/utils';

interface ActionBarProps {
  gamePhase: GamePhase;
  round: number;
  isPlayerTurn: boolean;
  isAIThinking: boolean;
  selectedAction: GameActionType | null;
  selectedCardId: string | null;
  hasPlayableCards: boolean;
  pendingEffect: PendingEffect | null;
  onPass: () => void;
  onToggleHidden: () => void;
  hiddenMode: boolean;
}

export function ActionBar({
  gamePhase,
  round,
  isPlayerTurn,
  isAIThinking,
  selectedAction,
  selectedCardId,
  hasPlayableCards,
  pendingEffect,
  onPass,
  onToggleHidden,
  hiddenMode,
}: ActionBarProps) {
  const t = useTranslations('Play');

  const showActions = gamePhase === GamePhase.ACTION && isPlayerTurn && !isAIThinking;

  // Determine guidance message
  const getGuidanceMessage = (): string | null => {
    if (isAIThinking) return t('game.guideAIDeciding');
    if (gamePhase !== GamePhase.ACTION) return null;
    if (!isPlayerTurn) return null;
    if (pendingEffect && pendingEffect.side === 'player') return t('game.guideChooseTarget');
    if (selectedCardId) return t('game.guideTapMission');
    if (!hasPlayableCards) return t('game.guideNoPlays');
    return t('game.guideTapCard');
  };

  const guidance = getGuidanceMessage();

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
      {/* Phase Info Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {t('game.round', { round })}
          </Badge>
          {gamePhase === GamePhase.ACTION && (
            <span className="text-xs text-muted-foreground">
              {t('game.actionPhase')}
            </span>
          )}
        </div>

        {/* Turn indicator */}
        <div className="flex items-center gap-1.5">
          {isAIThinking ? (
            <div className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {t('game.aiThinking')}
              </span>
            </div>
          ) : isPlayerTurn ? (
            <Badge variant="default" className="text-[10px]">
              {t('game.yourTurn')}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">
              {t('game.aiTurn')}
            </span>
          )}
        </div>
      </div>

      {/* Guidance message */}
      {guidance && (
        <div className="flex items-center gap-1.5 rounded-md bg-primary/5 px-2 py-1.5">
          <Info className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
          <span className="text-xs font-medium text-primary">
            {guidance}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      {showActions && !pendingEffect && (
        <div className="flex items-center gap-2">
          {/* Hidden mode toggle */}
          <Button
            variant={hiddenMode ? 'default' : 'outline'}
            size="sm"
            onClick={onToggleHidden}
            data-tutorial="hidden-toggle"
            className={cn(
              'text-xs',
              hiddenMode && 'bg-gray-700 text-gray-100 hover:bg-gray-600'
            )}
          >
            <EyeOff className="h-3.5 w-3.5" />
            {t('game.playHidden')}
          </Button>

          {/* Pass button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onPass}
            data-tutorial="pass-button"
            className="ml-auto text-xs"
          >
            <Hand className="h-3.5 w-3.5" />
            {t('game.pass')}
          </Button>

          {/* Selected action indicator */}
          {selectedAction && selectedAction !== GameActionType.PASS && (
            <Badge variant="secondary" className="text-[10px]">
              {selectedAction === GameActionType.PLAY_CHARACTER && t('game.playCharacter')}
              {selectedAction === GameActionType.PLAY_HIDDEN && t('game.playHidden')}
              {selectedAction === GameActionType.UPGRADE && t('game.upgrade')}
              {selectedAction === GameActionType.REVEAL && t('game.reveal')}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

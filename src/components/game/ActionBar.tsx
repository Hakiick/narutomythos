'use client';

import { useTranslations } from 'next-intl';
import { Hand, EyeOff, Loader2, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GamePhase, type GameActionType, type PendingEffect } from '@/lib/game/types';
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
  selectedCardEffect?: string | null;
  onCancel?: () => void;
}

export function ActionBar({
  gamePhase,
  round: _round,
  isPlayerTurn,
  isAIThinking,
  selectedAction: _selectedAction,
  selectedCardId,
  hasPlayableCards,
  pendingEffect,
  onPass,
  onToggleHidden,
  hiddenMode,
  selectedCardEffect,
  onCancel,
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
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-1.5">
      {/* Left: Guidance */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {isAIThinking ? (
          <>
            <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-muted-foreground" />
            <span className="truncate text-xs text-muted-foreground">
              {t('game.aiThinking')}
            </span>
          </>
        ) : guidance ? (
          <>
            <Info className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
            <span className="truncate text-xs font-medium text-primary">
              {guidance}
            </span>
          </>
        ) : null}

        {/* Selected card effect (compact inline) */}
        {selectedCardEffect && !isAIThinking && (
          <span className="hidden truncate text-[10px] text-muted-foreground sm:inline">
            &mdash; {selectedCardEffect.split('\n')[0]}
          </span>
        )}
      </div>

      {/* Right: Action Buttons */}
      {showActions && !pendingEffect && (
        <div className="flex flex-shrink-0 items-center gap-1">
          {/* Cancel button when card selected */}
          {selectedCardId && onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-xs text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
              {t('game.cancelAction')}
            </Button>
          )}

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
            <span className="hidden sm:inline">{t('game.playHidden')}</span>
          </Button>

          {/* Pass button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onPass}
            data-tutorial="pass-button"
            className="text-xs"
          >
            <Hand className="h-3.5 w-3.5" />
            {t('game.pass')}
          </Button>
        </div>
      )}
    </div>
  );
}

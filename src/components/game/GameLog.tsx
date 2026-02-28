'use client';

import { useRef, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp, ScrollText } from 'lucide-react';
import { GameActionType, type GameAction } from '@/lib/game/types';
import { cn } from '@/lib/utils';

interface GameLogProps {
  actions: GameAction[];
  round: number;
}

function formatAction(action: GameAction, t: (key: string) => string): string {
  const who = action.side === 'player' ? t('game.player') : t('game.opponent');
  const desc = action.data?.description;

  switch (action.type) {
    case GameActionType.PLAY_CHARACTER:
      return `${who}: ${desc ?? t('game.playCharacter')}`;
    case GameActionType.PLAY_HIDDEN:
      return `${who}: ${desc ?? t('game.playHidden')}`;
    case GameActionType.REVEAL:
      return `${who}: ${desc ?? t('game.reveal')}`;
    case GameActionType.UPGRADE:
      return `${who}: ${desc ?? t('game.upgrade')}`;
    case GameActionType.PASS:
      return `${who}: ${t('game.pass')}`;
    case GameActionType.MULLIGAN:
      return `${who}: ${t('game.newHand')}`;
    case GameActionType.KEEP_HAND:
      return `${who}: ${t('game.keepHand')}`;
    default:
      return `${who}: ${desc ?? '...'}`;
  }
}

export function GameLog({ actions, round }: GameLogProps) {
  const t = useTranslations('Play');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  // Auto-scroll on new actions
  useEffect(() => {
    if (scrollRef.current && expanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [actions.length, expanded]);

  const recentActions = actions.slice(-5);

  return (
    <div className="rounded-lg border border-border bg-muted/20">
      {/* Toggle Header */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between px-3 py-1.5 text-left"
      >
        <div className="flex items-center gap-1.5">
          <ScrollText className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {t('game.round', { round })}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Log Content */}
      <div
        ref={scrollRef}
        className={cn(
          'overflow-hidden transition-all',
          expanded ? 'max-h-40 overflow-y-auto' : 'max-h-0'
        )}
      >
        <div className="space-y-0.5 px-3 pb-2">
          {(expanded ? actions : recentActions).map((action, idx) => (
            <p
              key={`${action.timestamp}-${idx}`}
              className={cn(
                'text-[10px] leading-relaxed',
                action.side === 'player' ? 'text-blue-400' : 'text-red-400'
              )}
            >
              {formatAction(action, (key: string) => t(key))}
            </p>
          ))}
          {actions.length === 0 && (
            <p className="text-[10px] text-muted-foreground">&mdash;</p>
          )}
        </div>
      </div>
    </div>
  );
}

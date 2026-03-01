'use client';

import { useRef, useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  ChevronDown,
  ChevronUp,
  ScrollText,
  Sword,
  EyeOff,
  ArrowUp,
  Eye,
  Zap,
  Hand,
} from 'lucide-react';
import { GameActionType, type GameAction } from '@/lib/game/types';
import { EffectActionType, type EffectEvent } from '@/lib/game/effects/types';
import { cn } from '@/lib/utils';

interface GameLogProps {
  actions: GameAction[];
  round: number;
  effectLog?: EffectEvent[];
}

const actionIcons: Record<string, typeof Sword> = {
  [GameActionType.PLAY_CHARACTER]: Sword,
  [GameActionType.PLAY_HIDDEN]: EyeOff,
  [GameActionType.UPGRADE]: ArrowUp,
  [GameActionType.REVEAL]: Eye,
  [GameActionType.PLAY_JUTSU]: Zap,
  [GameActionType.PASS]: Hand,
};

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

const effectColors: Record<string, string> = {
  [EffectActionType.POWERUP]: 'text-green-400',
  [EffectActionType.POWER_BOOST]: 'text-green-400',
  [EffectActionType.GAIN_CHAKRA]: 'text-blue-400',
  [EffectActionType.STEAL_CHAKRA]: 'text-blue-400',
  [EffectActionType.DRAW]: 'text-cyan-400',
  [EffectActionType.DEFEAT]: 'text-red-400',
  [EffectActionType.HIDE]: 'text-gray-400',
  [EffectActionType.MOVE]: 'text-purple-400',
  [EffectActionType.REMOVE_POWER]: 'text-orange-400',
  [EffectActionType.DISCARD]: 'text-amber-400',
  [EffectActionType.TAKE_CONTROL]: 'text-purple-400',
  [EffectActionType.LOOK_AT]: 'text-sky-400',
  [EffectActionType.PLACE_FROM_DECK]: 'text-teal-400',
  [EffectActionType.RETURN_TO_HAND]: 'text-sky-400',
  [EffectActionType.COPY_EFFECT]: 'text-indigo-400',
  [EffectActionType.PLAY_CHARACTER]: 'text-green-400',
  [EffectActionType.PAYING_LESS]: 'text-emerald-400',
};

function formatEffectEvent(
  event: EffectEvent,
  locale: string,
  t: (key: string, values?: Record<string, string | number>) => string
): string {
  const source = locale === 'fr'
    ? event.sourceCardNameFr.split(' \u2014 ')[0]
    : event.sourceCardNameEn.split(' \u2014 ')[0];
  const target = locale === 'fr'
    ? (event.targetCardNameFr?.split(' \u2014 ')[0] ?? '')
    : (event.targetCardNameEn?.split(' \u2014 ')[0] ?? '');

  switch (event.action) {
    case EffectActionType.POWERUP:
      return t('game.effectPowerup', { source, value: event.value, target: target || source });
    case EffectActionType.POWER_BOOST:
      return t('game.effectPowerBoost', { source, value: event.value, target: target || source });
    case EffectActionType.GAIN_CHAKRA:
      return t('game.effectGainChakra', { source, value: event.value });
    case EffectActionType.STEAL_CHAKRA:
      return t('game.effectStealChakra', { source, value: event.value });
    case EffectActionType.DRAW:
      return t('game.effectDraw', { source, value: event.value });
    case EffectActionType.DEFEAT:
      return t('game.effectDefeat', { source, target });
    case EffectActionType.HIDE:
      return t('game.effectHide', { source, target });
    case EffectActionType.MOVE:
      return t('game.effectMove', { source, target });
    case EffectActionType.REMOVE_POWER:
      return t('game.effectRemovePower', { source, value: event.value, target });
    case EffectActionType.DISCARD:
      return t('game.effectDiscard', { source, value: event.value });
    case EffectActionType.TAKE_CONTROL:
      return t('game.effectTakeControl', { source, target });
    case EffectActionType.LOOK_AT:
      return t('game.effectLookAt', { source, type: 'cards' });
    case EffectActionType.PLACE_FROM_DECK:
      return t('game.effectPlaceFromDeck', { source, value: event.value });
    case EffectActionType.RETURN_TO_HAND:
      return t('game.effectReturnToHand', { source });
    case EffectActionType.COPY_EFFECT:
      return t('game.effectCopyEffect', { source, target });
    case EffectActionType.PLAY_CHARACTER:
      return t('game.effectPlayCharacter', { source });
    case EffectActionType.PAYING_LESS:
      return t('game.effectPayingLess', { source, value: event.value });
    default:
      return `${event.action} (${source})`;
  }
}

/** Get effects that happened near a given action (within 100ms). */
function getEffectsForAction(
  action: GameAction,
  nextActionTimestamp: number | undefined,
  effectLog: EffectEvent[]
): EffectEvent[] {
  const start = action.timestamp - 50;
  const end = nextActionTimestamp ? nextActionTimestamp - 50 : action.timestamp + 5000;
  return effectLog.filter((e) => e.timestamp >= start && e.timestamp <= end);
}

export function GameLog({ actions, round, effectLog = [] }: GameLogProps) {
  const t = useTranslations('Play');
  const locale = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  // Auto-scroll on new actions
  useEffect(() => {
    if (scrollRef.current && expanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [actions.length, expanded]);

  const recentActions = actions.slice(-5);
  const displayActions = expanded ? actions : recentActions;

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
          {displayActions.map((action, idx) => {
            const Icon = actionIcons[action.type];
            const nextAction = actions[actions.indexOf(action) + 1];
            const relatedEffects = getEffectsForAction(
              action,
              nextAction?.timestamp,
              effectLog
            );

            return (
              <div key={`${action.timestamp}-${idx}`}>
                <div className="flex items-center gap-1">
                  {Icon && (
                    <Icon className={cn(
                      'h-3 w-3 flex-shrink-0',
                      action.side === 'player' ? 'text-blue-400' : 'text-red-400'
                    )} />
                  )}
                  <p
                    className={cn(
                      'text-[10px] leading-relaxed',
                      action.side === 'player' ? 'text-blue-400' : 'text-red-400'
                    )}
                  >
                    {formatAction(action, (key: string) => t(key))}
                  </p>
                </div>
                {/* Effect sub-items */}
                {relatedEffects.map((eff) => (
                  <p
                    key={eff.id}
                    className={cn(
                      'ml-4 text-[9px] leading-relaxed',
                      effectColors[eff.action] ?? 'text-muted-foreground'
                    )}
                  >
                    {formatEffectEvent(eff, locale, (key, values) => t(key as Parameters<typeof t>[0], values))}
                  </p>
                ))}
              </div>
            );
          })}
          {actions.length === 0 && (
            <p className="text-[10px] text-muted-foreground">&mdash;</p>
          )}
        </div>
      </div>
    </div>
  );
}

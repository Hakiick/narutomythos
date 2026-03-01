'use client';

import { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { BoltIcon, ArrowUpCircle, Eye, Trophy, ChevronRight } from 'lucide-react';
import { parseEffects } from '@/lib/game/effects/parser';
import { EffectTrigger, EffectTiming, EffectActionType, type ParsedEffect } from '@/lib/game/effects/types';
import type { GameCard } from '@/lib/game/types';
import { cn } from '@/lib/utils';

interface EffectPreviewPanelProps {
  card: GameCard;
  onInspect?: () => void;
}

const triggerColors: Record<string, string> = {
  [EffectTrigger.MAIN]: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
  [EffectTrigger.UPGRADE]: 'border-green-500/30 bg-green-500/10 text-green-400',
  [EffectTrigger.AMBUSH]: 'border-red-500/30 bg-red-500/10 text-red-400',
  [EffectTrigger.SCORE]: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
};

const triggerIcons: Record<string, typeof BoltIcon> = {
  [EffectTrigger.MAIN]: BoltIcon,
  [EffectTrigger.UPGRADE]: ArrowUpCircle,
  [EffectTrigger.AMBUSH]: Eye,
  [EffectTrigger.SCORE]: Trophy,
};

const actionLabels: Record<string, string> = {
  [EffectActionType.POWERUP]: '+PWR',
  [EffectActionType.GAIN_CHAKRA]: '+Chakra',
  [EffectActionType.STEAL_CHAKRA]: 'Steal',
  [EffectActionType.DRAW]: 'Draw',
  [EffectActionType.MOVE]: 'Move',
  [EffectActionType.DEFEAT]: 'Defeat',
  [EffectActionType.DEFEAT_ALL]: 'Defeat All',
  [EffectActionType.HIDE]: 'Hide',
  [EffectActionType.HIDE_ALL]: 'Hide All',
  [EffectActionType.POWER_BOOST]: '+PWR',
  [EffectActionType.REDUCE_POWER]: '-PWR',
  [EffectActionType.SET_POWER_ZERO]: 'PWR=0',
  [EffectActionType.REMOVE_POWER]: '-PWR',
  [EffectActionType.DISCARD]: 'Discard',
  [EffectActionType.OPPONENT_DISCARD]: 'Opp Disc.',
  [EffectActionType.OPPONENT_DRAW]: 'Opp Draw',
  [EffectActionType.OPPONENT_GAIN_CHAKRA]: 'Opp Chakra',
  [EffectActionType.BOTH_DRAW]: 'All Draw',
  [EffectActionType.TAKE_CONTROL]: 'Control',
  [EffectActionType.LOOK_AT]: 'Reveal',
  [EffectActionType.PLAY_CHARACTER]: 'Play',
  [EffectActionType.PLAY_FROM_DISCARD]: 'Discard→Play',
  [EffectActionType.RETRIEVE_FROM_DISCARD]: 'Retrieve',
  [EffectActionType.PLACE_FROM_DECK]: 'Place',
  [EffectActionType.RETURN_TO_HAND]: '→Hand',
  [EffectActionType.COPY_EFFECT]: 'Copy',
  [EffectActionType.PAYING_LESS]: '-Cost',
  [EffectActionType.PROTECTION]: 'Protect',
  [EffectActionType.RESTRICT_MOVEMENT]: 'Lock',
  [EffectActionType.COST_REDUCTION]: '-Cost',
  [EffectActionType.RETAIN_POWER]: 'Keep PWR',
};

export function EffectPreviewPanel({ card, onInspect }: EffectPreviewPanelProps) {
  const t = useTranslations('Play');
  const locale = useLocale();

  const parsedEffects = useMemo(() => parseEffects(card.effectEn), [card.effectEn]);
  const effectText = (locale === 'fr' ? card.effectFr : card.effectEn) || card.effectEn;

  if (!effectText || parsedEffects.length === 0) return null;

  // Deduplicate by rawText
  const seen = new Set<string>();
  const uniqueEffects: ParsedEffect[] = [];
  for (const pe of parsedEffects) {
    if (!seen.has(pe.rawText)) {
      seen.add(pe.rawText);
      uniqueEffects.push(pe);
    }
  }

  return (
    <div className="mx-1 rounded-lg border border-border/50 bg-muted/20 px-2 py-1">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
          {t('game.effectPreview')}
        </span>
        {onInspect && (
          <button
            type="button"
            onClick={onInspect}
            className="flex items-center gap-0.5 text-[9px] text-primary hover:underline"
          >
            {t('game.tapToInspect')}
            <ChevronRight className="h-2.5 w-2.5" />
          </button>
        )}
      </div>
      <div className="mt-0.5 flex flex-wrap gap-1">
        {uniqueEffects.map((pe, i) => {
          const TriggerIcon = triggerIcons[pe.trigger] ?? BoltIcon;
          const label = actionLabels[pe.action] ?? pe.action;
          const valueStr = pe.value > 0 && pe.action !== EffectActionType.UNRESOLVED
            ? ` ${pe.value}`
            : pe.value === -1 ? ' X' : '';

          return (
            <div
              key={i}
              className={cn(
                'flex items-center gap-1 rounded-md border px-1.5 py-0.5',
                triggerColors[pe.trigger] ?? 'border-border bg-muted/30 text-muted-foreground'
              )}
            >
              <TriggerIcon className="h-2.5 w-2.5" />
              <span className="text-[9px] font-medium">
                {pe.trigger}
              </span>
              <span className="text-[9px]">
                {pe.timing === EffectTiming.CONTINUOUS ? '\u2716' : '\u26A1'}
              </span>
              <span className="text-[9px] font-semibold">
                {label}{valueStr}
              </span>
              {pe.targetFilter?.keyword && (
                <span className="text-[8px] opacity-70">({pe.targetFilter.keyword})</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

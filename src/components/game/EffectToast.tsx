'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowUp,
  Zap,
  Sword,
  EyeOff,
  ArrowRightLeft,
  ArrowDown,
  BookOpen,
  Trash2,
  UserPlus,
  Eye,
  Download,
  RotateCcw,
  Copy,
} from 'lucide-react';
import { EffectActionType, type EffectEvent } from '@/lib/game/effects/types';
import { cn } from '@/lib/utils';

interface EffectToastProps {
  event: EffectEvent;
  exiting: boolean;
}

const actionConfig: Record<string, { icon: typeof ArrowUp; color: string }> = {
  [EffectActionType.POWERUP]: { icon: ArrowUp, color: 'bg-green-600/90 text-green-100' },
  [EffectActionType.POWER_BOOST]: { icon: ArrowUp, color: 'bg-green-600/90 text-green-100' },
  [EffectActionType.GAIN_CHAKRA]: { icon: Zap, color: 'bg-blue-600/90 text-blue-100' },
  [EffectActionType.STEAL_CHAKRA]: { icon: Zap, color: 'bg-blue-600/90 text-blue-100' },
  [EffectActionType.DRAW]: { icon: BookOpen, color: 'bg-cyan-600/90 text-cyan-100' },
  [EffectActionType.DEFEAT]: { icon: Sword, color: 'bg-red-600/90 text-red-100' },
  [EffectActionType.HIDE]: { icon: EyeOff, color: 'bg-gray-600/90 text-gray-100' },
  [EffectActionType.MOVE]: { icon: ArrowRightLeft, color: 'bg-purple-600/90 text-purple-100' },
  [EffectActionType.REMOVE_POWER]: { icon: ArrowDown, color: 'bg-orange-600/90 text-orange-100' },
  [EffectActionType.DISCARD]: { icon: Trash2, color: 'bg-amber-600/90 text-amber-100' },
  [EffectActionType.TAKE_CONTROL]: { icon: UserPlus, color: 'bg-purple-600/90 text-purple-100' },
  [EffectActionType.LOOK_AT]: { icon: Eye, color: 'bg-sky-600/90 text-sky-100' },
  [EffectActionType.PLACE_FROM_DECK]: { icon: Download, color: 'bg-teal-600/90 text-teal-100' },
  [EffectActionType.RETURN_TO_HAND]: { icon: RotateCcw, color: 'bg-sky-600/90 text-sky-100' },
  [EffectActionType.COPY_EFFECT]: { icon: Copy, color: 'bg-indigo-600/90 text-indigo-100' },
  [EffectActionType.PLAY_CHARACTER]: { icon: UserPlus, color: 'bg-green-600/90 text-green-100' },
  [EffectActionType.PAYING_LESS]: { icon: Zap, color: 'bg-emerald-600/90 text-emerald-100' },
};

const i18nKeyMap: Record<string, string> = {
  [EffectActionType.POWERUP]: 'effectPowerup',
  [EffectActionType.POWER_BOOST]: 'effectPowerBoost',
  [EffectActionType.GAIN_CHAKRA]: 'effectGainChakra',
  [EffectActionType.STEAL_CHAKRA]: 'effectStealChakra',
  [EffectActionType.DRAW]: 'effectDraw',
  [EffectActionType.DEFEAT]: 'effectDefeat',
  [EffectActionType.MOVE]: 'effectMove',
  [EffectActionType.HIDE]: 'effectHide',
  [EffectActionType.REMOVE_POWER]: 'effectRemovePower',
  [EffectActionType.DISCARD]: 'effectDiscard',
  [EffectActionType.TAKE_CONTROL]: 'effectTakeControl',
  [EffectActionType.LOOK_AT]: 'effectLookAt',
  [EffectActionType.PLACE_FROM_DECK]: 'effectPlaceFromDeck',
  [EffectActionType.RETURN_TO_HAND]: 'effectReturnToHand',
  [EffectActionType.COPY_EFFECT]: 'effectCopyEffect',
  [EffectActionType.PLAY_CHARACTER]: 'effectPlayCharacter',
  [EffectActionType.PAYING_LESS]: 'effectPayingLess',
};

export function EffectToast({ event, exiting }: EffectToastProps) {
  const t = useTranslations('Play');
  const locale = useLocale();

  const config = actionConfig[event.action] ?? { icon: Zap, color: 'bg-muted text-muted-foreground' };
  const Icon = config.icon;

  const sourceName = locale === 'fr' ? event.sourceCardNameFr : event.sourceCardNameEn;
  const targetName = locale === 'fr'
    ? (event.targetCardNameFr ?? '')
    : (event.targetCardNameEn ?? '');

  const key = i18nKeyMap[event.action];
  const label = key
    ? t(`game.${key}` as 'game.effectPowerup', {
        source: sourceName.split(' \u2014 ')[0],
        target: targetName.split(' \u2014 ')[0],
        value: event.value,
      })
    : `${sourceName}: ${event.action}`;

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 rounded-full px-3 py-1 shadow-lg',
        config.color,
        exiting ? 'animate-toast-exit' : 'animate-toast-enter'
      )}
    >
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="text-[11px] font-medium leading-tight">{label}</span>
    </div>
  );
}

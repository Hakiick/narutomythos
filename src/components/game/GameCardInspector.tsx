'use client';

import { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Zap, Shield, Sparkles, Sword, Scroll, Star, RotateCcw, BoltIcon, ArrowUpCircle, Eye, Trophy } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { parseEffects } from '@/lib/game/effects/parser';
import { EffectTrigger, EffectTiming } from '@/lib/game/effects/types';
import type { GameCard, DeployedCharacter, RevealedInfo } from '@/lib/game/types';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/storage';

interface GameCardInspectorProps {
  card: GameCard | null;
  deployed?: DeployedCharacter | null;
  revealedInfo?: RevealedInfo | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const triggerColors: Record<string, string> = {
  [EffectTrigger.MAIN]: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  [EffectTrigger.UPGRADE]: 'bg-green-500/20 text-green-400 border-green-500/30',
  [EffectTrigger.AMBUSH]: 'bg-red-500/20 text-red-400 border-red-500/30',
  [EffectTrigger.SCORE]: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const triggerIcons: Record<string, typeof BoltIcon> = {
  [EffectTrigger.MAIN]: BoltIcon,
  [EffectTrigger.UPGRADE]: ArrowUpCircle,
  [EffectTrigger.AMBUSH]: Eye,
  [EffectTrigger.SCORE]: Trophy,
};

const rarityColors: Record<string, string> = {
  C: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  UC: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  R: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  AR: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  S: 'bg-red-500/20 text-red-400 border-red-500/30',
  L: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
};

const rarityGlow: Record<string, string> = {
  C: '',
  UC: 'shadow-[0_0_10px_2px_rgba(59,130,246,0.35),0_0_4px_1px_rgba(59,130,246,0.2)] ring-1 ring-blue-500/40',
  R: 'shadow-[0_0_10px_2px_rgba(139,92,246,0.35),0_0_4px_1px_rgba(139,92,246,0.2)] ring-1 ring-violet-500/40',
  AR: 'shadow-[0_0_10px_2px_rgba(245,158,11,0.35),0_0_4px_1px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/40',
  S: 'shadow-[0_0_10px_2px_rgba(239,68,68,0.35),0_0_4px_1px_rgba(239,68,68,0.2)] ring-1 ring-red-500/40',
  L: 'animate-gold-shimmer ring-1 ring-yellow-400/60',
};

const typeIcons: Record<string, typeof Sword> = {
  CHARACTER: Sword,
  MISSION: Scroll,
  JUTSU: Star,
};

const typeColors: Record<string, string> = {
  CHARACTER: 'text-orange-400',
  MISSION: 'text-sky-400',
  JUTSU: 'text-violet-400',
};

export function GameCardInspector({ card, deployed, revealedInfo, open, onOpenChange }: GameCardInspectorProps) {
  const t = useTranslations('Play');
  const locale = useLocale();

  const parsedEffects = useMemo(() => {
    if (!card) return [];
    return parseEffects(card.effectEn);
  }, [card]);

  if (!card) return null;

  const fullName = locale === 'fr' ? card.nameFr : card.nameEn;
  const effectText = (locale === 'fr' ? card.effectFr : card.effectEn) || card.effectEn;
  const totalPower = deployed
    ? card.power + deployed.powerTokens
    : card.power;

  // Split name: "Naruto Uzumaki — Genin" → base + subtitle
  const nameParts = fullName.split(' \u2014 ');
  const baseName = nameParts[0];
  const subtitle = nameParts.length > 1 ? nameParts.slice(1).join(' \u2014 ') : null;

  const TypeIcon = typeIcons[card.type] ?? Sword;
  const typeColorClass = typeColors[card.type] ?? 'text-muted-foreground';
  const typeKey = `cardType${card.type.charAt(0)}${card.type.slice(1).toLowerCase()}` as
    'cardTypeCharacter' | 'cardTypeMission' | 'cardTypeJutsu';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 gap-3 overflow-y-auto p-4 sm:w-96">
        <SheetHeader>
          <SheetTitle className="text-base">{t('game.inspectCard')}</SheetTitle>
          <SheetDescription className="sr-only">{fullName}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col items-center gap-3">
          {/* Card image with rarity glow — larger (180x252) */}
          <div className={cn(
            'relative h-[252px] w-[180px] flex-shrink-0 overflow-hidden rounded-lg border border-border',
            rarityGlow[card.rarity] ?? ''
          )}>
            {card.imageUrl ? (
              <Image
                src={getImageUrl(card.imageUrl) ?? ''}
                alt={fullName}
                fill
                sizes="180px"
                className="object-contain"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-b from-zinc-900 to-zinc-950 p-2 text-center">
                <TypeIcon className={cn('h-5 w-5', typeColorClass)} />
                <p className="line-clamp-3 text-[10px] font-semibold leading-tight text-zinc-200">
                  {fullName}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    <Zap className="h-3 w-3 text-blue-400" />
                    <span className="text-[10px] font-bold text-blue-400">{card.chakra}</span>
                  </div>
                  {card.type === 'CHARACTER' && (
                    <div className="flex items-center gap-0.5">
                      <Shield className="h-3 w-3 text-amber-400" />
                      <span className="text-[10px] font-bold text-amber-400">{card.power}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Card info */}
          <div className="flex w-full flex-col gap-2">
            {/* Name */}
            <div className="text-center">
              <p className="text-sm font-semibold">{baseName}</p>
              {subtitle && (
                <p className="truncate text-[10px] text-muted-foreground">{subtitle}</p>
              )}
            </div>

            {/* Type + Rarity + Card number */}
            <div className="flex flex-wrap items-center gap-1.5">
              <div className={cn('flex items-center gap-0.5', typeColorClass)}>
                <TypeIcon className="h-3 w-3" />
                <span className="text-[9px] font-medium">{t(`game.${typeKey}`)}</span>
              </div>
              <Badge
                variant="outline"
                className={cn('text-[8px] px-1 py-0 border', rarityColors[card.rarity] ?? rarityColors.C)}
              >
                {card.rarity}
              </Badge>
              <span className="text-[9px] text-muted-foreground">
                {card.set}-{String(card.cardNumber).padStart(3, '0')}
              </span>
            </div>

            {/* Stats in bordered boxes */}
            <div className="flex items-center justify-center gap-3">
              <div className="flex items-center gap-1.5 rounded-md border border-blue-500/30 bg-blue-500/10 px-2.5 py-1">
                <Zap className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-bold text-blue-400">{card.chakra}</span>
              </div>
              {card.type === 'CHARACTER' && (
                <div className="flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1">
                  <Shield className="h-4 w-4 text-amber-400" />
                  <span className={cn(
                    'text-sm font-bold',
                    deployed && deployed.powerTokens > 0 ? 'text-green-400' : 'text-amber-400'
                  )}>
                    {totalPower}
                    {deployed && deployed.powerTokens > 0 && (
                      <span className="ml-0.5 text-[10px] text-green-400">
                        (+{deployed.powerTokens})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Keywords */}
            {card.keywords.length > 0 && (
              <div>
                <p className="text-[10px] text-muted-foreground">{t('game.keywordsLabel')}</p>
                <div className="flex flex-wrap gap-1">
                  {card.keywords.map((kw) => (
                    <Badge key={kw} variant="outline" className="text-[9px] px-1.5 py-0">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Village */}
            {card.group && (
              <div>
                <p className="text-[10px] text-muted-foreground">{t('game.villageLabel')}</p>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                  {card.group}
                </Badge>
              </div>
            )}

            {/* Continuous effects on deployed */}
            {deployed && deployed.continuousEffects.length > 0 && (
              <div className="space-y-0.5">
                {deployed.continuousEffects.map((ce) => (
                  <div key={ce.effectId} className="flex items-center gap-1">
                    {ce.type === 'RETURN_TO_HAND' ? (
                      <>
                        <RotateCcw className="h-3 w-3 text-sky-400" />
                        <span className="text-[10px] text-sky-400">{t('game.returnToHandEffect')}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 text-violet-400" />
                        <span className="text-[10px] text-violet-400">{t('game.continuousEffect')}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Effect text — improved layout */}
        {effectText && (
          <div className="rounded-lg border border-border bg-muted/30 p-2.5">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('game.effectLabel')}
            </p>
            <div className="space-y-2">
              {(() => {
                const effectLines = effectText.split('\n').filter(Boolean);
                if (parsedEffects.length > 0 && effectLines.length > 0) {
                  // Group parsed effects by their raw text line to avoid duplicating lines
                  // when compound effects split a single line into multiple ParsedEffects
                  const lineGroups: { trigger: string; timing: string; line: string; rawText: string }[] = [];
                  const seenRawTexts = new Set<string>();

                  for (let idx = 0; idx < parsedEffects.length; idx++) {
                    const pe = parsedEffects[idx];
                    if (seenRawTexts.has(pe.rawText)) continue;
                    seenRawTexts.add(pe.rawText);

                    const localeLine = effectLines[lineGroups.length] ?? pe.rawText;
                    const cleanedLine = localeLine.replace(/^(MAIN|UPGRADE|AMBUSH|SCORE)\s*[⚡✖]\s*/, '');
                    lineGroups.push({
                      trigger: pe.trigger,
                      timing: pe.timing === EffectTiming.INSTANT ? 'timingInstant' : 'timingContinuous',
                      line: cleanedLine,
                      rawText: pe.rawText,
                    });
                  }

                  return lineGroups.map((group, idx) => {
                    const triggerKey = `trigger${group.trigger.charAt(0)}${group.trigger.slice(1).toLowerCase()}` as 'triggerMain';
                    const TriggerIcon = triggerIcons[group.trigger] ?? BoltIcon;
                    return (
                      <div
                        key={idx}
                        className={cn(
                          'flex items-start gap-2 rounded-md border px-2 py-1.5',
                          group.trigger === EffectTrigger.MAIN && 'border-orange-500/20 bg-orange-500/5',
                          group.trigger === EffectTrigger.UPGRADE && 'border-green-500/20 bg-green-500/5',
                          group.trigger === EffectTrigger.AMBUSH && 'border-red-500/20 bg-red-500/5',
                          group.trigger === EffectTrigger.SCORE && 'border-yellow-500/20 bg-yellow-500/5'
                        )}
                      >
                        {/* Trigger icon + badge */}
                        <div className="flex flex-shrink-0 flex-col items-center gap-0.5 pt-0.5">
                          <TriggerIcon className={cn(
                            'h-3.5 w-3.5',
                            group.trigger === EffectTrigger.MAIN && 'text-orange-400',
                            group.trigger === EffectTrigger.UPGRADE && 'text-green-400',
                            group.trigger === EffectTrigger.AMBUSH && 'text-red-400',
                            group.trigger === EffectTrigger.SCORE && 'text-yellow-400'
                          )} />
                          <Badge
                            variant="outline"
                            className={cn('text-[7px] px-1 py-0 border leading-tight', triggerColors[group.trigger])}
                          >
                            {t(`game.${triggerKey}`)}
                          </Badge>
                        </div>
                        {/* Effect description */}
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-medium text-muted-foreground">
                            {t(`game.${group.timing}`)}
                          </span>
                          <p className="mt-0.5 text-[11px] leading-snug">
                            {group.line}
                          </p>
                        </div>
                      </div>
                    );
                  });
                }
                return <p className="text-xs leading-relaxed">{effectText}</p>;
              })()}
            </div>
          </div>
        )}

        {/* Revealed info */}
        {revealedInfo && revealedInfo.cards.length > 0 && (
          <div className="rounded-md border border-sky-500/30 bg-sky-500/10 p-2">
            <p className="mb-1 text-[10px] font-medium text-sky-400">
              {revealedInfo.type === 'hand'
                ? t('game.revealedHand')
                : t('game.revealedHidden')}
            </p>
            <div className="flex flex-wrap gap-1">
              {revealedInfo.cards.map((rc, idx) => {
                const rcName = locale === 'fr' ? rc.nameFr : rc.nameEn;
                return (
                  <Badge key={idx} variant="outline" className="text-[9px] px-1.5 py-0 border-sky-500/30 text-sky-300">
                    {rcName.split(' \u2014 ')[0]}
                  </Badge>
                );
              })}
            </div>
            <p className="mt-1 text-[9px] text-sky-400/60">
              {t('game.revealedExpires', { count: revealedInfo.expiresAfterActions })}
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

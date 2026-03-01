'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { Shield, Sparkles, Zap } from 'lucide-react';
import Image from 'next/image';
import type { DeployedCharacter } from '@/lib/game/types';
import { useLongPress } from '@/hooks/useLongPress';
import { DeployEffect } from './DeployEffect';
import { cn } from '@/lib/utils';

const SLOT_CLASSES = 'h-[60px] w-[44px] sm:h-[72px] sm:w-[52px] md:h-[82px] md:w-[60px]';

interface CharacterSlotProps {
  character: DeployedCharacter;
  isOwn: boolean;
  isSelectable: boolean;
  onClick?: () => void;
  onInspect?: () => void;
}

export function CharacterSlot({ character, isOwn, isSelectable, onClick, onInspect }: CharacterSlotProps) {
  const t = useTranslations('Play');
  const locale = useLocale();
  const name = locale === 'fr' ? character.card.nameFr : character.card.nameEn;
  const displayName = name.split(' \u2014 ')[0];
  const totalPower = character.card.power + character.powerTokens;
  const imageUrl = character.card.imageUrl;

  const { handlers: longPressHandlers, isPressing } = useLongPress({
    onLongPress: () => onInspect?.(),
    onShortPress: isSelectable ? onClick : undefined,
  });

  const { handlers: ownHiddenHandlers, isPressing: isPressingHidden } = useLongPress({
    onLongPress: () => onInspect?.(),
    onShortPress: isSelectable ? onClick : undefined,
  });

  if (character.hidden && !isOwn) {
    // Opponent's hidden card — show Naruto-themed card back
    return (
      <button
        type="button"
        onClick={isSelectable ? onClick : undefined}
        disabled={!isSelectable}
        className={cn(
          `group relative flex ${SLOT_CLASSES} flex-col items-center justify-center overflow-hidden rounded-lg border-2`,
          'border-slate-600/80 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950',
          isSelectable && 'cursor-pointer ring-2 ring-primary/50 hover:ring-primary',
          !isSelectable && 'cursor-default'
        )}
        title={t('game.hidden')}
      >
        <div className="absolute inset-0 opacity-10"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(249,115,22,0.4) 0%, transparent 60%)',
          }}
        />
        <div className="relative flex h-10 w-10 items-center justify-center sm:h-12 sm:w-12">
          <div className="absolute inset-0 rounded-full border-2 border-orange-500/30" />
          <div className="absolute inset-1.5 rounded-full border border-orange-500/20" />
          <div className="absolute h-2 w-2 rounded-full bg-orange-500/40 sm:h-2.5 sm:w-2.5" />
          <div className="absolute inset-2 rounded-full border border-dashed border-orange-500/15" />
        </div>
        <span className="absolute bottom-1 text-[8px] font-medium tracking-wider text-orange-400/50 uppercase">
          {t('game.hidden')}
        </span>
      </button>
    );
  }

  if (character.hidden && isOwn) {
    // Player's hidden card — long-press to peek
    return (
      <div
        {...(onInspect ? ownHiddenHandlers : {})}
        role="button"
        tabIndex={0}
        className={cn(
          `relative flex ${SLOT_CLASSES} flex-col items-center justify-center overflow-hidden rounded-lg border-2`,
          'border-dashed border-gray-500 bg-gray-800/50',
          isSelectable && 'cursor-pointer ring-2 ring-amber-500/50 hover:ring-amber-500',
          !isSelectable && onInspect && 'cursor-pointer',
          !isSelectable && !onInspect && 'cursor-default',
          isPressingHidden && 'scale-95 opacity-80 transition-transform duration-150'
        )}
        title={name}
      >
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={displayName}
            fill
            sizes="76px"
            className="object-cover opacity-20"
          />
        )}
        <div className="relative z-10 flex flex-col items-center">
          <span className="max-w-full truncate px-0.5 text-[9px] font-medium text-gray-300 sm:text-[10px]">
            {displayName}
          </span>
          <div className="relative mt-0.5 flex h-4 w-4 items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-amber-500/40" />
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500/50" />
          </div>
          <span className="text-[8px] tracking-wide text-amber-500/60 uppercase">{t('game.hidden')}</span>
        </div>
      </div>
    );
  }

  // Visible character — show card image with power overlay
  return (
    <div
      {...longPressHandlers}
      role="button"
      tabIndex={0}
      className={cn(
        `relative flex ${SLOT_CLASSES} overflow-hidden rounded-lg border-2 animate-card-play`,
        isOwn ? 'border-orange-500/60' : 'border-red-500/60',
        isSelectable && 'cursor-pointer ring-2 ring-primary/50 hover:ring-primary',
        !isSelectable && !onInspect && 'cursor-default',
        !isSelectable && onInspect && 'cursor-pointer',
        isPressing && 'scale-95 opacity-80 transition-transform duration-150'
      )}
      title={name}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={displayName}
          fill
          sizes="76px"
          className="object-cover"
        />
      ) : (
        <div className={cn(
          'flex h-full w-full flex-col items-center justify-center gap-0.5 p-0.5',
          isOwn ? 'bg-orange-950/40' : 'bg-red-950/40'
        )}>
          <span className={cn(
            'max-w-full truncate text-[7px] font-semibold leading-tight sm:text-[8px]',
            isOwn ? 'text-orange-300' : 'text-red-300'
          )}>
            {displayName}
          </span>
          <div className="flex items-center gap-0.5">
            <Shield className="h-2 w-2 text-amber-400/70" />
            <span className="text-[9px] font-bold text-amber-400/70">{character.card.power}</span>
          </div>
        </div>
      )}

      {/* Dark gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-1 pb-0.5 pt-4">
        <p className="truncate text-[8px] font-semibold leading-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:text-[9px]">
          {displayName}
        </p>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            <Shield className="h-2.5 w-2.5 text-amber-400" />
            <span className={cn(
              'text-[10px] font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]',
              character.powerTokens > 0 ? 'text-green-400' : 'text-amber-400'
            )}>
              {totalPower}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            <Zap className="h-2 w-2 text-blue-400" />
            <span className="text-[9px] font-bold text-blue-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {character.card.chakra}
            </span>
          </div>
        </div>
      </div>

      {/* Power tokens badge */}
      {character.powerTokens > 0 && (
        <div className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-[8px] font-bold text-white shadow animate-power-pop">
          +{character.powerTokens}
        </div>
      )}

      {/* Continuous effect indicator */}
      {character.continuousEffects.length > 0 && (
        <div className="absolute left-0.5 top-0.5 z-10">
          <Sparkles className="h-3 w-3 text-violet-400 drop-shadow-[0_0_3px_rgba(139,92,246,0.6)]" />
        </div>
      )}

      {/* Side indicator strip */}
      <div className={cn(
        'absolute inset-y-0 left-0 w-[3px]',
        isOwn ? 'bg-orange-500' : 'bg-red-500'
      )} />

      <DeployEffect triggerKey={character.instanceId} />
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { HelpCircle, Shield } from 'lucide-react';
import Image from 'next/image';
import type { DeployedCharacter } from '@/lib/game/types';
import { cn } from '@/lib/utils';

interface CharacterSlotProps {
  character: DeployedCharacter;
  isOwn: boolean;
  isSelectable: boolean;
  onClick?: () => void;
}

export function CharacterSlot({ character, isOwn, isSelectable, onClick }: CharacterSlotProps) {
  const t = useTranslations('Play');
  const locale = useLocale();
  const name = locale === 'fr' ? character.card.nameFr : character.card.nameEn;
  const displayName = name.split(' \u2014 ')[0];
  const totalPower = character.card.power + character.powerTokens;
  const imageUrl = character.card.imageUrl;

  if (character.hidden && !isOwn) {
    // Opponent's hidden card — show card back
    return (
      <button
        type="button"
        onClick={isSelectable ? onClick : undefined}
        disabled={!isSelectable}
        className={cn(
          'relative flex h-20 w-[58px] flex-col items-center justify-center overflow-hidden rounded-lg border-2 sm:h-24 sm:w-[68px]',
          'bg-gradient-to-br from-gray-700 to-gray-900 text-gray-400',
          isSelectable && 'cursor-pointer ring-2 ring-primary/50 hover:ring-primary',
          !isSelectable && 'cursor-default'
        )}
        title={t('game.hidden')}
      >
        <HelpCircle className="h-5 w-5" />
        <span className="mt-0.5 text-[9px] font-medium">{t('game.hidden')}</span>
      </button>
    );
  }

  if (character.hidden && isOwn) {
    // Player's hidden card — show dimmed card image
    return (
      <button
        type="button"
        onClick={isSelectable ? onClick : undefined}
        disabled={!isSelectable}
        className={cn(
          'relative flex h-20 w-[58px] flex-col items-center justify-center overflow-hidden rounded-lg border-2 sm:h-24 sm:w-[68px]',
          'border-dashed border-gray-500 bg-gray-800/50',
          isSelectable && 'cursor-pointer ring-2 ring-amber-500/50 hover:ring-amber-500',
          !isSelectable && 'cursor-default'
        )}
        title={name}
      >
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={displayName}
            fill
            sizes="68px"
            className="object-cover opacity-20"
          />
        )}
        <div className="relative z-10 flex flex-col items-center">
          <span className="max-w-full truncate px-0.5 text-[9px] font-medium text-gray-300 sm:text-[10px]">
            {displayName}
          </span>
          <HelpCircle className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-[9px] text-gray-500">{t('game.hidden')}</span>
        </div>
      </button>
    );
  }

  // Visible character — show card image with power overlay
  return (
    <button
      type="button"
      onClick={isSelectable ? onClick : undefined}
      disabled={!isSelectable}
      className={cn(
        'relative flex h-20 w-[58px] overflow-hidden rounded-lg border-2 sm:h-24 sm:w-[68px] animate-card-play',
        isOwn
          ? 'border-blue-500/60'
          : 'border-red-500/60',
        isSelectable && 'cursor-pointer ring-2 ring-primary/50 hover:ring-primary',
        !isSelectable && 'cursor-default'
      )}
      title={name}
    >
      {/* Card image */}
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={displayName}
          fill
          sizes="68px"
          className="object-cover"
        />
      ) : (
        <div className={cn(
          'flex h-full w-full items-center justify-center text-[8px] font-medium',
          isOwn ? 'bg-blue-500/10 text-blue-300' : 'bg-red-500/10 text-red-300'
        )}>
          {displayName}
        </div>
      )}

      {/* Dark gradient overlay at bottom for readability */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent px-1 pb-0.5 pt-3">
        {/* Name */}
        <p className="truncate text-[8px] font-semibold leading-tight text-white sm:text-[9px]">
          {displayName}
        </p>
        {/* Power badge */}
        <div className="flex items-center gap-0.5">
          <Shield className="h-2.5 w-2.5 text-amber-400" />
          <span className={cn(
            'text-[11px] font-bold',
            character.powerTokens > 0 ? 'text-green-400' : 'text-amber-400'
          )}>
            {totalPower}
          </span>
        </div>
      </div>

      {/* Side indicator strip */}
      <div className={cn(
        'absolute inset-y-0 left-0 w-[3px]',
        isOwn ? 'bg-blue-500' : 'bg-red-500'
      )} />
    </button>
  );
}

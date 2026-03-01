'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Target } from 'lucide-react';
import { CharacterSlot } from './CharacterSlot';
import type { GameState, PendingEffect, DeployedCharacter } from '@/lib/game/types';
import { cn } from '@/lib/utils';

interface TargetSelectorProps {
  pendingEffect: PendingEffect;
  gameState: GameState;
  onSelectTarget: (instanceId: string) => void;
}

function findCharacter(state: GameState, instanceId: string): DeployedCharacter | null {
  for (const mission of state.missions) {
    for (const char of mission.playerCharacters) {
      if (char.instanceId === instanceId) return char;
    }
    for (const char of mission.opponentCharacters) {
      if (char.instanceId === instanceId) return char;
    }
  }
  // Check hand for discard effects
  for (const inst of state.player.hand) {
    if (inst.instanceId === instanceId) {
      return {
        instanceId: inst.instanceId,
        card: inst.card,
        hidden: false,
        powerTokens: 0,
        continuousEffects: [],
      };
    }
  }
  return null;
}

function isPlayerCharacter(state: GameState, instanceId: string): boolean {
  for (const mission of state.missions) {
    if (mission.playerCharacters.some((c) => c.instanceId === instanceId)) return true;
  }
  if (state.player.hand.some((c) => c.instanceId === instanceId)) return true;
  return false;
}

export function TargetSelector({ pendingEffect, gameState, onSelectTarget }: TargetSelectorProps) {
  const t = useTranslations('Play');
  const locale = useLocale();

  const isDestination = pendingEffect.step === 'SELECT_DESTINATION' || pendingEffect.step === 'SELECT_MISSION';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="target-selector">
      {/* Dramatic backdrop with radial vignette */}
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.08) 0%, transparent 60%)',
        }}
      />

      {/* Crosshair decorative lines */}
      <div className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-red-500/20 to-transparent" />
      <div className="absolute left-0 top-1/2 h-px w-full bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />

      <div className="relative w-full max-w-md animate-card-play rounded-xl border border-red-500/30 bg-card p-4 shadow-2xl sm:p-6"
        style={{
          boxShadow: '0 0 30px 4px rgba(239, 68, 68, 0.15), 0 0 60px 8px rgba(239, 68, 68, 0.05)',
        }}
      >
        {/* Top accent bar */}
        <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl bg-gradient-to-r from-transparent via-red-500 to-transparent" />

        {/* Header */}
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15">
            <Target className="h-4 w-4 text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-bold sm:text-lg">
              {isDestination ? t('game.selectDestination') : t('game.selectTarget')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {pendingEffect.description}
            </p>
          </div>
        </div>

        {/* Target Options */}
        <div className="flex flex-wrap gap-2">
          {isDestination
            ? /* MOVE step 2: show mission lane buttons */
              pendingEffect.validTargets.map((target) => {
                const mission = gameState.missions[target.missionIndex];
                if (!mission) return null;
                const rankKey = `game.mission${mission.rank}` as 'game.missionD' | 'game.missionC' | 'game.missionB' | 'game.missionA';

                return (
                  <button
                    key={target.instanceId}
                    type="button"
                    onClick={() => onSelectTarget(target.instanceId)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-4 py-3 transition-all',
                      'border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/15 hover:border-orange-500/50',
                      'hover:shadow-[0_0_12px_2px_rgba(249,115,22,0.2)]'
                    )}
                  >
                    <p className="text-sm font-medium text-orange-300">{t(rankKey)}</p>
                  </button>
                );
              })
            : /* Default: character selection */
              pendingEffect.validTargets.map((target) => {
                const character = findCharacter(gameState, target.instanceId);
                if (!character) return null;

                const isOwn = isPlayerCharacter(gameState, target.instanceId);
                const name = locale === 'fr' ? character.card.nameFr : character.card.nameEn;
                const borderColor = isOwn
                  ? 'border-orange-500/30 hover:border-orange-500/60 hover:shadow-[0_0_12px_2px_rgba(249,115,22,0.15)]'
                  : 'border-red-500/30 hover:border-red-500/60 hover:shadow-[0_0_12px_2px_rgba(239,68,68,0.15)]';

                return (
                  <button
                    key={target.instanceId}
                    type="button"
                    onClick={() => onSelectTarget(target.instanceId)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-2 transition-all',
                      borderColor,
                      isOwn ? 'bg-orange-500/5 hover:bg-orange-500/10' : 'bg-red-500/5 hover:bg-red-500/10'
                    )}
                  >
                    <CharacterSlot
                      character={character}
                      isOwn={isOwn}
                      isSelectable={false}
                    />
                    <div className="text-left">
                      <p className={cn(
                        'text-xs font-medium',
                        isOwn ? 'text-orange-200' : 'text-red-200'
                      )}>
                        {name}
                      </p>
                      {target.missionIndex >= 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          {t(`game.mission${gameState.missions[target.missionIndex]?.rank ?? 'D'}` as 'game.missionD')}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })
          }
        </div>
      </div>
    </div>
  );
}

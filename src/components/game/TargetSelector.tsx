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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-4 shadow-2xl sm:p-6">
        {/* Header */}
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold sm:text-lg">{t('game.selectTarget')}</h3>
        </div>

        {/* Description */}
        <p className="mb-4 text-sm text-muted-foreground">
          {pendingEffect.description}
        </p>

        {/* Target Options */}
        <div className="flex flex-wrap gap-2">
          {pendingEffect.step === 'SELECT_DESTINATION'
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
                      'flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 transition-colors hover:bg-primary/10'
                    )}
                  >
                    <p className="text-sm font-medium">{t(rankKey)}</p>
                  </button>
                );
              })
            : /* Default: character selection */
              pendingEffect.validTargets.map((target) => {
                const character = findCharacter(gameState, target.instanceId);
                if (!character) return null;

                const isOwn = isPlayerCharacter(gameState, target.instanceId);
                const name = locale === 'fr' ? character.card.nameFr : character.card.nameEn;

                return (
                  <button
                    key={target.instanceId}
                    type="button"
                    onClick={() => onSelectTarget(target.instanceId)}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 transition-colors hover:bg-primary/10'
                    )}
                  >
                    <CharacterSlot
                      character={character}
                      isOwn={isOwn}
                      isSelectable={false}
                    />
                    <div className="text-left">
                      <p className="text-xs font-medium">{name}</p>
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

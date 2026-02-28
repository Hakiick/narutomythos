// =============================================
// Effect Executor
// =============================================

import type {
  DeployedCharacter,
  GameState,
  PendingEffect,
  PlayerSide,
} from '../types';
import {
  drawCards,
  generateInstanceId,
  getCharacterBaseName,
  getMissionCharacters,
  getPlayerState,
  updateMissionCharacters,
  updatePlayerState,
} from '../utils';
import {
  EffectActionType,
  EffectTarget,
  EffectTiming,
  type EffectTrigger,
  type ParsedEffect,
} from './types';

/** Get valid targets for an effect based on its target type and filters. */
export function getValidTargets(
  state: GameState,
  effect: ParsedEffect,
  side: PlayerSide,
  missionIndex: number,
  sourceInstanceId: string
): { instanceId: string; missionIndex: number }[] {
  const targets: { instanceId: string; missionIndex: number }[] = [];

  const missionsToCheck = effect.targetFilter?.atMission
    ? [{ mission: state.missions[missionIndex], idx: missionIndex }]
    : state.missions.map((m, idx) => ({ mission: m, idx }));

  for (const { mission, idx } of missionsToCheck) {
    let characters: DeployedCharacter[] = [];

    switch (effect.target) {
      case EffectTarget.SELF:
        characters = getMissionCharacters(mission, side).filter(
          (c) => c.instanceId === sourceInstanceId
        );
        break;
      case EffectTarget.ANOTHER_FRIENDLY:
        characters = getMissionCharacters(mission, side).filter(
          (c) => c.instanceId !== sourceInstanceId
        );
        break;
      case EffectTarget.ALL_FRIENDLY:
        characters = getMissionCharacters(mission, side);
        break;
      case EffectTarget.ENEMY:
      case EffectTarget.ALL_ENEMY: {
        const oppositeSide: PlayerSide =
          side === 'player' ? 'opponent' : 'player';
        characters = getMissionCharacters(mission, oppositeSide);
        break;
      }
      case EffectTarget.ANY:
        characters = [
          ...getMissionCharacters(mission, 'player'),
          ...getMissionCharacters(mission, 'opponent'),
        ].filter((c) => c.instanceId !== sourceInstanceId);
        break;
    }

    // Apply filters
    if (effect.targetFilter) {
      const filter = effect.targetFilter;
      characters = characters.filter((c) => {
        if (filter.group && c.card.group !== filter.group) return false;
        if (filter.keyword && !c.card.keywords.includes(filter.keyword))
          return false;
        if (
          filter.powerMax !== undefined &&
          c.card.power + c.powerTokens > filter.powerMax
        )
          return false;
        return true;
      });
    }

    for (const char of characters) {
      targets.push({ instanceId: char.instanceId, missionIndex: idx });
    }
  }

  return targets;
}

/** Apply a single POWERUP effect to a target character. */
function applyPowerup(
  state: GameState,
  targetInstanceId: string,
  value: number
): GameState {
  const newMissions = state.missions.map((mission) => {
    const updateChars = (chars: DeployedCharacter[]) =>
      chars.map((c) =>
        c.instanceId === targetInstanceId
          ? { ...c, powerTokens: c.powerTokens + value }
          : c
      );
    return {
      ...mission,
      playerCharacters: updateChars(mission.playerCharacters),
      opponentCharacters: updateChars(mission.opponentCharacters),
    };
  });
  return { ...state, missions: newMissions };
}

/** Apply effects for a given trigger. */
export function applyEffects(
  state: GameState,
  effects: ParsedEffect[],
  trigger: EffectTrigger,
  sourceInstanceId: string,
  side: PlayerSide,
  missionIndex: number
): GameState {
  let currentState = state;

  const matchingEffects = effects.filter((e) => e.trigger === trigger);

  for (const effect of matchingEffects) {
    if (effect.action === EffectActionType.UNRESOLVED) {
      continue;
    }

    const validTargets = getValidTargets(
      currentState,
      effect,
      side,
      missionIndex,
      sourceInstanceId
    );

    switch (effect.action) {
      case EffectActionType.POWERUP: {
        if (effect.target === EffectTarget.SELF) {
          currentState = applyPowerup(
            currentState,
            sourceInstanceId,
            effect.value
          );
        } else if (
          effect.target === EffectTarget.ALL_FRIENDLY ||
          effect.target === EffectTarget.ALL_ENEMY
        ) {
          for (const target of validTargets) {
            currentState = applyPowerup(
              currentState,
              target.instanceId,
              effect.value
            );
          }
        } else if (validTargets.length === 1) {
          currentState = applyPowerup(
            currentState,
            validTargets[0].instanceId,
            effect.value
          );
        } else if (validTargets.length > 1) {
          // Need player choice
          currentState = {
            ...currentState,
            pendingEffect: {
              effectType: 'POWERUP',
              sourceInstanceId,
              side,
              validTargets,
              description: `Choose a target for Powerup ${effect.value}`,
              value: effect.value,
            },
          };
        }
        break;
      }

      case EffectActionType.POWER_BOOST: {
        if (effect.target === EffectTarget.SELF) {
          currentState = applyPowerup(
            currentState,
            sourceInstanceId,
            effect.value
          );
        } else {
          for (const target of validTargets) {
            currentState = applyPowerup(
              currentState,
              target.instanceId,
              effect.value
            );
          }
        }
        break;
      }

      case EffectActionType.GAIN_CHAKRA: {
        const playerState = getPlayerState(currentState, side);
        currentState = updatePlayerState(currentState, side, {
          chakra: playerState.chakra + effect.value,
        });
        break;
      }

      case EffectActionType.DRAW: {
        const ps = getPlayerState(currentState, side);
        const { hand, deck } = drawCards(ps, effect.value);
        currentState = updatePlayerState(currentState, side, { hand, deck });
        break;
      }

      case EffectActionType.DEFEAT: {
        if (validTargets.length === 1) {
          currentState = defeatCharacter(
            currentState,
            validTargets[0].instanceId,
            validTargets[0].missionIndex,
            side === 'player' ? 'opponent' : 'player'
          );
        } else if (validTargets.length > 1) {
          currentState = {
            ...currentState,
            pendingEffect: {
              effectType: 'DEFEAT',
              sourceInstanceId,
              side,
              validTargets,
              description: 'Choose a character to defeat',
              value: effect.value,
            },
          };
        }
        break;
      }

      case EffectActionType.HIDE: {
        if (validTargets.length === 1) {
          currentState = hideCharacter(
            currentState,
            validTargets[0].instanceId
          );
        } else if (validTargets.length > 1) {
          currentState = {
            ...currentState,
            pendingEffect: {
              effectType: 'HIDE',
              sourceInstanceId,
              side,
              validTargets,
              description: 'Choose a character to hide',
              value: effect.value,
            },
          };
        }
        break;
      }

      case EffectActionType.REMOVE_POWER: {
        if (validTargets.length === 1) {
          currentState = removePowerTokens(
            currentState,
            validTargets[0].instanceId,
            effect.value
          );
        } else if (validTargets.length > 1) {
          currentState = {
            ...currentState,
            pendingEffect: {
              effectType: 'REMOVE_POWER',
              sourceInstanceId,
              side,
              validTargets,
              description: `Choose a target to remove ${effect.value} power tokens`,
              value: effect.value,
            },
          };
        }
        break;
      }

      case EffectActionType.DISCARD: {
        // Auto-resolve: discard from top of hand if only one card
        const ps2 = getPlayerState(currentState, side);
        if (ps2.hand.length <= effect.value) {
          // Discard all
          currentState = updatePlayerState(currentState, side, {
            discardPile: [...ps2.discardPile, ...ps2.hand],
            hand: [],
          });
        } else {
          // Need player choice - set pending
          currentState = {
            ...currentState,
            pendingEffect: {
              effectType: 'DISCARD',
              sourceInstanceId,
              side,
              validTargets: ps2.hand.map((c) => ({
                instanceId: c.instanceId,
                missionIndex: -1,
              })),
              description: `Choose ${effect.value} card(s) to discard`,
              value: effect.value,
            },
          };
        }
        break;
      }

      case EffectActionType.MOVE: {
        // MOVE: let player choose a character to move, then a destination
        if (validTargets.length === 0) break;
        currentState = {
          ...currentState,
          pendingEffect: {
            effectType: 'MOVE',
            sourceInstanceId,
            side,
            validTargets,
            description: 'Choose a character to move',
            value: effect.value,
            step: 'SELECT_CHARACTER',
          },
        };
        break;
      }

      case EffectActionType.STEAL_CHAKRA: {
        const oppSide: PlayerSide = side === 'player' ? 'opponent' : 'player';
        const oppPs = getPlayerState(currentState, oppSide);
        const myPs = getPlayerState(currentState, side);
        const stealAmount = Math.min(effect.value, oppPs.chakra);
        currentState = updatePlayerState(currentState, side, {
          chakra: myPs.chakra + stealAmount,
        });
        currentState = updatePlayerState(currentState, oppSide, {
          chakra: oppPs.chakra - stealAmount,
        });
        break;
      }

      case EffectActionType.PAYING_LESS: {
        if (effect.timing === EffectTiming.CONTINUOUS) {
          // Attach as continuous effect to the source character
          const effectId = generateInstanceId();
          const newMissions = currentState.missions.map((mission) => {
            const updateChars = (chars: DeployedCharacter[]) =>
              chars.map((c) =>
                c.instanceId === sourceInstanceId
                  ? {
                      ...c,
                      continuousEffects: [
                        ...c.continuousEffects,
                        {
                          effectId,
                          sourceInstanceId,
                          type: 'PAYING_LESS',
                          value: effect.value,
                          condition: effect.targetFilter?.group,
                        },
                      ],
                    }
                  : c
              );
            return {
              ...mission,
              playerCharacters: updateChars(mission.playerCharacters),
              opponentCharacters: updateChars(mission.opponentCharacters),
            };
          });
          currentState = { ...currentState, missions: newMissions };
        }
        break;
      }

      case EffectActionType.PLAY_CHARACTER: {
        // Complex effect, mark as unresolved for now
        break;
      }
    }
  }

  return currentState;
}

/** Defeat a character: remove from mission and add to owner's discard pile. */
function defeatCharacter(
  state: GameState,
  targetInstanceId: string,
  missionIndex: number,
  targetSide: PlayerSide
): GameState {
  const mission = state.missions[missionIndex];
  const characters = getMissionCharacters(mission, targetSide);
  const target = characters.find((c) => c.instanceId === targetInstanceId);

  if (!target) return state;

  const remainingCharacters = characters.filter(
    (c) => c.instanceId !== targetInstanceId
  );
  const newMission = updateMissionCharacters(
    mission,
    targetSide,
    remainingCharacters
  );
  const newMissions = state.missions.map((m, idx) =>
    idx === missionIndex ? newMission : m
  );

  const targetPlayer = getPlayerState(state, targetSide);
  const discardedInstance = {
    instanceId: target.instanceId,
    card: target.card,
  };

  let newState: GameState = { ...state, missions: newMissions };
  newState = updatePlayerState(newState, targetSide, {
    discardPile: [...targetPlayer.discardPile, discardedInstance],
  });

  return newState;
}

/** Hide a character on the field. */
function hideCharacter(
  state: GameState,
  targetInstanceId: string
): GameState {
  const newMissions = state.missions.map((mission) => {
    const updateChars = (chars: DeployedCharacter[]) =>
      chars.map((c) =>
        c.instanceId === targetInstanceId ? { ...c, hidden: true } : c
      );
    return {
      ...mission,
      playerCharacters: updateChars(mission.playerCharacters),
      opponentCharacters: updateChars(mission.opponentCharacters),
    };
  });
  return { ...state, missions: newMissions };
}

/** Remove power tokens from a character. */
function removePowerTokens(
  state: GameState,
  targetInstanceId: string,
  value: number
): GameState {
  const newMissions = state.missions.map((mission) => {
    const updateChars = (chars: DeployedCharacter[]) =>
      chars.map((c) =>
        c.instanceId === targetInstanceId
          ? { ...c, powerTokens: Math.max(0, c.powerTokens - value) }
          : c
      );
    return {
      ...mission,
      playerCharacters: updateChars(mission.playerCharacters),
      opponentCharacters: updateChars(mission.opponentCharacters),
    };
  });
  return { ...state, missions: newMissions };
}

/** Resolve a pending effect by applying the chosen target. */
export function resolvePendingEffect(
  state: GameState,
  chosenTargetInstanceId: string
): GameState {
  const pending: PendingEffect | null = state.pendingEffect;
  if (!pending) return state;

  let newState: GameState = { ...state, pendingEffect: null as PendingEffect | null };

  switch (pending.effectType) {
    case 'POWERUP':
      newState = applyPowerup(newState, chosenTargetInstanceId, pending.value);
      break;
    case 'DEFEAT': {
      const targetInfo = pending.validTargets.find(
        (t) => t.instanceId === chosenTargetInstanceId
      );
      if (targetInfo) {
        const oppositeSide: PlayerSide =
          pending.side === 'player' ? 'opponent' : 'player';
        newState = defeatCharacter(
          newState,
          chosenTargetInstanceId,
          targetInfo.missionIndex,
          oppositeSide
        );
      }
      break;
    }
    case 'HIDE':
      newState = hideCharacter(newState, chosenTargetInstanceId);
      break;
    case 'REMOVE_POWER':
      newState = removePowerTokens(newState, chosenTargetInstanceId, pending.value);
      break;
    case 'DISCARD': {
      const ps = getPlayerState(newState, pending.side);
      const card = ps.hand.find(
        (c) => c.instanceId === chosenTargetInstanceId
      );
      if (card) {
        newState = updatePlayerState(newState, pending.side, {
          hand: ps.hand.filter(
            (c) => c.instanceId !== chosenTargetInstanceId
          ),
          discardPile: [...ps.discardPile, card],
        });
      }
      break;
    }
    case 'MOVE': {
      if (pending.step === 'SELECT_CHARACTER') {
        // Step 1: Player chose a character to move. Now find valid destination missions.
        const targetInfo = pending.validTargets.find(
          (t) => t.instanceId === chosenTargetInstanceId
        );
        if (!targetInfo) break;

        const charToMove = findCharacterInState(newState, chosenTargetInstanceId);
        if (!charToMove) break;

        const charBaseName = getCharacterBaseName(charToMove.card);
        const fromMissionIndex = targetInfo.missionIndex;

        // Build valid destination missions (exclude source, exclude missions with same-name char)
        const destTargets: { instanceId: string; missionIndex: number }[] = [];
        for (let i = 0; i < newState.missions.length; i++) {
          if (i === fromMissionIndex) continue;
          const mission = newState.missions[i];
          if (!mission.missionCard) continue;
          // Check if a character with the same base name already exists at destination
          const destChars = [
            ...mission.playerCharacters,
            ...mission.opponentCharacters,
          ];
          const hasSameName = destChars.some(
            (c) => getCharacterBaseName(c.card) === charBaseName
          );
          if (!hasSameName) {
            destTargets.push({ instanceId: `mission_${i}`, missionIndex: i });
          }
        }

        if (destTargets.length === 0) {
          // No valid destinations, cancel move
          break;
        } else if (destTargets.length === 1) {
          // Auto-resolve to the only destination
          newState = moveCharacter(
            newState,
            chosenTargetInstanceId,
            fromMissionIndex,
            destTargets[0].missionIndex
          );
        } else {
          // Need step 2: choose destination
          newState = {
            ...newState,
            pendingEffect: {
              effectType: 'MOVE',
              sourceInstanceId: pending.sourceInstanceId,
              side: pending.side,
              validTargets: destTargets,
              description: 'Choose a mission to move the character to',
              value: pending.value,
              step: 'SELECT_DESTINATION',
              moveData: {
                characterInstanceId: chosenTargetInstanceId,
                fromMissionIndex,
              },
            },
          };
        }
      } else if (pending.step === 'SELECT_DESTINATION' && pending.moveData) {
        // Step 2: Player chose destination mission
        const targetInfo = pending.validTargets.find(
          (t) => t.instanceId === chosenTargetInstanceId
        );
        if (targetInfo) {
          newState = moveCharacter(
            newState,
            pending.moveData.characterInstanceId,
            pending.moveData.fromMissionIndex,
            targetInfo.missionIndex
          );
        }
      }
      break;
    }
  }

  return newState;
}

/** Find a character across all missions. */
function findCharacterInState(
  state: GameState,
  instanceId: string
): DeployedCharacter | null {
  for (const mission of state.missions) {
    for (const char of mission.playerCharacters) {
      if (char.instanceId === instanceId) return char;
    }
    for (const char of mission.opponentCharacters) {
      if (char.instanceId === instanceId) return char;
    }
  }
  return null;
}

/** Move a character from one mission to another. */
function moveCharacter(
  state: GameState,
  characterInstanceId: string,
  fromMissionIndex: number,
  toMissionIndex: number
): GameState {
  const fromMission = state.missions[fromMissionIndex];

  // Find character in either side
  let charToMove: DeployedCharacter | null = null;
  let charSide: PlayerSide = 'player';

  const playerIdx = fromMission.playerCharacters.findIndex(
    (c) => c.instanceId === characterInstanceId
  );
  if (playerIdx >= 0) {
    charToMove = fromMission.playerCharacters[playerIdx];
    charSide = 'player';
  } else {
    const oppIdx = fromMission.opponentCharacters.findIndex(
      (c) => c.instanceId === characterInstanceId
    );
    if (oppIdx >= 0) {
      charToMove = fromMission.opponentCharacters[oppIdx];
      charSide = 'opponent';
    }
  }

  if (!charToMove) return state;

  // Remove from source, add to destination
  const newMissions = state.missions.map((mission, idx) => {
    if (idx === fromMissionIndex) {
      return updateMissionCharacters(
        mission,
        charSide,
        getMissionCharacters(mission, charSide).filter(
          (c) => c.instanceId !== characterInstanceId
        )
      );
    }
    if (idx === toMissionIndex) {
      return updateMissionCharacters(mission, charSide, [
        ...getMissionCharacters(mission, charSide),
        charToMove!,
      ]);
    }
    return mission;
  });

  return { ...state, missions: newMissions };
}

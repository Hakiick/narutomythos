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
  EffectTrigger,
  type EffectEvent,
  type ParsedEffect,
} from './types';
import { parseEffects } from './parser';

let effectEventCounter = 0;

/** Append an effect event to the state's effectLog. */
function appendEffectEvent(
  state: GameState,
  action: EffectActionType,
  value: number,
  sourceCard: { nameEn: string; nameFr: string },
  side: 'player' | 'opponent',
  missionIndex: number,
  targetCard?: { nameEn: string; nameFr: string } | null
): GameState {
  const event: EffectEvent = {
    id: `eff-${Date.now()}-${++effectEventCounter}`,
    timestamp: Date.now(),
    action,
    value,
    sourceCardNameEn: sourceCard.nameEn,
    sourceCardNameFr: sourceCard.nameFr,
    targetCardNameEn: targetCard?.nameEn,
    targetCardNameFr: targetCard?.nameFr,
    side,
    missionIndex,
  };
  return { ...state, effectLog: [...state.effectLog, event] };
}

/** Find a character's card data by instance ID across all missions. */
function findCardByInstanceId(
  state: GameState,
  instanceId: string
): { nameEn: string; nameFr: string } | null {
  for (const mission of state.missions) {
    for (const char of [...mission.playerCharacters, ...mission.opponentCharacters]) {
      if (char.instanceId === instanceId) {
        return { nameEn: char.card.nameEn, nameFr: char.card.nameFr };
      }
    }
  }
  return null;
}

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
        if (filter.costMax !== undefined && c.card.chakra > filter.costMax)
          return false;
        if (filter.hidden === true && !c.hidden) return false;
        return true;
      });

      // "Lowest cost" filter: keep only the character(s) with the lowest chakra cost
      if (filter.lowestCost && characters.length > 0) {
        const minCost = Math.min(...characters.map((c) => c.card.chakra));
        characters = characters.filter((c) => c.card.chakra === minCost);
      }
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

/** Compute variable X value based on game state. */
function computeVariableValue(
  state: GameState,
  variable: string,
  side: PlayerSide,
  missionIndex: number
): number {
  switch (variable) {
    case 'HIDDEN_COUNT': {
      // Number of friendly hidden characters at this mission
      const mission = state.missions[missionIndex];
      if (!mission) return 0;
      const chars = getMissionCharacters(mission, side);
      return chars.filter((c) => c.hidden).length;
    }
    case 'SOUND_FOUR_MISSIONS': {
      // Number of missions where you have at least one Sound Four character
      let count = 0;
      for (const mission of state.missions) {
        const chars = getMissionCharacters(mission, side);
        if (chars.some((c) => c.card.keywords.includes('Sound Four'))) {
          count++;
        }
      }
      return count;
    }
    default:
      return 0;
  }
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
  const sourceCard = findCardByInstanceId(currentState, sourceInstanceId);
  const srcInfo = sourceCard ?? { nameEn: 'Unknown', nameFr: 'Inconnu' };

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
        // Resolve variable value if needed
        const pValue = effect.value === -1 && effect.targetFilter?.variable
          ? computeVariableValue(currentState, effect.targetFilter.variable, side, missionIndex)
          : effect.value;
        if (pValue <= 0 && effect.value === -1) break; // Variable resolved to 0

        if (effect.target === EffectTarget.SELF) {
          currentState = applyPowerup(
            currentState,
            sourceInstanceId,
            pValue
          );
          currentState = appendEffectEvent(currentState, effect.action, pValue, srcInfo, side, missionIndex, srcInfo);
        } else if (
          effect.target === EffectTarget.ALL_FRIENDLY ||
          effect.target === EffectTarget.ALL_ENEMY
        ) {
          for (const target of validTargets) {
            const tgt = findCardByInstanceId(currentState, target.instanceId);
            currentState = applyPowerup(
              currentState,
              target.instanceId,
              pValue
            );
            currentState = appendEffectEvent(currentState, effect.action, pValue, srcInfo, side, missionIndex, tgt);
          }
        } else if (validTargets.length === 1) {
          const tgt = findCardByInstanceId(currentState, validTargets[0].instanceId);
          currentState = applyPowerup(
            currentState,
            validTargets[0].instanceId,
            pValue
          );
          currentState = appendEffectEvent(currentState, effect.action, pValue, srcInfo, side, missionIndex, tgt);
        } else if (validTargets.length > 1) {
          // Need player choice
          currentState = {
            ...currentState,
            pendingEffect: {
              effectType: 'POWERUP',
              sourceInstanceId,
              side,
              validTargets,
              description: `Choose a target for Powerup ${pValue}`,
              value: pValue,
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
          currentState = appendEffectEvent(currentState, effect.action, effect.value, srcInfo, side, missionIndex, srcInfo);
        } else {
          for (const target of validTargets) {
            const tgt = findCardByInstanceId(currentState, target.instanceId);
            currentState = applyPowerup(
              currentState,
              target.instanceId,
              effect.value
            );
            currentState = appendEffectEvent(currentState, effect.action, effect.value, srcInfo, side, missionIndex, tgt);
          }
        }
        break;
      }

      case EffectActionType.GAIN_CHAKRA: {
        const gcValue = effect.value === -1 && effect.targetFilter?.variable
          ? computeVariableValue(currentState, effect.targetFilter.variable, side, missionIndex)
          : effect.value;
        if (gcValue <= 0 && effect.value === -1) break;
        const playerState = getPlayerState(currentState, side);
        currentState = updatePlayerState(currentState, side, {
          chakra: playerState.chakra + gcValue,
        });
        currentState = appendEffectEvent(currentState, effect.action, gcValue, srcInfo, side, missionIndex);
        break;
      }

      case EffectActionType.DRAW: {
        const drawValue = effect.value === -1 && effect.targetFilter?.variable
          ? computeVariableValue(currentState, effect.targetFilter.variable, side, missionIndex)
          : effect.value;
        if (drawValue <= 0 && effect.value === -1) break;
        const ps = getPlayerState(currentState, side);
        const { hand, deck } = drawCards(ps, drawValue);
        currentState = updatePlayerState(currentState, side, { hand, deck });
        currentState = appendEffectEvent(currentState, effect.action, drawValue, srcInfo, side, missionIndex);
        break;
      }

      case EffectActionType.DEFEAT: {
        if (validTargets.length === 1) {
          const tgt = findCardByInstanceId(currentState, validTargets[0].instanceId);
          currentState = defeatCharacter(
            currentState,
            validTargets[0].instanceId,
            validTargets[0].missionIndex,
            side === 'player' ? 'opponent' : 'player'
          );
          currentState = appendEffectEvent(currentState, effect.action, effect.value, srcInfo, side, missionIndex, tgt);
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
          const tgt = findCardByInstanceId(currentState, validTargets[0].instanceId);
          currentState = hideCharacter(
            currentState,
            validTargets[0].instanceId
          );
          currentState = appendEffectEvent(currentState, effect.action, effect.value, srcInfo, side, missionIndex, tgt);
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
          const tgt = findCardByInstanceId(currentState, validTargets[0].instanceId);
          currentState = removePowerTokens(
            currentState,
            validTargets[0].instanceId,
            effect.value
          );
          currentState = appendEffectEvent(currentState, effect.action, effect.value, srcInfo, side, missionIndex, tgt);
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
          currentState = appendEffectEvent(currentState, effect.action, effect.value, srcInfo, side, missionIndex);
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
        currentState = appendEffectEvent(currentState, effect.action, stealAmount, srcInfo, side, missionIndex);
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
        // 2-step pending: choose character from hand, then choose mission
        const ps = getPlayerState(currentState, side);
        const playableChars = ps.hand.filter(
          (inst) => inst.card.type === 'CHARACTER'
        );
        if (playableChars.length > 0) {
          currentState = {
            ...currentState,
            pendingEffect: {
              effectType: 'PLAY_CHARACTER',
              sourceInstanceId,
              side,
              validTargets: playableChars.map((inst) => ({
                instanceId: inst.instanceId,
                missionIndex: -1,
              })),
              description: `Choose a character to play${effect.value > 0 ? ` (paying ${effect.value} less)` : ''}`,
              value: effect.value,
              step: 'SELECT_CHARACTER',
              playCharacterData: {
                cardInstanceId: '',
                costReduction: effect.value,
              },
            },
          };
        }
        break;
      }

      case EffectActionType.TAKE_CONTROL: {
        if (validTargets.length === 1) {
          const tgt = findCardByInstanceId(currentState, validTargets[0].instanceId);
          currentState = takeControlOfCharacter(
            currentState,
            validTargets[0].instanceId,
            validTargets[0].missionIndex,
            side
          );
          currentState = appendEffectEvent(currentState, effect.action, effect.value, srcInfo, side, missionIndex, tgt);
        } else if (validTargets.length > 1) {
          currentState = {
            ...currentState,
            pendingEffect: {
              effectType: 'TAKE_CONTROL',
              sourceInstanceId,
              side,
              validTargets,
              description: 'Choose an enemy character to take control of',
              value: effect.value,
            },
          };
        }
        break;
      }

      case EffectActionType.LOOK_AT: {
        const oppSide: PlayerSide = side === 'player' ? 'opponent' : 'player';
        const lower = effect.rawText.toLowerCase();
        if (lower.includes('hand')) {
          const oppPs = getPlayerState(currentState, oppSide);
          currentState = {
            ...currentState,
            revealedInfo: {
              type: 'hand',
              cards: oppPs.hand.map((inst) => inst.card),
              expiresAfterActions: 2,
            },
          };
        } else if (lower.includes('hidden')) {
          const hiddenCards: import('../types').GameCard[] = [];
          for (const mission of currentState.missions) {
            const chars = getMissionCharacters(mission, oppSide);
            for (const c of chars) {
              if (c.hidden) hiddenCards.push(c.card);
            }
          }
          currentState = {
            ...currentState,
            revealedInfo: {
              type: 'hidden',
              cards: hiddenCards,
              expiresAfterActions: 2,
            },
          };
        }
        currentState = appendEffectEvent(currentState, effect.action, effect.value, srcInfo, side, missionIndex);
        break;
      }

      case EffectActionType.PLACE_FROM_DECK: {
        const ps = getPlayerState(currentState, side);
        const cardsToPlace = ps.deck.slice(0, effect.value);
        const remainingDeck = ps.deck.slice(effect.value);
        currentState = updatePlayerState(currentState, side, {
          deck: remainingDeck,
        });

        // Deploy as hidden characters at the current mission
        const deployed: DeployedCharacter[] = cardsToPlace
          .filter((inst) => inst.card.type === 'CHARACTER')
          .map((inst) => ({
            instanceId: inst.instanceId,
            card: inst.card,
            hidden: true,
            powerTokens: 0,
            continuousEffects: [],
          }));

        if (deployed.length > 0) {
          const mission = currentState.missions[missionIndex];
          const currentChars = getMissionCharacters(mission, side);
          const newMission = updateMissionCharacters(mission, side, [
            ...currentChars,
            ...deployed,
          ]);
          const newMissions = currentState.missions.map((m, idx) =>
            idx === missionIndex ? newMission : m
          );
          currentState = { ...currentState, missions: newMissions };
        }

        // Non-character cards go to discard
        const nonChars = cardsToPlace.filter(
          (inst) => inst.card.type !== 'CHARACTER'
        );
        if (nonChars.length > 0) {
          const psUpdated = getPlayerState(currentState, side);
          currentState = updatePlayerState(currentState, side, {
            discardPile: [...psUpdated.discardPile, ...nonChars],
          });
        }

        currentState = appendEffectEvent(currentState, effect.action, deployed.length, srcInfo, side, missionIndex);
        break;
      }

      case EffectActionType.RETURN_TO_HAND: {
        if (effect.timing === EffectTiming.CONTINUOUS) {
          // Attach as continuous effect — will be resolved in executeEndPhase
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
                          type: 'RETURN_TO_HAND',
                          value: 1,
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

      case EffectActionType.COPY_EFFECT: {
        // Pending effect: choose an enemy character to copy from
        const oppSide2: PlayerSide = side === 'player' ? 'opponent' : 'player';
        const copyTargets: { instanceId: string; missionIndex: number }[] = [];
        for (let mIdx = 0; mIdx < currentState.missions.length; mIdx++) {
          const mission = currentState.missions[mIdx];
          const chars = getMissionCharacters(mission, oppSide2);
          for (const c of chars) {
            if (!c.hidden && c.card.effectEn) {
              const parsed = parseEffects(c.card.effectEn);
              const hasInstantNonUpgrade = parsed.some(
                (pe) =>
                  pe.timing === EffectTiming.INSTANT &&
                  pe.trigger !== EffectTrigger.UPGRADE &&
                  pe.action !== EffectActionType.UNRESOLVED
              );
              if (hasInstantNonUpgrade) {
                copyTargets.push({ instanceId: c.instanceId, missionIndex: mIdx });
              }
            }
          }
        }

        if (copyTargets.length === 1) {
          currentState = executeCopyEffect(
            currentState,
            copyTargets[0].instanceId,
            sourceInstanceId,
            side,
            missionIndex,
            srcInfo
          );
        } else if (copyTargets.length > 1) {
          currentState = {
            ...currentState,
            pendingEffect: {
              effectType: 'COPY_EFFECT',
              sourceInstanceId,
              side,
              validTargets: copyTargets,
              description: 'Choose an enemy character to copy an effect from',
              value: effect.value,
            },
          };
        }
        break;
      }

      // === NEW EFFECT TYPES ===

      case EffectActionType.DEFEAT_ALL: {
        // Defeat all matching targets (no player choice needed)
        const oppSideDA: PlayerSide = side === 'player' ? 'opponent' : 'player';
        for (const target of validTargets) {
          const tgt = findCardByInstanceId(currentState, target.instanceId);
          currentState = defeatCharacter(
            currentState,
            target.instanceId,
            target.missionIndex,
            oppSideDA
          );
          currentState = appendEffectEvent(currentState, EffectActionType.DEFEAT, 1, srcInfo, side, target.missionIndex, tgt);
        }
        break;
      }

      case EffectActionType.HIDE_ALL: {
        // Hide all matching targets
        for (const target of validTargets) {
          const tgt = findCardByInstanceId(currentState, target.instanceId);
          currentState = hideCharacter(currentState, target.instanceId);
          currentState = appendEffectEvent(currentState, EffectActionType.HIDE, 1, srcInfo, side, target.missionIndex, tgt);
        }
        break;
      }

      case EffectActionType.SET_POWER_ZERO: {
        // Set target character's power tokens to negative offset (simulating 0 power)
        if (validTargets.length === 1) {
          const target = validTargets[0];
          const tgt = findCardByInstanceId(currentState, target.instanceId);
          // Remove all power tokens and set negative tokens to offset base power
          currentState = setPowerToZero(currentState, target.instanceId);
          currentState = appendEffectEvent(currentState, effect.action, 0, srcInfo, side, missionIndex, tgt);
        } else if (validTargets.length > 1) {
          currentState = {
            ...currentState,
            pendingEffect: {
              effectType: 'SET_POWER_ZERO',
              sourceInstanceId,
              side,
              validTargets,
              description: 'Choose a character to set Power to 0',
              value: 0,
            },
          };
        }
        break;
      }

      case EffectActionType.REDUCE_POWER: {
        // Reduce a character's power by N (via negative power tokens)
        if (validTargets.length === 1) {
          const target = validTargets[0];
          const tgt = findCardByInstanceId(currentState, target.instanceId);
          currentState = applyPowerup(currentState, target.instanceId, -effect.value);
          currentState = appendEffectEvent(currentState, effect.action, effect.value, srcInfo, side, missionIndex, tgt);
        } else if (validTargets.length > 1) {
          currentState = {
            ...currentState,
            pendingEffect: {
              effectType: 'REDUCE_POWER',
              sourceInstanceId,
              side,
              validTargets,
              description: `Choose a character to reduce Power by ${effect.value}`,
              value: effect.value,
            },
          };
        }
        break;
      }

      case EffectActionType.OPPONENT_DRAW: {
        const oppSideOD: PlayerSide = side === 'player' ? 'opponent' : 'player';
        const oppPsOD = getPlayerState(currentState, oppSideOD);
        const { hand: odHand, deck: odDeck } = drawCards(oppPsOD, effect.value);
        currentState = updatePlayerState(currentState, oppSideOD, { hand: odHand, deck: odDeck });
        currentState = appendEffectEvent(currentState, effect.action, effect.value, srcInfo, side, missionIndex);
        break;
      }

      case EffectActionType.OPPONENT_GAIN_CHAKRA: {
        const oppSideOG: PlayerSide = side === 'player' ? 'opponent' : 'player';
        const oppPsOG = getPlayerState(currentState, oppSideOG);
        currentState = updatePlayerState(currentState, oppSideOG, {
          chakra: oppPsOG.chakra + effect.value,
        });
        currentState = appendEffectEvent(currentState, effect.action, effect.value, srcInfo, side, missionIndex);
        break;
      }

      case EffectActionType.OPPONENT_DISCARD: {
        const oppSideODis: PlayerSide = side === 'player' ? 'opponent' : 'player';
        const oppPsODis = getPlayerState(currentState, oppSideODis);
        if (oppPsODis.hand.length > 0) {
          if (oppPsODis.hand.length <= effect.value) {
            // Discard entire hand
            currentState = updatePlayerState(currentState, oppSideODis, {
              discardPile: [...oppPsODis.discardPile, ...oppPsODis.hand],
              hand: [],
            });
          } else {
            // AI/opponent auto-discards highest cost card; player would need pending
            if (oppSideODis === 'opponent') {
              // Auto-discard: remove highest cost card
              const sorted = [...oppPsODis.hand].sort((a, b) => b.card.chakra - a.card.chakra);
              const toDiscard = sorted.slice(0, effect.value);
              const remaining = oppPsODis.hand.filter((c) => !toDiscard.includes(c));
              currentState = updatePlayerState(currentState, oppSideODis, {
                hand: remaining,
                discardPile: [...oppPsODis.discardPile, ...toDiscard],
              });
            } else {
              // Player needs to choose — pending effect on opponent side
              currentState = {
                ...currentState,
                pendingEffect: {
                  effectType: 'DISCARD',
                  sourceInstanceId,
                  side: oppSideODis,
                  validTargets: oppPsODis.hand.map((c) => ({
                    instanceId: c.instanceId,
                    missionIndex: -1,
                  })),
                  description: `Choose ${effect.value} card(s) to discard`,
                  value: effect.value,
                },
              };
            }
          }
        }
        currentState = appendEffectEvent(currentState, effect.action, effect.value, srcInfo, side, missionIndex);
        break;
      }

      case EffectActionType.BOTH_DRAW: {
        // Both players draw
        const psBD = getPlayerState(currentState, 'player');
        const { hand: bdPlayerHand, deck: bdPlayerDeck } = drawCards(psBD, effect.value);
        currentState = updatePlayerState(currentState, 'player', { hand: bdPlayerHand, deck: bdPlayerDeck });

        const oppBD = getPlayerState(currentState, 'opponent');
        const { hand: bdOppHand, deck: bdOppDeck } = drawCards(oppBD, effect.value);
        currentState = updatePlayerState(currentState, 'opponent', { hand: bdOppHand, deck: bdOppDeck });

        currentState = appendEffectEvent(currentState, effect.action, effect.value, srcInfo, side, missionIndex);
        break;
      }

      case EffectActionType.RETAIN_POWER: {
        // Attach as continuous effect — prevents power token removal at end of round
        if (effect.timing === EffectTiming.CONTINUOUS) {
          const rpEffectId = generateInstanceId();
          const rpMissions = currentState.missions.map((mission) => {
            const updateChars = (chars: DeployedCharacter[]) =>
              chars.map((c) =>
                c.instanceId === sourceInstanceId
                  ? {
                      ...c,
                      continuousEffects: [
                        ...c.continuousEffects,
                        {
                          effectId: rpEffectId,
                          sourceInstanceId,
                          type: 'RETAIN_POWER',
                          value: 1,
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
          currentState = { ...currentState, missions: rpMissions };
        }
        break;
      }

      case EffectActionType.PROTECTION: {
        // Attach as continuous effect — prevents hiding/defeating by enemy effects
        if (effect.timing === EffectTiming.CONTINUOUS) {
          const protEffectId = generateInstanceId();
          const protTarget = effect.target === EffectTarget.ALL_FRIENDLY ? 'all' : 'self';
          const protMissions = currentState.missions.map((mission, mi) => {
            const updateChars = (chars: DeployedCharacter[]) =>
              chars.map((c) => {
                const isTarget =
                  protTarget === 'all'
                    ? mi === missionIndex // all friendly in this mission
                    : c.instanceId === sourceInstanceId; // self only
                if (!isTarget) return c;
                return {
                  ...c,
                  continuousEffects: [
                    ...c.continuousEffects,
                    {
                      effectId: protEffectId,
                      sourceInstanceId,
                      type: 'PROTECTION',
                      value: 1,
                    },
                  ],
                };
              });
            const sideChars = side === 'player' ? 'playerCharacters' : 'opponentCharacters';
            return { ...mission, [sideChars]: updateChars(mission[sideChars]) };
          });
          currentState = { ...currentState, missions: protMissions };
        }
        currentState = appendEffectEvent(currentState, effect.action, effect.value, srcInfo, side, missionIndex);
        break;
      }

      case EffectActionType.RESTRICT_MOVEMENT: {
        // Continuous effect — store as marker on the mission. For now, log only.
        currentState = appendEffectEvent(currentState, effect.action, effect.value, srcInfo, side, missionIndex);
        break;
      }

      case EffectActionType.COST_REDUCTION: {
        // Continuous aura — store on the source character as a continuous effect
        if (effect.timing === EffectTiming.CONTINUOUS) {
          const crEffectId = generateInstanceId();
          const crMissions = currentState.missions.map((mission) => {
            const updateChars = (chars: DeployedCharacter[]) =>
              chars.map((c) =>
                c.instanceId === sourceInstanceId
                  ? {
                      ...c,
                      continuousEffects: [
                        ...c.continuousEffects,
                        {
                          effectId: crEffectId,
                          sourceInstanceId,
                          type: 'COST_REDUCTION',
                          value: effect.value,
                          condition: effect.targetFilter?.keyword,
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
          currentState = { ...currentState, missions: crMissions };
        }
        currentState = appendEffectEvent(currentState, effect.action, effect.value, srcInfo, side, missionIndex);
        break;
      }

      case EffectActionType.PLAY_FROM_DISCARD: {
        // Play the top card of the discard pile (or chosen card) at a mission
        const psDisc = getPlayerState(currentState, side);
        if (psDisc.discardPile.length > 0) {
          const topDiscard = psDisc.discardPile[psDisc.discardPile.length - 1];
          if (topDiscard.card.type === 'CHARACTER') {
            // Set up pending to choose mission
            const baseName = getCharacterBaseName(topDiscard.card);
            const validDiscMissions: { instanceId: string; missionIndex: number }[] = [];
            for (let i = 0; i < currentState.missions.length; i++) {
              const mission = currentState.missions[i];
              if (!mission.missionCard) continue;
              const chars = getMissionCharacters(mission, side);
              const hasSameName = chars.some(
                (c) => getCharacterBaseName(c.card) === baseName
              );
              if (!hasSameName) {
                validDiscMissions.push({ instanceId: `mission_${i}`, missionIndex: i });
              }
            }

            if (validDiscMissions.length > 0) {
              currentState = {
                ...currentState,
                pendingEffect: {
                  effectType: 'PLAY_CHARACTER',
                  sourceInstanceId,
                  side,
                  validTargets: validDiscMissions,
                  description: `Choose a mission to deploy ${topDiscard.card.nameEn.split(' \u2014 ')[0]}`,
                  value: effect.value,
                  step: 'SELECT_MISSION',
                  playCharacterData: {
                    cardInstanceId: topDiscard.instanceId,
                    costReduction: effect.value,
                    fromDiscard: true,
                  },
                },
              };
            }
          }
        }
        break;
      }

      case EffectActionType.RETRIEVE_FROM_DISCARD: {
        // Move top character from discard pile to hand
        const psRet = getPlayerState(currentState, side);
        if (psRet.discardPile.length > 0) {
          const charCards = psRet.discardPile.filter((c) => c.card.type === 'CHARACTER');
          if (charCards.length > 0) {
            const toRetrieve = charCards[charCards.length - 1];
            currentState = updatePlayerState(currentState, side, {
              hand: [...psRet.hand, toRetrieve],
              discardPile: psRet.discardPile.filter((c) => c.instanceId !== toRetrieve.instanceId),
            });
            currentState = appendEffectEvent(currentState, effect.action, 1, srcInfo, side, missionIndex, {
              nameEn: toRetrieve.card.nameEn,
              nameFr: toRetrieve.card.nameFr,
            });
          }
        }
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

/** Set a character's effective power to 0 by setting negative power tokens. */
function setPowerToZero(
  state: GameState,
  targetInstanceId: string
): GameState {
  const newMissions = state.missions.map((mission) => {
    const updateChars = (chars: DeployedCharacter[]) =>
      chars.map((c) =>
        c.instanceId === targetInstanceId
          ? { ...c, powerTokens: -c.card.power } // Offset base power to 0
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

/** Transfer an enemy character to the current player's side at the same mission. */
function takeControlOfCharacter(
  state: GameState,
  targetInstanceId: string,
  missionIndex: number,
  newOwnerSide: PlayerSide
): GameState {
  const oppSide: PlayerSide = newOwnerSide === 'player' ? 'opponent' : 'player';
  const mission = state.missions[missionIndex];
  const oppChars = getMissionCharacters(mission, oppSide);
  const target = oppChars.find((c) => c.instanceId === targetInstanceId);
  if (!target) return state;

  const remainingOpp = oppChars.filter((c) => c.instanceId !== targetInstanceId);
  const myChars = getMissionCharacters(mission, newOwnerSide);

  let newMission = updateMissionCharacters(mission, oppSide, remainingOpp);
  newMission = updateMissionCharacters(newMission, newOwnerSide, [
    ...myChars,
    { ...target, continuousEffects: [] },
  ]);

  const newMissions = state.missions.map((m, idx) =>
    idx === missionIndex ? newMission : m
  );
  return { ...state, missions: newMissions };
}

/** Copy the first instant non-upgrade effect from a target character. */
function executeCopyEffect(
  state: GameState,
  copyFromInstanceId: string,
  sourceInstanceId: string,
  side: PlayerSide,
  missionIndex: number,
  srcInfo: { nameEn: string; nameFr: string }
): GameState {
  const copyFrom = findCharacterInState(state, copyFromInstanceId);
  if (!copyFrom || !copyFrom.card.effectEn) return state;

  const parsed = parseEffects(copyFrom.card.effectEn);
  const instantEffect = parsed.find(
    (pe) =>
      pe.timing === EffectTiming.INSTANT &&
      pe.trigger !== EffectTrigger.UPGRADE &&
      pe.action !== EffectActionType.UNRESOLVED
  );
  if (!instantEffect) return state;

  let newState = appendEffectEvent(
    state,
    EffectActionType.COPY_EFFECT,
    1,
    srcInfo,
    side,
    missionIndex,
    { nameEn: copyFrom.card.nameEn, nameFr: copyFrom.card.nameFr }
  );

  // Apply the copied effect
  newState = applyEffects(
    newState,
    [instantEffect],
    instantEffect.trigger,
    sourceInstanceId,
    side,
    missionIndex
  );

  return newState;
}

/** Resolve a pending effect by applying the chosen target. */
export function resolvePendingEffect(
  state: GameState,
  chosenTargetInstanceId: string
): GameState {
  const pending: PendingEffect | null = state.pendingEffect;
  if (!pending) return state;

  let newState: GameState = { ...state, pendingEffect: null as PendingEffect | null };

  const srcCard = findCardByInstanceId(newState, pending.sourceInstanceId);
  const srcInfo = srcCard ?? { nameEn: 'Unknown', nameFr: 'Inconnu' };

  switch (pending.effectType) {
    case 'POWERUP': {
      const tgt = findCardByInstanceId(newState, chosenTargetInstanceId);
      newState = applyPowerup(newState, chosenTargetInstanceId, pending.value);
      newState = appendEffectEvent(newState, EffectActionType.POWERUP, pending.value, srcInfo, pending.side, 0, tgt);
      break;
    }
    case 'DEFEAT': {
      const targetInfo = pending.validTargets.find(
        (t) => t.instanceId === chosenTargetInstanceId
      );
      if (targetInfo) {
        const tgt = findCardByInstanceId(newState, chosenTargetInstanceId);
        const oppositeSide: PlayerSide =
          pending.side === 'player' ? 'opponent' : 'player';
        newState = defeatCharacter(
          newState,
          chosenTargetInstanceId,
          targetInfo.missionIndex,
          oppositeSide
        );
        newState = appendEffectEvent(newState, EffectActionType.DEFEAT, pending.value, srcInfo, pending.side, targetInfo.missionIndex, tgt);
      }
      break;
    }
    case 'HIDE': {
      const tgt = findCardByInstanceId(newState, chosenTargetInstanceId);
      newState = hideCharacter(newState, chosenTargetInstanceId);
      newState = appendEffectEvent(newState, EffectActionType.HIDE, pending.value, srcInfo, pending.side, 0, tgt);
      break;
    }
    case 'REMOVE_POWER': {
      const tgt = findCardByInstanceId(newState, chosenTargetInstanceId);
      newState = removePowerTokens(newState, chosenTargetInstanceId, pending.value);
      newState = appendEffectEvent(newState, EffectActionType.REMOVE_POWER, pending.value, srcInfo, pending.side, 0, tgt);
      break;
    }
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
        newState = appendEffectEvent(newState, EffectActionType.DISCARD, pending.value, srcInfo, pending.side, -1);
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
          const moveTgt = findCardByInstanceId(newState, chosenTargetInstanceId);
          newState = moveCharacter(
            newState,
            chosenTargetInstanceId,
            fromMissionIndex,
            destTargets[0].missionIndex
          );
          newState = appendEffectEvent(newState, EffectActionType.MOVE, 1, srcInfo, pending.side, destTargets[0].missionIndex, moveTgt);
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
          const moveTgt = findCardByInstanceId(newState, pending.moveData.characterInstanceId);
          newState = moveCharacter(
            newState,
            pending.moveData.characterInstanceId,
            pending.moveData.fromMissionIndex,
            targetInfo.missionIndex
          );
          newState = appendEffectEvent(newState, EffectActionType.MOVE, 1, srcInfo, pending.side, targetInfo.missionIndex, moveTgt);
        }
      }
      break;
    }
    case 'TAKE_CONTROL': {
      const targetInfo = pending.validTargets.find(
        (t) => t.instanceId === chosenTargetInstanceId
      );
      if (targetInfo) {
        const tgt = findCardByInstanceId(newState, chosenTargetInstanceId);
        newState = takeControlOfCharacter(
          newState,
          chosenTargetInstanceId,
          targetInfo.missionIndex,
          pending.side
        );
        newState = appendEffectEvent(newState, EffectActionType.TAKE_CONTROL, pending.value, srcInfo, pending.side, targetInfo.missionIndex, tgt);
      }
      break;
    }
    case 'PLAY_CHARACTER': {
      if (pending.step === 'SELECT_CHARACTER') {
        // Step 1: Player chose a character from hand. Now choose mission.
        const ps = getPlayerState(newState, pending.side);
        const cardInstance = ps.hand.find(
          (c) => c.instanceId === chosenTargetInstanceId
        );
        if (!cardInstance) break;

        const baseName = getCharacterBaseName(cardInstance.card);
        const validMissions: { instanceId: string; missionIndex: number }[] = [];
        for (let i = 0; i < newState.missions.length; i++) {
          const mission = newState.missions[i];
          if (!mission.missionCard) continue;
          const chars = pending.side === 'player'
            ? mission.playerCharacters
            : mission.opponentCharacters;
          const hasSameName = chars.some(
            (c) => getCharacterBaseName(c.card) === baseName
          );
          if (!hasSameName) {
            validMissions.push({ instanceId: `mission_${i}`, missionIndex: i });
          }
        }

        if (validMissions.length === 0) break;

        const isFromDiscard = pending.playCharacterData?.fromDiscard;
        if (validMissions.length === 1) {
          // Auto-resolve: deploy at the only valid mission
          newState = deployCharacterFromEffect(
            newState,
            pending.side,
            chosenTargetInstanceId,
            validMissions[0].missionIndex,
            pending.playCharacterData?.costReduction ?? 0,
            srcInfo,
            isFromDiscard
          );
        } else {
          // Step 2: choose mission
          newState = {
            ...newState,
            pendingEffect: {
              effectType: 'PLAY_CHARACTER',
              sourceInstanceId: pending.sourceInstanceId,
              side: pending.side,
              validTargets: validMissions,
              description: 'Choose a mission to deploy the character',
              value: pending.value,
              step: 'SELECT_MISSION',
              playCharacterData: {
                cardInstanceId: chosenTargetInstanceId,
                costReduction: pending.playCharacterData?.costReduction ?? 0,
                fromDiscard: isFromDiscard,
              },
            },
          };
        }
      } else if (pending.step === 'SELECT_MISSION' && pending.playCharacterData) {
        // Step 2: Player chose a mission
        const targetInfo = pending.validTargets.find(
          (t) => t.instanceId === chosenTargetInstanceId
        );
        if (targetInfo) {
          newState = deployCharacterFromEffect(
            newState,
            pending.side,
            pending.playCharacterData.cardInstanceId,
            targetInfo.missionIndex,
            pending.playCharacterData.costReduction,
            srcInfo,
            pending.playCharacterData.fromDiscard
          );
        }
      }
      break;
    }
    case 'COPY_EFFECT': {
      newState = executeCopyEffect(
        newState,
        chosenTargetInstanceId,
        pending.sourceInstanceId,
        pending.side,
        0,
        srcInfo
      );
      break;
    }
    case 'SET_POWER_ZERO': {
      const tgtSPZ = findCardByInstanceId(newState, chosenTargetInstanceId);
      newState = setPowerToZero(newState, chosenTargetInstanceId);
      newState = appendEffectEvent(newState, EffectActionType.SET_POWER_ZERO, 0, srcInfo, pending.side, 0, tgtSPZ);
      break;
    }
    case 'REDUCE_POWER': {
      const tgtRP = findCardByInstanceId(newState, chosenTargetInstanceId);
      newState = applyPowerup(newState, chosenTargetInstanceId, -pending.value);
      newState = appendEffectEvent(newState, EffectActionType.REDUCE_POWER, pending.value, srcInfo, pending.side, 0, tgtRP);
      break;
    }
  }

  return newState;
}

/** Deploy a character from hand or discard via effect (PLAY_CHARACTER). */
function deployCharacterFromEffect(
  state: GameState,
  side: PlayerSide,
  cardInstanceId: string,
  missionIndex: number,
  costReduction: number,
  srcInfo: { nameEn: string; nameFr: string },
  fromDiscard?: boolean
): GameState {
  const ps = getPlayerState(state, side);
  const cardInstance = fromDiscard
    ? ps.discardPile.find((c) => c.instanceId === cardInstanceId)
    : ps.hand.find((c) => c.instanceId === cardInstanceId);
  if (!cardInstance) return state;

  const actualCost = Math.max(0, cardInstance.card.chakra - costReduction);
  if (ps.chakra < actualCost) return state;

  // Remove from hand/discard, deduct chakra
  let newState: GameState;
  if (fromDiscard) {
    newState = updatePlayerState(state, side, {
      discardPile: ps.discardPile.filter((c) => c.instanceId !== cardInstanceId),
      chakra: ps.chakra - actualCost,
    });
  } else {
    newState = updatePlayerState(state, side, {
      hand: ps.hand.filter((c) => c.instanceId !== cardInstanceId),
      chakra: ps.chakra - actualCost,
    });
  }

  // Deploy at mission
  const deployed: DeployedCharacter = {
    instanceId: cardInstance.instanceId,
    card: cardInstance.card,
    hidden: false,
    powerTokens: 0,
    continuousEffects: [],
  };

  const mission = newState.missions[missionIndex];
  const currentChars = getMissionCharacters(mission, side);
  const newMission = updateMissionCharacters(mission, side, [
    ...currentChars,
    deployed,
  ]);
  const newMissions = newState.missions.map((m, idx) =>
    idx === missionIndex ? newMission : m
  );
  newState = { ...newState, missions: newMissions };
  newState = appendEffectEvent(newState, EffectActionType.PLAY_CHARACTER, 1, srcInfo, side, missionIndex, {
    nameEn: cardInstance.card.nameEn,
    nameFr: cardInstance.card.nameFr,
  });

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

// =============================================
// AI Opponent Engine
// =============================================

import { getAvailableActions } from '../engine';
import {
  GameActionType,
  type AvailableAction,
  type GameAction,
  type GameState,
  type PendingEffect,
} from '../types';
import {
  calculateMissionPower,
  getMissionCharacters,
  getMissionRankForRound,
  getPlayerState,
} from '../utils';

export interface AIDecision {
  action: GameAction;
  reasoning: string;
}

/** Score an action based on heuristics. Higher is better. */
function scoreAction(
  state: GameState,
  availableAction: AvailableAction
): { score: number; missionIndex: number; targetInstanceId?: string; reasoning: string } {
  const side = state.turn;
  const ps = getPlayerState(state, side);
  const currentRoundRank = getMissionRankForRound(state.round);
  const currentRoundMissionIndex = state.missions.findIndex(
    (m) => m.rank === currentRoundRank
  );

  switch (availableAction.type) {
    case GameActionType.PLAY_CHARACTER: {
      const inst = ps.hand.find(
        (h) => h.instanceId === availableAction.cardInstanceId
      );
      if (!inst) return { score: 0, missionIndex: 0, reasoning: 'Card not found' };

      const card = inst.card;
      const powerPerChakra = card.chakra > 0 ? card.power / card.chakra : card.power;
      let baseScore = 50 + powerPerChakra * 10;

      // Prefer playing at the current round's mission
      let bestMission = availableAction.validMissions?.[0] ?? 0;
      if (
        availableAction.validMissions &&
        availableAction.validMissions.includes(currentRoundMissionIndex)
      ) {
        bestMission = currentRoundMissionIndex;
        baseScore += 15;
      }

      // Prefer cards that help contest or win a mission
      const mission = state.missions[bestMission];
      if (mission) {
        const myPower = calculateMissionPower(getMissionCharacters(mission, side), mission.missionCard);
        const oppPower = calculateMissionPower(
          getMissionCharacters(mission, side === 'player' ? 'opponent' : 'player'), mission.missionCard
        );
        if (oppPower > myPower) {
          // Behind at this mission, playing is more valuable
          baseScore += 10;
        }
      }

      // Prefer lower cost characters when chakra is low
      if (ps.chakra <= 3) {
        baseScore -= card.chakra * 3;
      }

      return {
        score: baseScore,
        missionIndex: bestMission,
        reasoning: `Play ${card.nameEn} at mission ${bestMission} (power/chakra ratio: ${powerPerChakra.toFixed(1)})`,
      };
    }

    case GameActionType.PLAY_HIDDEN: {
      const inst = ps.hand.find(
        (h) => h.instanceId === availableAction.cardInstanceId
      );
      if (!inst) return { score: 0, missionIndex: 0, reasoning: 'Card not found' };

      const card = inst.card;
      let score = 20;

      // Prefer hidden if card has AMBUSH effect
      if (card.effectEn && card.effectEn.includes('AMBUSH')) {
        score += 30;
      }

      // Prefer hidden if low on chakra
      if (ps.chakra <= 2) {
        score += 10;
      }

      // Play at contested mission
      let bestMission = availableAction.validMissions?.[0] ?? 0;
      if (
        availableAction.validMissions &&
        availableAction.validMissions.includes(currentRoundMissionIndex)
      ) {
        bestMission = currentRoundMissionIndex;
        score += 5;
      }

      return {
        score,
        missionIndex: bestMission,
        reasoning: `Play ${card.nameEn} hidden at mission ${bestMission}`,
      };
    }

    case GameActionType.UPGRADE: {
      const inst = ps.hand.find(
        (h) => h.instanceId === availableAction.cardInstanceId
      );
      if (!inst) return { score: 0, missionIndex: 0, reasoning: 'Card not found' };

      const target = availableAction.upgradeTargets?.[0];
      if (!target) return { score: 0, missionIndex: 0, reasoning: 'No target' };

      const cost = availableAction.cost ?? 0;
      const powerGain = inst.card.power - (findCharPower(state, target.instanceId) ?? 0);

      let score = 40;
      if (powerGain >= 2 && cost <= 3) {
        score += powerGain * 10;
      }

      // Check if upgrade would win a contested mission
      const mission = state.missions[target.missionIndex];
      if (mission) {
        const oppSide = side === 'player' ? 'opponent' : 'player';
        const myPower = calculateMissionPower(getMissionCharacters(mission, side), mission.missionCard);
        const oppPower = calculateMissionPower(getMissionCharacters(mission, oppSide), mission.missionCard);
        if (myPower + powerGain > oppPower && myPower <= oppPower) {
          score += 25;
        }
      }

      return {
        score,
        missionIndex: target.missionIndex,
        targetInstanceId: target.instanceId,
        reasoning: `Upgrade to ${inst.card.nameEn} (power gain: ${powerGain}, cost: ${cost})`,
      };
    }

    case GameActionType.REVEAL: {
      const missionIndex = availableAction.validMissions?.[0] ?? 0;
      let score = 35;

      // Check if revealing would help win a mission
      const mission = state.missions[missionIndex];
      if (mission && availableAction.cardInstanceId) {
        const charPower = findCharCardPower(state, availableAction.cardInstanceId);
        const oppSide = side === 'player' ? 'opponent' : 'player';
        const myPower = calculateMissionPower(getMissionCharacters(mission, side), mission.missionCard);
        const oppPower = calculateMissionPower(getMissionCharacters(mission, oppSide), mission.missionCard);
        if (myPower + charPower > oppPower && myPower <= oppPower) {
          score += 30;
        }
      }

      return {
        score,
        missionIndex,
        reasoning: `Reveal hidden character at mission ${missionIndex}`,
      };
    }

    case GameActionType.PLAY_JUTSU: {
      const inst = ps.hand.find(
        (h) => h.instanceId === availableAction.cardInstanceId
      );
      if (!inst) return { score: 0, missionIndex: 0, reasoning: 'Card not found' };

      let score = 60;
      const targets = availableAction.jutsuTargets ?? [];
      let bestTarget = targets[0];

      // Pick target at the most contested mission
      let bestContestedness = -Infinity;
      for (const target of targets) {
        const mission = state.missions[target.missionIndex];
        if (!mission) continue;
        const oppSide = side === 'player' ? 'opponent' : 'player';
        const myPower = calculateMissionPower(getMissionCharacters(mission, side), mission.missionCard);
        const oppPower = calculateMissionPower(getMissionCharacters(mission, oppSide), mission.missionCard);
        const contestedness = oppPower - myPower;
        if (contestedness > bestContestedness) {
          bestContestedness = contestedness;
          bestTarget = target;
        }
      }

      if (bestContestedness > 0) score += 15;

      return {
        score,
        missionIndex: bestTarget?.missionIndex ?? 0,
        targetInstanceId: bestTarget?.instanceId,
        reasoning: `Play Jutsu ${inst.card.nameEn} on target`,
      };
    }

    case GameActionType.PASS: {
      let score = 10;

      // Check if we're winning all active missions
      let winningAll = true;
      for (const mission of state.missions) {
        if (!mission.missionCard || mission.resolved) continue;
        const oppSide = side === 'player' ? 'opponent' : 'player';
        const myPower = calculateMissionPower(getMissionCharacters(mission, side), mission.missionCard);
        const oppPower = calculateMissionPower(getMissionCharacters(mission, oppSide), mission.missionCard);
        if (myPower <= oppPower) {
          winningAll = false;
          break;
        }
      }
      if (winningAll) {
        score += 30;
      }

      // If hand is empty of playable characters, pass is fine
      const playableActions = [
        GameActionType.PLAY_CHARACTER,
        GameActionType.PLAY_HIDDEN,
        GameActionType.UPGRADE,
        GameActionType.REVEAL,
      ];
      const hasOtherActions = getAvailableActions(state).some(
        (a) => playableActions.includes(a.type)
      );
      if (!hasOtherActions) {
        score += 50;
      }

      return { score, missionIndex: 0, reasoning: 'Pass' };
    }

    default:
      return { score: 0, missionIndex: 0, reasoning: 'Unknown action' };
  }
}

/** Find the base power of a deployed character by instanceId. */
function findCharPower(state: GameState, instanceId: string): number | null {
  for (const mission of state.missions) {
    for (const char of [...mission.playerCharacters, ...mission.opponentCharacters]) {
      if (char.instanceId === instanceId) {
        return char.card.power;
      }
    }
  }
  return null;
}

/** Find the card power of a deployed character by instanceId. */
function findCharCardPower(state: GameState, instanceId: string): number {
  for (const mission of state.missions) {
    for (const char of [...mission.playerCharacters, ...mission.opponentCharacters]) {
      if (char.instanceId === instanceId) {
        return char.card.power + char.powerTokens;
      }
    }
  }
  return 0;
}

/** Decide the best AI action using heuristics. */
export function decideAIAction(state: GameState): AIDecision {
  const availableActions = getAvailableActions(state);

  if (availableActions.length === 0) {
    return {
      action: {
        type: GameActionType.PASS,
        side: state.turn,
        timestamp: Date.now(),
      },
      reasoning: 'No actions available',
    };
  }

  // Score all actions
  const scoredActions = availableActions.map((aa) => ({
    available: aa,
    ...scoreAction(state, aa),
  }));

  // Sort by score descending
  scoredActions.sort((a, b) => b.score - a.score);

  const best = scoredActions[0];

  // Build the action
  const action: GameAction = {
    type: best.available.type,
    side: state.turn,
    data: {
      cardInstanceId: best.available.cardInstanceId,
      missionIndex: best.missionIndex,
      targetInstanceId: best.targetInstanceId,
      description: best.reasoning,
    },
    timestamp: Date.now(),
  };

  return {
    action,
    reasoning: best.reasoning,
  };
}

/** Decide whether to mulligan. */
export function decideAIMulligan(state: GameState): boolean {
  const ps = getPlayerState(state, 'opponent');

  if (ps.hand.length === 0) return false;

  // Calculate average chakra cost
  const totalCost = ps.hand.reduce((sum, inst) => sum + inst.card.chakra, 0);
  const avgCost = totalCost / ps.hand.length;

  // Mulligan if average cost is too high
  if (avgCost > 3) return true;

  // Count low-cost characters (cost <= 3)
  const lowCostChars = ps.hand.filter(
    (inst) => inst.card.type === 'CHARACTER' && inst.card.chakra <= 3
  );

  // Keep if we have at least 2 affordable characters
  if (lowCostChars.length >= 2) return false;

  return true;
}

/** Decide which target to pick for a pending effect. */
export function decideAITarget(
  state: GameState,
  pendingEffect: PendingEffect
): string {
  const targets = pendingEffect.validTargets;
  if (targets.length === 0) return '';
  if (targets.length === 1) return targets[0].instanceId;

  const side = pendingEffect.side;

  switch (pendingEffect.effectType) {
    case 'POWERUP': {
      // Pick the friendly character with the lowest power (to balance)
      let bestTarget = targets[0];
      let lowestPower = Infinity;
      for (const target of targets) {
        const power = findCharCardPower(state, target.instanceId);
        if (power < lowestPower) {
          lowestPower = power;
          bestTarget = target;
        }
      }
      return bestTarget.instanceId;
    }

    case 'DEFEAT': {
      // Pick the enemy character with the highest power
      let bestTarget = targets[0];
      let highestPower = -Infinity;
      for (const target of targets) {
        const power = findCharCardPower(state, target.instanceId);
        if (power > highestPower) {
          highestPower = power;
          bestTarget = target;
        }
      }
      return bestTarget.instanceId;
    }

    case 'HIDE': {
      // Pick the enemy character with the highest power at mission
      let bestTarget = targets[0];
      let highestPower = -Infinity;
      for (const target of targets) {
        const power = findCharCardPower(state, target.instanceId);
        if (power > highestPower) {
          highestPower = power;
          bestTarget = target;
        }
      }
      return bestTarget.instanceId;
    }

    case 'DISCARD': {
      // Discard the highest cost card
      const ps = getPlayerState(state, side);
      let bestTarget = targets[0];
      let highestCost = -Infinity;
      for (const target of targets) {
        const card = ps.hand.find((h) => h.instanceId === target.instanceId);
        if (card && card.card.chakra > highestCost) {
          highestCost = card.card.chakra;
          bestTarget = target;
        }
      }
      return bestTarget.instanceId;
    }

    case 'REMOVE_POWER': {
      // Pick the enemy character with the highest total power
      let bestTarget = targets[0];
      let highestPower = -Infinity;
      for (const target of targets) {
        const power = findCharCardPower(state, target.instanceId);
        if (power > highestPower) {
          highestPower = power;
          bestTarget = target;
        }
      }
      return bestTarget.instanceId;
    }

    case 'MOVE': {
      if (pendingEffect.step === 'SELECT_CHARACTER') {
        // Pick highest power enemy char (to displace), or weakest friendly at losing mission
        let bestTarget = targets[0];
        let highestPower = -Infinity;
        for (const target of targets) {
          const power = findCharCardPower(state, target.instanceId);
          if (power > highestPower) {
            highestPower = power;
            bestTarget = target;
          }
        }
        return bestTarget.instanceId;
      }
      if (pendingEffect.step === 'SELECT_DESTINATION') {
        // Move to the most strategically valuable mission
        return targets[0].instanceId;
      }
      return targets[0].instanceId;
    }

    default:
      return targets[0].instanceId;
  }
}

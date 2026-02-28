// =============================================
// Naruto Mythos TCG Game Engine
// Pure functions: state in → state out
// =============================================

import {
  GameActionType,
  GamePhase,
  MissionRank,
  type AvailableAction,
  type DeployedCharacter,
  type GameAction,
  type GameCard,
  type GameCardInstance,
  type GameState,
  type MissionSlot,
  type PlayerSide,
  type PlayerState,
} from './types';
import {
  calculateMissionPower,
  countCharactersOnField,
  drawCards,
  getCharacterBaseName,
  getMissionCharacters,
  getMissionPointValue,
  getMissionRankForRound,
  getPlayerState,
  hasCharacterWithName,
  shuffle,
  toGameCardInstances,
  updateMissionCharacters,
  updatePlayerState,
} from './utils';
import { applyEffects } from './effects/executor';
import { parseEffects } from './effects/parser';
import { EffectTrigger } from './effects/types';

// =============================================
// Initialization
// =============================================

/** Create a fresh player state from a deck of cards and missions. */
function createPlayerState(
  deck: GameCard[],
  missions: GameCard[]
): PlayerState {
  const shuffledDeck = shuffle(deck);
  const instances = toGameCardInstances(shuffledDeck);

  // Select first 2 missions
  const selectedMissions = missions.slice(0, Math.min(2, missions.length));

  return {
    hand: [],
    deck: instances,
    discardPile: [],
    missionCards: missions,
    selectedMissions,
    chakra: 0,
    missionPoints: 0,
    edgeTokens: 0,
    hasPassed: false,
    hasEdge: false,
    mulliganDone: false,
  };
}

/** Build the 4 mission slots from players' selected missions. */
function buildMissionSlots(
  playerMissions: GameCard[],
  opponentMissions: GameCard[]
): { slots: MissionSlot[]; missionDeck: GameCard[] } {
  const allMissions = shuffle([...playerMissions, ...opponentMissions]);
  const ranks = [MissionRank.D, MissionRank.C, MissionRank.B, MissionRank.A];

  const slots: MissionSlot[] = ranks.map((rank) => ({
    rank,
    missionCard: null,
    playerCharacters: [],
    opponentCharacters: [],
    resolved: false,
    winner: null,
  }));

  return { slots, missionDeck: allMissions };
}

/** Initialize a new game. */
export function initializeGame(
  playerDeck: GameCard[],
  playerMissions: GameCard[],
  opponentDeck: GameCard[],
  opponentMissions: GameCard[]
): GameState {
  const player = createPlayerState(playerDeck, playerMissions);
  const opponent = createPlayerState(opponentDeck, opponentMissions);

  const { slots, missionDeck } = buildMissionSlots(
    player.selectedMissions,
    opponent.selectedMissions
  );

  // Random edge assignment
  const edgeToPlayer = Math.random() < 0.5;

  // Draw 5 cards each
  const playerDraw = drawCards(player, 5);
  const opponentDraw = drawCards(opponent, 5);

  const state: GameState = {
    phase: GamePhase.MULLIGAN,
    round: 1,
    turn: edgeToPlayer ? 'player' : 'opponent',
    missions: slots,
    player: {
      ...player,
      hand: playerDraw.hand,
      deck: playerDraw.deck,
      hasEdge: edgeToPlayer,
    },
    opponent: {
      ...opponent,
      hand: opponentDraw.hand,
      deck: opponentDraw.deck,
      hasEdge: !edgeToPlayer,
    },
    missionDeck,
    actionHistory: [],
    winner: null,
    consecutivePasses: 0,
    pendingEffect: null,
  };

  return state;
}

// =============================================
// Mulligan
// =============================================

/** Perform mulligan for a side: put hand back, reshuffle, draw 5. */
export function performMulligan(
  state: GameState,
  side: PlayerSide
): GameState {
  const ps = getPlayerState(state, side);

  // Put hand back into deck and reshuffle
  const newDeck = shuffle([...ps.deck, ...ps.hand]);
  const instances = toGameCardInstances(
    newDeck.map((inst) => inst.card)
  );

  // Draw 5
  const drawn = instances.slice(0, 5);
  const remaining = instances.slice(5);

  const action: GameAction = {
    type: GameActionType.MULLIGAN,
    side,
    data: { description: `${side} mulliganed` },
    timestamp: Date.now(),
  };

  let newState = updatePlayerState(state, side, {
    hand: drawn,
    deck: remaining,
    mulliganDone: true,
  });

  newState = {
    ...newState,
    actionHistory: [...newState.actionHistory, action],
  };

  return checkMulliganComplete(newState);
}

/** Keep hand as is, mark mulligan done. */
export function keepHand(state: GameState, side: PlayerSide): GameState {
  const action: GameAction = {
    type: GameActionType.KEEP_HAND,
    side,
    data: { description: `${side} kept hand` },
    timestamp: Date.now(),
  };

  let newState = updatePlayerState(state, side, { mulliganDone: true });
  newState = {
    ...newState,
    actionHistory: [...newState.actionHistory, action],
  };

  return checkMulliganComplete(newState);
}

/** Check if both players have completed mulligan, transition to START if so. */
function checkMulliganComplete(state: GameState): GameState {
  if (state.player.mulliganDone && state.opponent.mulliganDone) {
    return executeStartPhase(state);
  }
  return state;
}

// =============================================
// Start Phase
// =============================================

/** Execute the start phase for the current round. */
export function executeStartPhase(state: GameState): GameState {
  let newState = { ...state };

  // Reveal mission card for this round
  const rank = getMissionRankForRound(newState.round);
  const rankIndex = newState.missions.findIndex((m) => m.rank === rank);

  if (rankIndex >= 0 && newState.missionDeck.length > 0) {
    const [missionCard, ...remainingDeck] = newState.missionDeck;
    const newMissions = newState.missions.map((m, idx) =>
      idx === rankIndex ? { ...m, missionCard } : m
    );
    newState = { ...newState, missions: newMissions, missionDeck: remainingDeck };
  }

  // Calculate chakra: base 5 + 1 per character on field
  const playerCharsOnField = countCharactersOnField(
    newState.missions,
    'player'
  );
  const opponentCharsOnField = countCharactersOnField(
    newState.missions,
    'opponent'
  );

  let playerChakraBonus = 0;
  let opponentChakraBonus = 0;

  // Check revealed missions for Chakra bonus passives (e.g., "Chakra +1 for both players")
  for (const mission of newState.missions) {
    if (!mission.missionCard) continue;
    const effectText = mission.missionCard.effectEn;
    if (!effectText) continue;
    const chakraBonusMatch = effectText.match(
      /[Cc]hakra\s*\+(\d+)\s+for\s+both\s+players/
    );
    if (chakraBonusMatch) {
      const bonus = parseInt(chakraBonusMatch[1], 10);
      playerChakraBonus += bonus;
      opponentChakraBonus += bonus;
    }
  }

  newState = updatePlayerState(newState, 'player', {
    chakra: 5 + playerCharsOnField + playerChakraBonus,
    hasPassed: false,
  });
  newState = updatePlayerState(newState, 'opponent', {
    chakra: 5 + opponentCharsOnField + opponentChakraBonus,
    hasPassed: false,
  });

  // Draw cards: 0 on round 1 (already drew 5), 2 on rounds 2-4
  if (newState.round > 1) {
    const playerDraw = drawCards(
      getPlayerState(newState, 'player'),
      2
    );
    newState = updatePlayerState(newState, 'player', {
      hand: playerDraw.hand,
      deck: playerDraw.deck,
    });

    const opponentDraw = drawCards(
      getPlayerState(newState, 'opponent'),
      2
    );
    newState = updatePlayerState(newState, 'opponent', {
      hand: opponentDraw.hand,
      deck: opponentDraw.deck,
    });
  }

  // Set phase to ACTION, edge holder goes first
  const edgeHolder: PlayerSide = newState.player.hasEdge
    ? 'player'
    : 'opponent';

  newState = {
    ...newState,
    phase: GamePhase.ACTION,
    turn: edgeHolder,
    consecutivePasses: 0,
  };

  return newState;
}

// =============================================
// Available Actions
// =============================================

/** Calculate the cost reduction for a card from PAYING_LESS continuous effects. */
function getCostReduction(
  state: GameState,
  side: PlayerSide,
  card: GameCard
): number {
  let reduction = 0;
  for (const mission of state.missions) {
    const characters = getMissionCharacters(mission, side);
    for (const char of characters) {
      for (const ce of char.continuousEffects) {
        if (ce.type === 'PAYING_LESS') {
          // If no condition, applies to all; if condition is a group, check card's group
          if (!ce.condition || card.group === ce.condition) {
            reduction += ce.value;
          }
        }
      }
    }
  }
  return reduction;
}

/** Get all legal actions for the current turn player. */
export function getAvailableActions(state: GameState): AvailableAction[] {
  if (state.phase !== GamePhase.ACTION) return [];

  const side = state.turn;
  const ps = getPlayerState(state, side);
  const actions: AvailableAction[] = [];

  // Characters in hand
  const characterCards = ps.hand.filter((inst) => inst.card.type === 'CHARACTER');

  for (const inst of characterCards) {
    const baseName = getCharacterBaseName(inst.card);

    // PLAY_CHARACTER: face-up (apply cost reduction from PAYING_LESS)
    const costReduction = getCostReduction(state, side, inst.card);
    const effectiveCost = Math.max(0, inst.card.chakra - costReduction);
    if (ps.chakra >= effectiveCost) {
      const validMissions = getValidMissionsForCharacter(
        state,
        side,
        baseName
      );
      if (validMissions.length > 0) {
        actions.push({
          type: GameActionType.PLAY_CHARACTER,
          cardInstanceId: inst.instanceId,
          validMissions,
          cost: effectiveCost,
          description: `Play ${inst.card.nameEn} (cost ${effectiveCost}${costReduction > 0 ? `, reduced from ${inst.card.chakra}` : ''})`,
        });
      }
    }

    // PLAY_HIDDEN: face-down for 1 chakra
    if (ps.chakra >= 1) {
      const validMissions = getValidMissionsForCharacter(
        state,
        side,
        baseName
      );
      if (validMissions.length > 0) {
        actions.push({
          type: GameActionType.PLAY_HIDDEN,
          cardInstanceId: inst.instanceId,
          validMissions,
          cost: 1,
          description: `Play ${inst.card.nameEn} hidden (cost 1)`,
        });
      }
    }

    // UPGRADE: find targets with same base name and lower cost
    const upgradeTargets = findUpgradeTargets(state, side, inst.card);
    if (upgradeTargets.length > 0) {
      // Calculate the minimum cost for any valid upgrade
      for (const target of upgradeTargets) {
        const targetChar = findDeployedCharacter(state, target.instanceId);
        if (targetChar) {
          const upgradeCost = Math.max(0, inst.card.chakra - targetChar.card.chakra);
          if (ps.chakra >= upgradeCost) {
            actions.push({
              type: GameActionType.UPGRADE,
              cardInstanceId: inst.instanceId,
              upgradeTargets: [target],
              cost: upgradeCost,
              description: `Upgrade to ${inst.card.nameEn} (cost ${upgradeCost})`,
            });
          }
        }
      }
    }
  }

  // REVEAL: hidden characters on field
  for (let mIdx = 0; mIdx < state.missions.length; mIdx++) {
    const mission = state.missions[mIdx];
    const characters = getMissionCharacters(mission, side);
    for (const char of characters) {
      if (char.hidden) {
        const revealCost = Math.max(0, char.card.chakra - 1);
        if (ps.chakra >= revealCost) {
          actions.push({
            type: GameActionType.REVEAL,
            cardInstanceId: char.instanceId,
            validMissions: [mIdx],
            cost: revealCost,
            description: `Reveal ${char.card.nameEn} (cost ${revealCost})`,
          });
        }
      }
    }
  }

  // PLAY_JUTSU: jutsu cards in hand
  const jutsuCards = ps.hand.filter((inst) => inst.card.type === 'JUTSU');
  for (const inst of jutsuCards) {
    if (ps.chakra >= inst.card.chakra) {
      // Parse "Target a friendly [Name]" from effectEn to find valid targets
      const effectText = inst.card.effectEn ?? '';
      const targetMatch = effectText.match(
        /[Tt]arget\s+a\s+friendly\s+(.+?)\s+in\s+play/
      );

      const jutsuTargets: { instanceId: string; missionIndex: number }[] = [];
      if (targetMatch) {
        const targetName = targetMatch[1];
        for (let mIdx = 0; mIdx < state.missions.length; mIdx++) {
          const mission = state.missions[mIdx];
          const characters = getMissionCharacters(mission, side);
          for (const char of characters) {
            if (
              !char.hidden &&
              (char.card.nameEn.includes(targetName) ||
                getCharacterBaseName(char.card) === targetName)
            ) {
              jutsuTargets.push({
                instanceId: char.instanceId,
                missionIndex: mIdx,
              });
            }
          }
        }
      } else {
        // No specific target constraint — target any non-hidden friendly character
        for (let mIdx = 0; mIdx < state.missions.length; mIdx++) {
          const mission = state.missions[mIdx];
          const characters = getMissionCharacters(mission, side);
          for (const char of characters) {
            if (!char.hidden) {
              jutsuTargets.push({
                instanceId: char.instanceId,
                missionIndex: mIdx,
              });
            }
          }
        }
      }

      if (jutsuTargets.length > 0) {
        actions.push({
          type: GameActionType.PLAY_JUTSU,
          cardInstanceId: inst.instanceId,
          jutsuTargets,
          cost: inst.card.chakra,
          description: `Play Jutsu: ${inst.card.nameEn} (cost ${inst.card.chakra})`,
        });
      }
    }
  }

  // PASS: always available
  actions.push({
    type: GameActionType.PASS,
    description: 'Pass',
  });

  return actions;
}

/** Get valid mission indices where a character with given base name can be played. */
function getValidMissionsForCharacter(
  state: GameState,
  side: PlayerSide,
  baseName: string
): number[] {
  const validIndices: number[] = [];
  for (let i = 0; i < state.missions.length; i++) {
    const mission = state.missions[i];
    // Only allow playing on missions that have been revealed (have a missionCard)
    if (mission.missionCard === null) continue;
    if (!hasCharacterWithName(mission, side, baseName)) {
      validIndices.push(i);
    }
  }
  return validIndices;
}

// =============================================
// Execute Player Action
// =============================================

/** Execute a player action and return the new state. */
export function executePlayerAction(
  state: GameState,
  action: GameAction
): GameState {
  if (state.phase !== GamePhase.ACTION) return state;
  if (action.side !== state.turn) return state;

  let newState = { ...state };

  switch (action.type) {
    case GameActionType.PLAY_CHARACTER: {
      newState = executePlayCharacter(newState, action);
      break;
    }
    case GameActionType.PLAY_HIDDEN: {
      newState = executePlayHidden(newState, action);
      break;
    }
    case GameActionType.REVEAL: {
      newState = executeReveal(newState, action);
      break;
    }
    case GameActionType.UPGRADE: {
      newState = executeUpgrade(newState, action);
      break;
    }
    case GameActionType.PLAY_JUTSU: {
      newState = executePlayJutsu(newState, action);
      break;
    }
    case GameActionType.PASS: {
      newState = executePass(newState, action);
      break;
    }
    default:
      return state;
  }

  // Add to action history
  newState = {
    ...newState,
    actionHistory: [...newState.actionHistory, action],
  };

  return newState;
}

/** Play a character face-up at a mission. */
function executePlayCharacter(
  state: GameState,
  action: GameAction
): GameState {
  const side = action.side;
  const ps = getPlayerState(state, side);
  const cardInstanceId = action.data?.cardInstanceId;
  const missionIndex = action.data?.missionIndex;

  if (cardInstanceId === undefined || missionIndex === undefined) return state;

  const cardInstance = ps.hand.find(
    (inst) => inst.instanceId === cardInstanceId
  );
  if (!cardInstance) return state;
  const reduction = getCostReduction(state, side, cardInstance.card);
  const actualCost = Math.max(0, cardInstance.card.chakra - reduction);
  if (ps.chakra < actualCost) return state;

  // Remove from hand, deduct chakra (with cost reduction applied)
  let newState = updatePlayerState(state, side, {
    hand: ps.hand.filter((inst) => inst.instanceId !== cardInstanceId),
    chakra: ps.chakra - actualCost,
  });

  // Add to mission
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

  // Apply MAIN effects
  const effects = parseEffects(cardInstance.card.effectEn);
  newState = applyEffects(
    newState,
    effects,
    EffectTrigger.MAIN,
    cardInstance.instanceId,
    side,
    missionIndex
  );

  // Switch turn, reset consecutive passes
  newState = switchTurn(newState);
  newState = { ...newState, consecutivePasses: 0 };

  return newState;
}

/** Play a character face-down (hidden) at a mission. */
function executePlayHidden(
  state: GameState,
  action: GameAction
): GameState {
  const side = action.side;
  const ps = getPlayerState(state, side);
  const cardInstanceId = action.data?.cardInstanceId;
  const missionIndex = action.data?.missionIndex;

  if (cardInstanceId === undefined || missionIndex === undefined) return state;

  const cardInstance = ps.hand.find(
    (inst) => inst.instanceId === cardInstanceId
  );
  if (!cardInstance) return state;
  if (ps.chakra < 1) return state;

  // Remove from hand, deduct 1 chakra
  let newState = updatePlayerState(state, side, {
    hand: ps.hand.filter((inst) => inst.instanceId !== cardInstanceId),
    chakra: ps.chakra - 1,
  });

  // Add as hidden character
  const deployed: DeployedCharacter = {
    instanceId: cardInstance.instanceId,
    card: cardInstance.card,
    hidden: true,
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

  // Switch turn, reset consecutive passes
  newState = switchTurn(newState);
  newState = { ...newState, consecutivePasses: 0 };

  return newState;
}

/** Play a jutsu card targeting a character on the field. */
function executePlayJutsu(state: GameState, action: GameAction): GameState {
  const side = action.side;
  const ps = getPlayerState(state, side);
  const cardInstanceId = action.data?.cardInstanceId;
  const targetInstanceId = action.data?.targetInstanceId;
  const missionIndex = action.data?.missionIndex;

  if (
    cardInstanceId === undefined ||
    targetInstanceId === undefined ||
    missionIndex === undefined
  )
    return state;

  const cardInstance = ps.hand.find(
    (inst) => inst.instanceId === cardInstanceId
  );
  if (!cardInstance) return state;
  if (ps.chakra < cardInstance.card.chakra) return state;

  // Remove from hand, deduct chakra, add to discard
  let newState = updatePlayerState(state, side, {
    hand: ps.hand.filter((inst) => inst.instanceId !== cardInstanceId),
    chakra: ps.chakra - cardInstance.card.chakra,
    discardPile: [...ps.discardPile, cardInstance],
  });

  // Apply MAIN effects using the target character as source (so SELF targets the target)
  const effects = parseEffects(cardInstance.card.effectEn);
  newState = applyEffects(
    newState,
    effects,
    EffectTrigger.MAIN,
    targetInstanceId,
    side,
    missionIndex
  );

  // Switch turn, reset consecutive passes
  newState = switchTurn(newState);
  newState = { ...newState, consecutivePasses: 0 };

  return newState;
}

/** Reveal a hidden character. */
function executeReveal(state: GameState, action: GameAction): GameState {
  const side = action.side;
  const instanceId = action.data?.cardInstanceId;
  const missionIndex = action.data?.missionIndex;

  if (instanceId === undefined || missionIndex === undefined) return state;

  const newState = revealHiddenCharacter(state, side, instanceId, missionIndex);

  // Switch turn, reset consecutive passes
  let result = switchTurn(newState);
  result = { ...result, consecutivePasses: 0 };

  return result;
}

/** Execute an upgrade action. */
function executeUpgrade(state: GameState, action: GameAction): GameState {
  const side = action.side;
  const cardInstanceId = action.data?.cardInstanceId;
  const targetInstanceId = action.data?.targetInstanceId;
  const missionIndex = action.data?.missionIndex;

  if (
    cardInstanceId === undefined ||
    targetInstanceId === undefined ||
    missionIndex === undefined
  )
    return state;

  const newState = upgradeCharacter(
    state,
    side,
    cardInstanceId,
    targetInstanceId,
    missionIndex
  );

  // Switch turn, reset consecutive passes
  let result = switchTurn(newState);
  result = { ...result, consecutivePasses: 0 };

  return result;
}

/** Execute a pass action. */
function executePass(state: GameState, action: GameAction): GameState {
  const side = action.side;
  const otherSide: PlayerSide =
    side === 'player' ? 'opponent' : 'player';

  let newState = updatePlayerState(state, side, { hasPassed: true });
  const newConsecutivePasses = state.consecutivePasses + 1;

  // First to pass gets edge
  const otherPs = getPlayerState(newState, otherSide);
  if (!otherPs.hasPassed) {
    // Transfer edge
    newState = updatePlayerState(newState, side, { hasEdge: true });
    newState = updatePlayerState(newState, otherSide, { hasEdge: false });
  }

  // Check if both passed (2 consecutive passes)
  if (newConsecutivePasses >= 2) {
    newState = {
      ...newState,
      consecutivePasses: newConsecutivePasses,
    };
    return executeMissionEvaluation(newState);
  }

  // Switch turn
  newState = switchTurn(newState);
  newState = { ...newState, consecutivePasses: newConsecutivePasses };

  return newState;
}

/** Switch the turn to the other player. */
function switchTurn(state: GameState): GameState {
  return {
    ...state,
    turn: state.turn === 'player' ? 'opponent' : 'player',
  };
}

// =============================================
// Mission Evaluation
// =============================================

/** Evaluate all active missions and award points. */
export function executeMissionEvaluation(state: GameState): GameState {
  let newState = { ...state, phase: GamePhase.MISSION_EVALUATION };

  const newMissions = newState.missions.map((mission, missionIndex) => {
    // Only evaluate missions that have been revealed and not yet resolved
    if (!mission.missionCard || mission.resolved) return mission;

    const playerPower = calculateMissionPower(mission.playerCharacters, mission.missionCard);
    const opponentPower = calculateMissionPower(mission.opponentCharacters, mission.missionCard);

    let winner: PlayerSide | 'tie' | null = null;

    // Need minimum 1 power to win
    if (playerPower === 0 && opponentPower === 0) {
      winner = null;
    } else if (playerPower > opponentPower) {
      winner = 'player';
    } else if (opponentPower > playerPower) {
      winner = 'opponent';
    } else {
      // Tie: edge holder wins
      winner = newState.player.hasEdge ? 'player' : 'opponent';
    }

    // Apply SCORE effects for winning side
    if (winner === 'player' || winner === 'opponent') {
      const winnerChars = getMissionCharacters(mission, winner);
      for (const char of winnerChars) {
        if (!char.hidden) {
          const effects = parseEffects(char.card.effectEn);
          newState = applyEffects(
            newState,
            effects,
            EffectTrigger.SCORE,
            char.instanceId,
            winner,
            missionIndex
          );
        }
      }

      // Award mission points
      const points = getMissionPointValue(mission.rank);
      const winnerPs = getPlayerState(newState, winner);
      newState = updatePlayerState(newState, winner, {
        missionPoints: winnerPs.missionPoints + points,
      });
    }

    return {
      ...mission,
      resolved: true,
      winner,
    };
  });

  newState = { ...newState, missions: newMissions };

  return executeEndPhase(newState);
}

// =============================================
// End Phase
// =============================================

/** Execute the end phase. */
export function executeEndPhase(state: GameState): GameState {
  let newState = { ...state, phase: GamePhase.END };

  // Reset chakra to 0
  newState = updatePlayerState(newState, 'player', { chakra: 0 });
  newState = updatePlayerState(newState, 'opponent', { chakra: 0 });

  // Remove power tokens from all characters
  const clearedMissions = newState.missions.map((mission) => ({
    ...mission,
    playerCharacters: mission.playerCharacters.map((c) => ({
      ...c,
      powerTokens: 0,
    })),
    opponentCharacters: mission.opponentCharacters.map((c) => ({
      ...c,
      powerTokens: 0,
    })),
  }));
  newState = { ...newState, missions: clearedMissions };

  // Check if game is over (round 4)
  if (newState.round >= 4) {
    return determineWinner(newState);
  }

  // Move to next round
  newState = {
    ...newState,
    round: newState.round + 1,
    phase: GamePhase.START,
  };

  return executeStartPhase(newState);
}

/** Determine the winner at the end of the game. */
function determineWinner(state: GameState): GameState {
  const playerPoints = state.player.missionPoints;
  const opponentPoints = state.opponent.missionPoints;

  let winner: PlayerSide | 'draw' | null;

  if (playerPoints > opponentPoints) {
    winner = 'player';
  } else if (opponentPoints > playerPoints) {
    winner = 'opponent';
  } else {
    // Tiebreak by edge tokens (in our simplified version, whoever has edge)
    if (state.player.hasEdge) {
      winner = 'player';
    } else if (state.opponent.hasEdge) {
      winner = 'opponent';
    } else {
      winner = 'draw';
    }
  }

  return {
    ...state,
    phase: GamePhase.GAME_OVER,
    winner,
  };
}

// =============================================
// Upgrade & Reveal Helpers
// =============================================

/** Find upgrade targets: characters on field with same base name and lower cost. */
export function findUpgradeTargets(
  state: GameState,
  side: PlayerSide,
  card: GameCard
): { instanceId: string; missionIndex: number }[] {
  const baseName = getCharacterBaseName(card);
  const targets: { instanceId: string; missionIndex: number }[] = [];

  for (let mIdx = 0; mIdx < state.missions.length; mIdx++) {
    const mission = state.missions[mIdx];
    const characters = getMissionCharacters(mission, side);

    for (const char of characters) {
      const charBaseName = getCharacterBaseName(char.card);
      if (charBaseName === baseName && char.card.chakra < card.chakra) {
        targets.push({ instanceId: char.instanceId, missionIndex: mIdx });
      }
    }
  }

  return targets;
}

/** Perform an upgrade: replace target with new card, transfer power tokens, pay cost difference. */
export function upgradeCharacter(
  state: GameState,
  side: PlayerSide,
  cardInstanceId: string,
  targetInstanceId: string,
  missionIndex: number
): GameState {
  const ps = getPlayerState(state, side);
  const cardInstance = ps.hand.find(
    (inst) => inst.instanceId === cardInstanceId
  );
  if (!cardInstance) return state;

  const mission = state.missions[missionIndex];
  const characters = getMissionCharacters(mission, side);
  const targetIndex = characters.findIndex(
    (c) => c.instanceId === targetInstanceId
  );
  if (targetIndex === -1) return state;

  const target = characters[targetIndex];
  const costDifference = Math.max(0, cardInstance.card.chakra - target.card.chakra);

  if (ps.chakra < costDifference) return state;

  // Create upgraded character (transfer power tokens)
  const upgraded: DeployedCharacter = {
    instanceId: cardInstance.instanceId,
    card: cardInstance.card,
    hidden: false,
    powerTokens: target.powerTokens,
    continuousEffects: [],
  };

  // Replace in mission
  const newCharacters = characters.map((c, idx) =>
    idx === targetIndex ? upgraded : c
  );
  const newMission = updateMissionCharacters(mission, side, newCharacters);
  const newMissions = state.missions.map((m, idx) =>
    idx === missionIndex ? newMission : m
  );

  // Remove from hand, deduct chakra, add old card to discard
  const discardedInstance: GameCardInstance = {
    instanceId: target.instanceId,
    card: target.card,
  };

  let newState: GameState = {
    ...state,
    missions: newMissions,
  };
  newState = updatePlayerState(newState, side, {
    hand: ps.hand.filter((inst) => inst.instanceId !== cardInstanceId),
    chakra: ps.chakra - costDifference,
    discardPile: [...ps.discardPile, discardedInstance],
  });

  // Apply UPGRADE effects
  const effects = parseEffects(cardInstance.card.effectEn);
  newState = applyEffects(
    newState,
    effects,
    EffectTrigger.UPGRADE,
    cardInstance.instanceId,
    side,
    missionIndex
  );

  return newState;
}

/** Reveal a hidden character on the field. */
export function revealHiddenCharacter(
  state: GameState,
  side: PlayerSide,
  instanceId: string,
  missionIndex: number
): GameState {
  const ps = getPlayerState(state, side);
  const mission = state.missions[missionIndex];
  const characters = getMissionCharacters(mission, side);
  const charIndex = characters.findIndex((c) => c.instanceId === instanceId);

  if (charIndex === -1) return state;

  const char = characters[charIndex];
  if (!char.hidden) return state;

  // Pay reveal cost: full cost - 1
  const revealCost = Math.max(0, char.card.chakra - 1);
  if (ps.chakra < revealCost) return state;

  // Reveal the character
  const revealed: DeployedCharacter = {
    ...char,
    hidden: false,
  };

  const newCharacters = characters.map((c, idx) =>
    idx === charIndex ? revealed : c
  );
  const newMission = updateMissionCharacters(mission, side, newCharacters);
  const newMissions = state.missions.map((m, idx) =>
    idx === missionIndex ? newMission : m
  );

  let newState: GameState = { ...state, missions: newMissions };
  newState = updatePlayerState(newState, side, {
    chakra: ps.chakra - revealCost,
  });

  // Apply AMBUSH effects
  const effects = parseEffects(char.card.effectEn);
  newState = applyEffects(
    newState,
    effects,
    EffectTrigger.AMBUSH,
    instanceId,
    side,
    missionIndex
  );

  return newState;
}

/** Find a deployed character across all missions. */
function findDeployedCharacter(
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

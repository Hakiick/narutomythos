import { describe, it, expect, beforeEach } from 'vitest';
import {
  initializeGame,
  performMulligan,
  keepHand,
  getAvailableActions,
  executePlayerAction,
  executeMissionEvaluation,
  findUpgradeTargets,
  upgradeCharacter,
  revealHiddenCharacter,
} from '@/lib/game/engine';
import {
  GamePhase,
  GameActionType,
  MissionRank,
  type GameCard,
  type GameState,
  type GameAction,
} from '@/lib/game/types';
import {
  getCharacterBaseName,
  calculateMissionPower,
  getMissionRankForRound,
  getMissionPointValue,
  resetInstanceCounter,
} from '@/lib/game/utils';

// =============================================
// Test Helpers
// =============================================

function createTestCharacter(overrides: Partial<GameCard> = {}): GameCard {
  return {
    id: 'TEST-001',
    nameEn: 'Test Character — Version A',
    nameFr: 'Test Character — Version A',
    type: 'CHARACTER',
    rarity: 'C',
    chakra: 2,
    power: 3,
    keywords: [],
    group: 'Leaf Village',
    effectEn: null,
    effectFr: null,
    imageUrl: null,
    set: 'KS',
    cardNumber: 999,
    ...overrides,
  };
}

function createTestDeck(count: number = 30): GameCard[] {
  const deck: GameCard[] = [];
  for (let i = 0; i < count; i++) {
    deck.push(
      createTestCharacter({
        id: `TEST-${String(i + 1).padStart(3, '0')}`,
        nameEn: `Character ${i + 1} — Variant`,
        nameFr: `Personnage ${i + 1} — Variante`,
        chakra: (i % 3) + 1,
        power: (i % 4) + 1,
        cardNumber: i + 1,
      })
    );
  }
  return deck;
}

function createTestMissions(): GameCard[] {
  return [
    createTestCharacter({
      id: 'M-C',
      nameEn: 'Mission C',
      nameFr: 'Mission C',
      type: 'MISSION',
      chakra: 1,
      power: 0,
    }),
    createTestCharacter({
      id: 'M-B',
      nameEn: 'Mission B',
      nameFr: 'Mission B',
      type: 'MISSION',
      chakra: 2,
      power: 0,
    }),
    createTestCharacter({
      id: 'M-A',
      nameEn: 'Mission A',
      nameFr: 'Mission A',
      type: 'MISSION',
      chakra: 3,
      power: 0,
    }),
  ];
}

// =============================================
// Feature 2 — Init & Setup Tests
// =============================================

describe('initializeGame', () => {
  beforeEach(() => {
    resetInstanceCounter();
  });

  it('should create a valid game state', () => {
    const state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );

    expect(state.phase).toBe(GamePhase.MULLIGAN);
    expect(state.round).toBe(1);
    expect(state.winner).toBeNull();
    expect(state.missions).toHaveLength(4);
  });

  it('should deal 5 cards to each player', () => {
    const state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );

    expect(state.player.hand).toHaveLength(5);
    expect(state.opponent.hand).toHaveLength(5);
  });

  it('should have 25 cards remaining in each deck after draw', () => {
    const state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );

    expect(state.player.deck).toHaveLength(25);
    expect(state.opponent.deck).toHaveLength(25);
  });

  it('should assign edge to exactly one player', () => {
    const state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );

    expect(state.player.hasEdge !== state.opponent.hasEdge).toBe(true);
  });

  it('should create 4 mission slots with correct ranks', () => {
    const state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );

    expect(state.missions[0].rank).toBe(MissionRank.D);
    expect(state.missions[1].rank).toBe(MissionRank.C);
    expect(state.missions[2].rank).toBe(MissionRank.B);
    expect(state.missions[3].rank).toBe(MissionRank.A);
  });

  it('should select 3 missions per player', () => {
    const state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );

    expect(state.player.selectedMissions).toHaveLength(3);
    expect(state.opponent.selectedMissions).toHaveLength(3);
  });
});

// =============================================
// Mulligan Tests
// =============================================

describe('mulligan', () => {
  let state: GameState;

  beforeEach(() => {
    resetInstanceCounter();
    state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );
  });

  it('should reshuffle and redraw 5 cards on mulligan', () => {
    const originalHand = [...state.player.hand];
    const newState = performMulligan(state, 'player');

    expect(newState.player.hand).toHaveLength(5);
    expect(newState.player.deck).toHaveLength(25);
    expect(newState.player.mulliganDone).toBe(true);

    // Hand should have different instance IDs (reshuffled + new instances)
    const originalIds = originalHand.map((c) => c.instanceId);
    const newIds = newState.player.hand.map((c) => c.instanceId);
    expect(newIds).not.toEqual(originalIds);
  });

  it('should mark mulliganDone on keepHand', () => {
    const newState = keepHand(state, 'player');
    expect(newState.player.mulliganDone).toBe(true);
  });

  it('should transition to ACTION phase when both players keep hand', () => {
    let newState = keepHand(state, 'player');
    newState = keepHand(newState, 'opponent');

    expect(newState.phase).toBe(GamePhase.ACTION);
  });

  it('should transition to ACTION when one mulligans and one keeps', () => {
    let newState = performMulligan(state, 'player');
    newState = keepHand(newState, 'opponent');

    expect(newState.phase).toBe(GamePhase.ACTION);
  });
});

// =============================================
// Feature 3 — Phases & Round Flow Tests
// =============================================

describe('executeStartPhase', () => {
  it('should reveal mission for current round', () => {
    let state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );
    state = keepHand(state, 'player');
    state = keepHand(state, 'opponent');

    // After both keep, we should be in ACTION phase with round 1 mission revealed
    const dMission = state.missions.find((m) => m.rank === MissionRank.D);
    expect(dMission?.missionCard).not.toBeNull();
  });

  it('should give each player 5 base chakra on round 1', () => {
    let state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );
    state = keepHand(state, 'player');
    state = keepHand(state, 'opponent');

    // Base chakra = 5 + characters on field (0 on round 1)
    expect(state.player.chakra).toBe(5);
    expect(state.opponent.chakra).toBe(5);
  });

  it('should set turn to edge holder', () => {
    let state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );
    state = keepHand(state, 'player');
    state = keepHand(state, 'opponent');

    const edgeHolder = state.player.hasEdge ? 'player' : 'opponent';
    expect(state.turn).toBe(edgeHolder);
  });
});

describe('getAvailableActions', () => {
  it('should always include PASS in ACTION phase', () => {
    let state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );
    state = keepHand(state, 'player');
    state = keepHand(state, 'opponent');

    const actions = getAvailableActions(state);
    expect(actions.some((a) => a.type === GameActionType.PASS)).toBe(true);
  });

  it('should return empty array when not in ACTION phase', () => {
    const state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );
    // Still in MULLIGAN phase
    const actions = getAvailableActions(state);
    expect(actions).toHaveLength(0);
  });

  it('should include PLAY_CHARACTER for affordable characters', () => {
    let state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );
    state = keepHand(state, 'player');
    state = keepHand(state, 'opponent');

    const actions = getAvailableActions(state);
    const playActions = actions.filter(
      (a) => a.type === GameActionType.PLAY_CHARACTER
    );
    // Player has 5 chakra and characters in hand, should have play options
    expect(playActions.length).toBeGreaterThan(0);
  });

  it('should include PLAY_HIDDEN for characters when player has chakra', () => {
    let state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );
    state = keepHand(state, 'player');
    state = keepHand(state, 'opponent');

    const actions = getAvailableActions(state);
    const hiddenActions = actions.filter(
      (a) => a.type === GameActionType.PLAY_HIDDEN
    );
    expect(hiddenActions.length).toBeGreaterThan(0);
  });
});

describe('pass mechanic', () => {
  it('should transfer edge on first pass', () => {
    let state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );
    state = keepHand(state, 'player');
    state = keepHand(state, 'opponent');

    const currentTurn = state.turn;
    const otherSide = currentTurn === 'player' ? 'opponent' : 'player';

    const passAction: GameAction = {
      type: GameActionType.PASS,
      side: currentTurn,
      timestamp: Date.now(),
    };

    const newState = executePlayerAction(state, passAction);

    // First to pass gets edge
    expect(newState[currentTurn].hasEdge).toBe(true);
    expect(newState[otherSide].hasEdge).toBe(false);
  });

  it('should move to MISSION_EVALUATION when both pass', () => {
    let state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );
    state = keepHand(state, 'player');
    state = keepHand(state, 'opponent');

    // First pass
    const firstPass: GameAction = {
      type: GameActionType.PASS,
      side: state.turn,
      timestamp: Date.now(),
    };
    state = executePlayerAction(state, firstPass);

    // Second pass
    const secondPass: GameAction = {
      type: GameActionType.PASS,
      side: state.turn,
      timestamp: Date.now(),
    };
    state = executePlayerAction(state, secondPass);

    // After both pass, should be past MISSION_EVALUATION
    // (executeMissionEvaluation transitions to END then back to ACTION for next round)
    expect(
      state.phase === GamePhase.ACTION ||
      state.phase === GamePhase.GAME_OVER
    ).toBe(true);

    // Should be in round 2 or game over
    expect(state.round >= 2 || state.phase === GamePhase.GAME_OVER).toBe(true);
  });
});

describe('mission evaluation', () => {
  it('should award points to higher power side', () => {
    let state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );
    state = keepHand(state, 'player');
    state = keepHand(state, 'opponent');

    // Manually place characters at mission 0 (D rank)
    const playerChar = {
      instanceId: 'test-p1',
      card: createTestCharacter({ power: 5 }),
      hidden: false,
      powerTokens: 0,
      continuousEffects: [],
    };
    const opponentChar = {
      instanceId: 'test-o1',
      card: createTestCharacter({ power: 3 }),
      hidden: false,
      powerTokens: 0,
      continuousEffects: [],
    };

    state = {
      ...state,
      missions: state.missions.map((m, idx) =>
        idx === 0
          ? {
              ...m,
              playerCharacters: [playerChar],
              opponentCharacters: [opponentChar],
            }
          : m
      ),
    };

    const evaluated = executeMissionEvaluation(state);

    // Player had higher power, should win D mission (1 point)
    expect(evaluated.player.missionPoints).toBeGreaterThanOrEqual(1);
  });

  it('should award tie to edge holder', () => {
    let state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );
    state = keepHand(state, 'player');
    state = keepHand(state, 'opponent');

    // Set up a tie at mission 0
    const tiedChar = {
      instanceId: 'test-tied',
      card: createTestCharacter({ power: 3 }),
      hidden: false,
      powerTokens: 0,
      continuousEffects: [],
    };

    state = {
      ...state,
      missions: state.missions.map((m, idx) =>
        idx === 0
          ? {
              ...m,
              playerCharacters: [{ ...tiedChar, instanceId: 'p-tied' }],
              opponentCharacters: [{ ...tiedChar, instanceId: 'o-tied' }],
            }
          : m
      ),
    };

    const evaluated = executeMissionEvaluation(state);
    const edgeHolder = state.player.hasEdge ? 'player' : 'opponent';

    // Edge holder should get the point
    expect(evaluated[edgeHolder].missionPoints).toBeGreaterThanOrEqual(1);
  });

  it('should not award points when both sides have 0 power', () => {
    let state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );
    state = keepHand(state, 'player');
    state = keepHand(state, 'opponent');

    // No characters at any mission
    const evaluated = executeMissionEvaluation(state);

    expect(evaluated.player.missionPoints).toBe(0);
    expect(evaluated.opponent.missionPoints).toBe(0);
  });
});

describe('round flow', () => {
  it('should progress from START to ACTION to EVAL to END to next round', () => {
    let state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );
    state = keepHand(state, 'player');
    state = keepHand(state, 'opponent');

    expect(state.phase).toBe(GamePhase.ACTION);
    expect(state.round).toBe(1);

    // Both pass to end the round
    const pass1: GameAction = {
      type: GameActionType.PASS,
      side: state.turn,
      timestamp: Date.now(),
    };
    state = executePlayerAction(state, pass1);

    const pass2: GameAction = {
      type: GameActionType.PASS,
      side: state.turn,
      timestamp: Date.now(),
    };
    state = executePlayerAction(state, pass2);

    // Should be in round 2 ACTION phase now
    expect(state.round).toBe(2);
    expect(state.phase).toBe(GamePhase.ACTION);
  });
});

// =============================================
// Feature 4 — Name Uniqueness, Upgrade & Reveal Tests
// =============================================

describe('getCharacterBaseName', () => {
  it('should extract base name before em dash', () => {
    const card = createTestCharacter({
      nameEn: 'Naruto Uzumaki \u2014 Genin of Konoha',
    });
    expect(getCharacterBaseName(card)).toBe('Naruto Uzumaki');
  });

  it('should return full name when no em dash', () => {
    const card = createTestCharacter({
      nameEn: 'Akamaru',
    });
    expect(getCharacterBaseName(card)).toBe('Akamaru');
  });

  it('should handle multiple em dashes by taking first part', () => {
    const card = createTestCharacter({
      nameEn: 'Name \u2014 Part 2 \u2014 Part 3',
    });
    expect(getCharacterBaseName(card)).toBe('Name');
  });
});

describe('findUpgradeTargets', () => {
  it('should find targets with same base name and lower cost', () => {
    let state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );
    state = keepHand(state, 'player');
    state = keepHand(state, 'opponent');

    // Place a low-cost character on the field
    const lowCostChar = {
      instanceId: 'upgrade-target',
      card: createTestCharacter({
        nameEn: 'Naruto Uzumaki \u2014 Genin',
        chakra: 2,
        power: 3,
      }),
      hidden: false,
      powerTokens: 1,
      continuousEffects: [],
    };

    state = {
      ...state,
      missions: state.missions.map((m, idx) =>
        idx === 0
          ? { ...m, playerCharacters: [lowCostChar] }
          : m
      ),
    };

    const upgradeCard = createTestCharacter({
      nameEn: 'Naruto Uzumaki \u2014 Rasengan',
      chakra: 4,
      power: 6,
    });

    const targets = findUpgradeTargets(state, 'player', upgradeCard);
    expect(targets).toHaveLength(1);
    expect(targets[0].instanceId).toBe('upgrade-target');
    expect(targets[0].missionIndex).toBe(0);
  });

  it('should not find targets with different base name', () => {
    let state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );
    state = keepHand(state, 'player');
    state = keepHand(state, 'opponent');

    const onField = {
      instanceId: 'field-char',
      card: createTestCharacter({
        nameEn: 'Sasuke Uchiha \u2014 Genin',
        chakra: 2,
      }),
      hidden: false,
      powerTokens: 0,
      continuousEffects: [],
    };

    state = {
      ...state,
      missions: state.missions.map((m, idx) =>
        idx === 0 ? { ...m, playerCharacters: [onField] } : m
      ),
    };

    const upgradeCard = createTestCharacter({
      nameEn: 'Naruto Uzumaki \u2014 Rasengan',
      chakra: 4,
    });

    const targets = findUpgradeTargets(state, 'player', upgradeCard);
    expect(targets).toHaveLength(0);
  });
});

describe('upgradeCharacter', () => {
  it('should pay correct cost difference', () => {
    let state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );
    state = keepHand(state, 'player');
    state = keepHand(state, 'opponent');

    const lowCostChar = {
      instanceId: 'old-char',
      card: createTestCharacter({
        nameEn: 'Naruto Uzumaki \u2014 Genin',
        chakra: 2,
        power: 3,
      }),
      hidden: false,
      powerTokens: 2,
      continuousEffects: [],
    };

    state = {
      ...state,
      missions: state.missions.map((m, idx) =>
        idx === 0 ? { ...m, playerCharacters: [lowCostChar] } : m
      ),
    };

    const upgradeCard = createTestCharacter({
      id: 'UPGRADE-001',
      nameEn: 'Naruto Uzumaki \u2014 Rasengan',
      chakra: 4,
      power: 6,
    });
    const upgradeInstance = {
      instanceId: 'upgrade-inst',
      card: upgradeCard,
    };

    // Add upgrade card to player hand
    state = {
      ...state,
      player: {
        ...state.player,
        hand: [...state.player.hand, upgradeInstance],
        chakra: 10,
      },
    };

    const newState = upgradeCharacter(
      state,
      'player',
      'upgrade-inst',
      'old-char',
      0
    );

    // Cost difference = 4 - 2 = 2
    expect(newState.player.chakra).toBe(10 - 2);
  });

  it('should transfer power tokens on upgrade', () => {
    let state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );
    state = keepHand(state, 'player');
    state = keepHand(state, 'opponent');

    const lowCostChar = {
      instanceId: 'old-char',
      card: createTestCharacter({
        nameEn: 'Naruto Uzumaki \u2014 Genin',
        chakra: 2,
        power: 3,
      }),
      hidden: false,
      powerTokens: 3,
      continuousEffects: [],
    };

    state = {
      ...state,
      missions: state.missions.map((m, idx) =>
        idx === 0 ? { ...m, playerCharacters: [lowCostChar] } : m
      ),
    };

    const upgradeCard = createTestCharacter({
      nameEn: 'Naruto Uzumaki \u2014 Rasengan',
      chakra: 4,
      power: 6,
    });
    const upgradeInstance = {
      instanceId: 'upgrade-inst',
      card: upgradeCard,
    };

    state = {
      ...state,
      player: {
        ...state.player,
        hand: [...state.player.hand, upgradeInstance],
        chakra: 10,
      },
    };

    const newState = upgradeCharacter(
      state,
      'player',
      'upgrade-inst',
      'old-char',
      0
    );

    // New character should have transferred power tokens
    const upgraded = newState.missions[0].playerCharacters.find(
      (c) => c.instanceId === 'upgrade-inst'
    );
    expect(upgraded?.powerTokens).toBe(3);
  });
});

describe('revealHiddenCharacter', () => {
  it('should pay (cost - 1) to reveal', () => {
    let state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );
    state = keepHand(state, 'player');
    state = keepHand(state, 'opponent');

    const hiddenChar = {
      instanceId: 'hidden-char',
      card: createTestCharacter({
        nameEn: 'Naruto Uzumaki \u2014 Genin',
        chakra: 3,
        power: 3,
      }),
      hidden: true,
      powerTokens: 0,
      continuousEffects: [],
    };

    state = {
      ...state,
      missions: state.missions.map((m, idx) =>
        idx === 0 ? { ...m, playerCharacters: [hiddenChar] } : m
      ),
      player: { ...state.player, chakra: 10 },
    };

    const newState = revealHiddenCharacter(state, 'player', 'hidden-char', 0);

    // Should pay (3 - 1) = 2 chakra
    expect(newState.player.chakra).toBe(10 - 2);

    // Character should be revealed
    const char = newState.missions[0].playerCharacters.find(
      (c) => c.instanceId === 'hidden-char'
    );
    expect(char?.hidden).toBe(false);
  });

  it('should pay 0 for a cost-1 character reveal', () => {
    let state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );
    state = keepHand(state, 'player');
    state = keepHand(state, 'opponent');

    const hiddenChar = {
      instanceId: 'hidden-cheap',
      card: createTestCharacter({
        nameEn: 'Akamaru \u2014 Ninja Hound',
        chakra: 1,
        power: 2,
      }),
      hidden: true,
      powerTokens: 0,
      continuousEffects: [],
    };

    state = {
      ...state,
      missions: state.missions.map((m, idx) =>
        idx === 0 ? { ...m, playerCharacters: [hiddenChar] } : m
      ),
      player: { ...state.player, chakra: 5 },
    };

    const newState = revealHiddenCharacter(state, 'player', 'hidden-cheap', 0);

    // Should pay max(0, 1 - 1) = 0
    expect(newState.player.chakra).toBe(5);
  });
});

// =============================================
// Utility Tests
// =============================================

describe('calculateMissionPower', () => {
  it('should sum power of non-hidden characters', () => {
    const characters = [
      {
        instanceId: '1',
        card: createTestCharacter({ power: 3 }),
        hidden: false,
        powerTokens: 2,
        continuousEffects: [],
      },
      {
        instanceId: '2',
        card: createTestCharacter({ power: 4 }),
        hidden: false,
        powerTokens: 0,
        continuousEffects: [],
      },
    ];
    expect(calculateMissionPower(characters)).toBe(9); // 3+2 + 4+0
  });

  it('should exclude hidden characters from power calculation', () => {
    const characters = [
      {
        instanceId: '1',
        card: createTestCharacter({ power: 3 }),
        hidden: false,
        powerTokens: 0,
        continuousEffects: [],
      },
      {
        instanceId: '2',
        card: createTestCharacter({ power: 5 }),
        hidden: true,
        powerTokens: 0,
        continuousEffects: [],
      },
    ];
    expect(calculateMissionPower(characters)).toBe(3);
  });
});

describe('getMissionRankForRound', () => {
  it('should map rounds to correct ranks', () => {
    expect(getMissionRankForRound(1)).toBe(MissionRank.D);
    expect(getMissionRankForRound(2)).toBe(MissionRank.C);
    expect(getMissionRankForRound(3)).toBe(MissionRank.B);
    expect(getMissionRankForRound(4)).toBe(MissionRank.A);
  });
});

describe('getMissionPointValue', () => {
  it('should return correct point values', () => {
    expect(getMissionPointValue(MissionRank.D)).toBe(1);
    expect(getMissionPointValue(MissionRank.C)).toBe(2);
    expect(getMissionPointValue(MissionRank.B)).toBe(3);
    expect(getMissionPointValue(MissionRank.A)).toBe(4);
  });
});

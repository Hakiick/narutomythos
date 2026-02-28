import { describe, it, expect, beforeEach } from 'vitest';
import { decideAIAction, decideAIMulligan, decideAITarget } from '@/lib/game/ai/ai-engine';
import { PREBUILT_DECKS } from '@/lib/game/ai/prebuilt-decks';
import {
  initializeGame,
  keepHand,
  getAvailableActions,
} from '@/lib/game/engine';
import {
  GameActionType,
  type GameCard,
  type GameState,
  type PendingEffect,
} from '@/lib/game/types';
import { resetInstanceCounter } from '@/lib/game/utils';

// =============================================
// Test Helpers
// =============================================

function createTestCharacter(overrides: Partial<GameCard> = {}): GameCard {
  return {
    id: 'TEST-001',
    nameEn: 'Test Character \u2014 Version A',
    nameFr: 'Test Personnage \u2014 Version A',
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
        nameEn: `Character ${i + 1} \u2014 Variant`,
        nameFr: `Personnage ${i + 1} \u2014 Variante`,
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
      type: 'MISSION',
      chakra: 1,
      power: 0,
    }),
    createTestCharacter({
      id: 'M-B',
      nameEn: 'Mission B',
      type: 'MISSION',
      chakra: 2,
      power: 0,
    }),
    createTestCharacter({
      id: 'M-A',
      nameEn: 'Mission A',
      type: 'MISSION',
      chakra: 3,
      power: 0,
    }),
  ];
}

function createActionPhaseState(): GameState {
  let state = initializeGame(
    createTestDeck(),
    createTestMissions(),
    createTestDeck(),
    createTestMissions()
  );
  state = keepHand(state, 'player');
  state = keepHand(state, 'opponent');
  return state;
}

// =============================================
// AI Decision Tests
// =============================================

describe('decideAIAction', () => {
  beforeEach(() => {
    resetInstanceCounter();
  });

  it('should always return a valid action from available actions', () => {
    const state = createActionPhaseState();

    // Make sure it is the AI's turn
    const aiSide = state.turn;
    const decision = decideAIAction(state);

    expect(decision.action.side).toBe(aiSide);
    expect(decision.action.type).toBeDefined();
    expect(decision.reasoning).toBeTruthy();

    // Verify the action type is in available actions
    const available = getAvailableActions(state);
    const actionTypes = available.map((a) => a.type);
    expect(actionTypes).toContain(decision.action.type);
  });

  it('should prefer playing characters over passing when playable', () => {
    let state = createActionPhaseState();

    // Give the current turn player plenty of chakra
    const side = state.turn;
    if (side === 'player') {
      state = { ...state, player: { ...state.player, chakra: 10 } };
    } else {
      state = { ...state, opponent: { ...state.opponent, chakra: 10 } };
    }

    const decision = decideAIAction(state);

    // With high chakra and cards in hand, AI should play rather than pass
    const playActions = [
      GameActionType.PLAY_CHARACTER,
      GameActionType.PLAY_HIDDEN,
      GameActionType.UPGRADE,
      GameActionType.REVEAL,
    ];
    expect(playActions).toContain(decision.action.type);
  });

  it('should pass when no other actions are available', () => {
    let state = createActionPhaseState();

    // Empty the hand and set chakra to 0
    const side = state.turn;
    if (side === 'player') {
      state = {
        ...state,
        player: { ...state.player, hand: [], chakra: 0 },
      };
    } else {
      state = {
        ...state,
        opponent: { ...state.opponent, hand: [], chakra: 0 },
      };
    }

    const decision = decideAIAction(state);
    expect(decision.action.type).toBe(GameActionType.PASS);
  });
});

// =============================================
// AI Mulligan Tests
// =============================================

describe('decideAIMulligan', () => {
  beforeEach(() => {
    resetInstanceCounter();
  });

  it('should mulligan when average cost is too high', () => {
    let state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );

    // Give opponent a hand full of expensive cards
    const expensiveHand = Array.from({ length: 5 }, (_, i) => ({
      instanceId: `exp-${i}`,
      card: createTestCharacter({
        id: `EXP-${i}`,
        nameEn: `Expensive ${i}`,
        chakra: 5,
        power: 5,
      }),
    }));

    state = {
      ...state,
      opponent: { ...state.opponent, hand: expensiveHand },
    };

    const shouldMulligan = decideAIMulligan(state);
    expect(shouldMulligan).toBe(true);
  });

  it('should keep hand with good mix of affordable characters', () => {
    let state = initializeGame(
      createTestDeck(),
      createTestMissions(),
      createTestDeck(),
      createTestMissions()
    );

    // Give opponent a balanced hand
    const balancedHand = [
      {
        instanceId: 'b-1',
        card: createTestCharacter({ chakra: 1, power: 1 }),
      },
      {
        instanceId: 'b-2',
        card: createTestCharacter({ chakra: 2, power: 2 }),
      },
      {
        instanceId: 'b-3',
        card: createTestCharacter({ chakra: 2, power: 3 }),
      },
      {
        instanceId: 'b-4',
        card: createTestCharacter({ chakra: 3, power: 3 }),
      },
      {
        instanceId: 'b-5',
        card: createTestCharacter({ chakra: 3, power: 4 }),
      },
    ];

    state = {
      ...state,
      opponent: { ...state.opponent, hand: balancedHand },
    };

    const shouldMulligan = decideAIMulligan(state);
    expect(shouldMulligan).toBe(false);
  });
});

// =============================================
// AI Target Decision Tests
// =============================================

describe('decideAITarget', () => {
  it('should pick weakest friendly for powerup', () => {
    const state = createActionPhaseState();

    const pendingEffect: PendingEffect = {
      effectType: 'POWERUP',
      sourceInstanceId: 'source',
      side: 'player',
      validTargets: [
        { instanceId: 'weak-char', missionIndex: 0 },
        { instanceId: 'strong-char', missionIndex: 0 },
      ],
      description: 'Choose target for Powerup',
      value: 2,
    };

    // Place characters with different power
    const stateWithChars: GameState = {
      ...state,
      missions: state.missions.map((m, idx) =>
        idx === 0
          ? {
              ...m,
              playerCharacters: [
                {
                  instanceId: 'weak-char',
                  card: createTestCharacter({ power: 1 }),
                  hidden: false,
                  powerTokens: 0,
                  continuousEffects: [],
                },
                {
                  instanceId: 'strong-char',
                  card: createTestCharacter({ power: 5 }),
                  hidden: false,
                  powerTokens: 0,
                  continuousEffects: [],
                },
              ],
            }
          : m
      ),
    };

    const target = decideAITarget(stateWithChars, pendingEffect);
    expect(target).toBe('weak-char');
  });

  it('should pick strongest enemy for defeat', () => {
    const state = createActionPhaseState();

    const pendingEffect: PendingEffect = {
      effectType: 'DEFEAT',
      sourceInstanceId: 'source',
      side: 'player',
      validTargets: [
        { instanceId: 'weak-enemy', missionIndex: 0 },
        { instanceId: 'strong-enemy', missionIndex: 0 },
      ],
      value: 1,
      description: 'Choose target to defeat',
    };

    const stateWithChars: GameState = {
      ...state,
      missions: state.missions.map((m, idx) =>
        idx === 0
          ? {
              ...m,
              opponentCharacters: [
                {
                  instanceId: 'weak-enemy',
                  card: createTestCharacter({ power: 2 }),
                  hidden: false,
                  powerTokens: 0,
                  continuousEffects: [],
                },
                {
                  instanceId: 'strong-enemy',
                  card: createTestCharacter({ power: 6 }),
                  hidden: false,
                  powerTokens: 0,
                  continuousEffects: [],
                },
              ],
            }
          : m
      ),
    };

    const target = decideAITarget(stateWithChars, pendingEffect);
    expect(target).toBe('strong-enemy');
  });
});

// =============================================
// Pre-built Decks Tests
// =============================================

describe('PREBUILT_DECKS', () => {
  it('should have exactly 3 pre-built decks', () => {
    expect(PREBUILT_DECKS).toHaveLength(3);
  });

  it('should have exactly 30 cards in each deck', () => {
    for (const deck of PREBUILT_DECKS) {
      expect(deck.cardIds).toHaveLength(30);
    }
  });

  it('should have max 2 copies of any card in each deck', () => {
    for (const deck of PREBUILT_DECKS) {
      const counts: Record<string, number> = {};
      for (const id of deck.cardIds) {
        counts[id] = (counts[id] || 0) + 1;
      }
      for (const [id, count] of Object.entries(counts)) {
        expect(
          count,
          `Deck "${deck.nameEn}" has ${count} copies of ${id} (max 2 allowed)`
        ).toBeLessThanOrEqual(2);
      }
    }
  });

  it('should have exactly 3 mission cards in each deck', () => {
    for (const deck of PREBUILT_DECKS) {
      expect(deck.missionCardIds).toHaveLength(3);
    }
  });

  it('should have valid card IDs (KS-XXX or KS-MXX format)', () => {
    for (const deck of PREBUILT_DECKS) {
      for (const id of deck.cardIds) {
        expect(id).toMatch(/^KS-\d{3}$/);
      }
      for (const id of deck.missionCardIds) {
        expect(id).toMatch(/^KS-M\d{2}$/);
      }
    }
  });

  it('should have all required metadata', () => {
    for (const deck of PREBUILT_DECKS) {
      expect(deck.id).toBeTruthy();
      expect(deck.nameEn).toBeTruthy();
      expect(deck.nameFr).toBeTruthy();
      expect(deck.descriptionEn).toBeTruthy();
      expect(deck.descriptionFr).toBeTruthy();
    }
  });
});

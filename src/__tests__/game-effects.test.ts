import { describe, it, expect } from 'vitest';
import { parseEffects } from '@/lib/game/effects/parser';
import {
  EffectActionType,
  EffectTarget,
  EffectTiming,
  EffectTrigger,
} from '@/lib/game/effects/types';
import { applyEffects } from '@/lib/game/effects/executor';
import { executeEndPhase, initializeGame } from '@/lib/game/engine';
import {
  GamePhase,
  MissionRank,
  type GameCard,
  type GameState,
} from '@/lib/game/types';

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

function createBaseGameState(): GameState {
  return {
    phase: GamePhase.ACTION,
    round: 1,
    turn: 'player',
    missions: [
      {
        rank: MissionRank.D,
        missionCard: createTestCharacter({ type: 'MISSION' }),
        playerCharacters: [
          {
            instanceId: 'player-char-1',
            card: createTestCharacter({
              nameEn: 'Naruto Uzumaki \u2014 Genin',
              power: 3,
              group: 'Leaf Village',
            }),
            hidden: false,
            powerTokens: 0,
            continuousEffects: [],
          },
          {
            instanceId: 'player-char-2',
            card: createTestCharacter({
              nameEn: 'Sasuke Uchiha \u2014 Genin',
              power: 4,
              group: 'Leaf Village',
            }),
            hidden: false,
            powerTokens: 0,
            continuousEffects: [],
          },
        ],
        opponentCharacters: [
          {
            instanceId: 'opponent-char-1',
            card: createTestCharacter({
              nameEn: 'Zabuza Momochi \u2014 Executioner',
              power: 5,
              group: 'Independent',
            }),
            hidden: false,
            powerTokens: 0,
            continuousEffects: [],
          },
        ],
        resolved: false,
        winner: null,
      },
      {
        rank: MissionRank.C,
        missionCard: null,
        playerCharacters: [],
        opponentCharacters: [],
        resolved: false,
        winner: null,
      },
      {
        rank: MissionRank.B,
        missionCard: null,
        playerCharacters: [],
        opponentCharacters: [],
        resolved: false,
        winner: null,
      },
      {
        rank: MissionRank.A,
        missionCard: null,
        playerCharacters: [],
        opponentCharacters: [],
        resolved: false,
        winner: null,
      },
    ],
    player: {
      hand: [],
      deck: [],
      discardPile: [],
      missionCards: [],
      selectedMissions: [],
      chakra: 5,
      missionPoints: 0,
      edgeTokens: 0,
      hasPassed: false,
      hasEdge: true,
      mulliganDone: true,
    },
    opponent: {
      hand: [],
      deck: [
        { instanceId: 'opp-deck-1', card: createTestCharacter() },
        { instanceId: 'opp-deck-2', card: createTestCharacter() },
      ],
      discardPile: [],
      missionCards: [],
      selectedMissions: [],
      chakra: 5,
      missionPoints: 0,
      edgeTokens: 0,
      hasPassed: false,
      hasEdge: false,
      mulliganDone: true,
    },
    missionDeck: [],
    actionHistory: [],
    winner: null,
    consecutivePasses: 0,
    pendingEffect: null,
    effectLog: [],
    revealedInfo: null,
  };
}

// =============================================
// Parser Tests
// =============================================

describe('parseEffects', () => {
  it('should parse MAIN instant Powerup effect', () => {
    const effects = parseEffects(
      'MAIN \u26A1 Powerup 2 another friendly Leaf Village character.'
    );

    expect(effects).toHaveLength(1);
    expect(effects[0].trigger).toBe(EffectTrigger.MAIN);
    expect(effects[0].timing).toBe(EffectTiming.INSTANT);
    expect(effects[0].action).toBe(EffectActionType.POWERUP);
    expect(effects[0].value).toBe(2);
    expect(effects[0].target).toBe(EffectTarget.ANOTHER_FRIENDLY);
    expect(effects[0].targetFilter?.group).toBe('Leaf Village');
  });

  it('should parse AMBUSH instant Powerup self', () => {
    const effects = parseEffects('AMBUSH \u26A1 Powerup 2 this character.');

    expect(effects).toHaveLength(1);
    expect(effects[0].trigger).toBe(EffectTrigger.AMBUSH);
    expect(effects[0].timing).toBe(EffectTiming.INSTANT);
    expect(effects[0].action).toBe(EffectActionType.POWERUP);
    expect(effects[0].value).toBe(2);
    expect(effects[0].target).toBe(EffectTarget.SELF);
  });

  it('should parse SCORE power boost to all friendly at mission', () => {
    const effects = parseEffects(
      'SCORE \u26A1 +2 Power to all friendly characters at this mission.'
    );

    expect(effects).toHaveLength(1);
    expect(effects[0].trigger).toBe(EffectTrigger.SCORE);
    expect(effects[0].timing).toBe(EffectTiming.INSTANT);
    expect(effects[0].action).toBe(EffectActionType.POWER_BOOST);
    expect(effects[0].value).toBe(2);
    expect(effects[0].target).toBe(EffectTarget.ALL_FRIENDLY);
    expect(effects[0].targetFilter?.atMission).toBe(true);
  });

  it('should parse MAIN continuous Chakra gain', () => {
    const effects = parseEffects('MAIN \u2716 Chakra +1.');

    expect(effects).toHaveLength(1);
    expect(effects[0].trigger).toBe(EffectTrigger.MAIN);
    expect(effects[0].timing).toBe(EffectTiming.CONTINUOUS);
    expect(effects[0].action).toBe(EffectActionType.GAIN_CHAKRA);
    expect(effects[0].value).toBe(1);
  });

  it('should parse Draw card effect', () => {
    const effects = parseEffects('MAIN \u26A1 Draw 1 card.');

    expect(effects).toHaveLength(1);
    expect(effects[0].action).toBe(EffectActionType.DRAW);
    expect(effects[0].value).toBe(1);
  });

  it('should parse multi-line effects', () => {
    const effects = parseEffects(
      'MAIN \u26A1 Play a Leaf Village character anywhere paying 1 less.\nUPGRADE \u26A1 Powerup 2 the character played with the MAIN effect.'
    );

    expect(effects).toHaveLength(2);
    expect(effects[0].trigger).toBe(EffectTrigger.MAIN);
    expect(effects[1].trigger).toBe(EffectTrigger.UPGRADE);
  });

  it('should parse MAIN defeat effect with power filter', () => {
    const effects = parseEffects(
      'MAIN \u26A1 Defeat 1 character with 1 or less Power.'
    );

    expect(effects).toHaveLength(1);
    expect(effects[0].action).toBe(EffectActionType.DEFEAT);
    expect(effects[0].value).toBe(1);
    expect(effects[0].targetFilter?.powerMax).toBe(1);
  });

  it('should parse AMBUSH hide effect', () => {
    const effects = parseEffects(
      'AMBUSH \u26A1 Hide 1 opposing character at this mission.'
    );

    expect(effects).toHaveLength(1);
    expect(effects[0].action).toBe(EffectActionType.HIDE);
    expect(effects[0].value).toBe(1);
    expect(effects[0].target).toBe(EffectTarget.ENEMY);
    expect(effects[0].targetFilter?.atMission).toBe(true);
  });

  it('should parse move effect', () => {
    const effects = parseEffects(
      'MAIN \u26A1 Move 1 opposing character at this mission.'
    );

    expect(effects).toHaveLength(1);
    expect(effects[0].action).toBe(EffectActionType.MOVE);
    expect(effects[0].value).toBe(1);
  });

  it('should parse UPGRADE Gain Chakra', () => {
    const effects = parseEffects('UPGRADE \u26A1 Gain 3 Chakra.');

    expect(effects).toHaveLength(1);
    expect(effects[0].trigger).toBe(EffectTrigger.UPGRADE);
    expect(effects[0].action).toBe(EffectActionType.GAIN_CHAKRA);
    expect(effects[0].value).toBe(3);
  });

  it('should parse Powerup self (no target specified)', () => {
    const effects = parseEffects('MAIN \u26A1 Powerup 3.');

    expect(effects).toHaveLength(1);
    expect(effects[0].action).toBe(EffectActionType.POWERUP);
    expect(effects[0].value).toBe(3);
    expect(effects[0].target).toBe(EffectTarget.SELF);
  });

  it('should parse COPY_EFFECT', () => {
    const effects = parseEffects(
      'MAIN \u26A1 Copy a non-upgrade instant effect.'
    );

    expect(effects).toHaveLength(1);
    expect(effects[0].action).toBe(EffectActionType.COPY_EFFECT);
  });

  it('should return UNRESOLVED for unknown text', () => {
    const effects = parseEffects(
      'MAIN \u26A1 Something completely unknown happens.'
    );

    expect(effects).toHaveLength(1);
    expect(effects[0].action).toBe(EffectActionType.UNRESOLVED);
  });

  it('should return empty array for null effect', () => {
    const effects = parseEffects(null);
    expect(effects).toHaveLength(0);
  });

  it('should parse paying less effect', () => {
    const effects = parseEffects(
      'MAIN \u2716 Paying 2 less for each friendly Leaf Village character at this mission.'
    );

    expect(effects).toHaveLength(1);
    expect(effects[0].action).toBe(EffectActionType.PAYING_LESS);
    expect(effects[0].value).toBe(2);
    expect(effects[0].timing).toBe(EffectTiming.CONTINUOUS);
  });

  it('should parse remove power tokens effect', () => {
    const effects = parseEffects(
      'MAIN \u26A1 Remove up to 2 Power tokens from an enemy character in play.'
    );

    expect(effects).toHaveLength(1);
    expect(effects[0].action).toBe(EffectActionType.REMOVE_POWER);
    expect(effects[0].value).toBe(2);
    expect(effects[0].target).toBe(EffectTarget.ENEMY);
  });

  it('should parse AMBUSH Powerup 1 self shorthand', () => {
    const effects = parseEffects('AMBUSH \u26A1 Powerup 1.');

    expect(effects).toHaveLength(1);
    expect(effects[0].trigger).toBe(EffectTrigger.AMBUSH);
    expect(effects[0].action).toBe(EffectActionType.POWERUP);
    expect(effects[0].value).toBe(1);
    expect(effects[0].target).toBe(EffectTarget.SELF);
  });
});

// =============================================
// Executor Tests
// =============================================

describe('applyEffects', () => {
  it('should apply POWERUP on SELF', () => {
    const state = createBaseGameState();
    const effects = parseEffects('MAIN \u26A1 Powerup 3.');

    const newState = applyEffects(
      state,
      effects,
      EffectTrigger.MAIN,
      'player-char-1',
      'player',
      0
    );

    const char = newState.missions[0].playerCharacters.find(
      (c) => c.instanceId === 'player-char-1'
    );
    expect(char?.powerTokens).toBe(3);
  });

  it('should apply GAIN_CHAKRA to player', () => {
    const state = createBaseGameState();
    const effects = parseEffects('UPGRADE \u26A1 Gain 3 Chakra.');

    const newState = applyEffects(
      state,
      effects,
      EffectTrigger.UPGRADE,
      'player-char-1',
      'player',
      0
    );

    expect(newState.player.chakra).toBe(8); // 5 + 3
  });

  it('should apply DRAW to add cards to hand', () => {
    const state = createBaseGameState();
    // Give player some deck cards
    const stateWithDeck = {
      ...state,
      player: {
        ...state.player,
        deck: [
          { instanceId: 'deck-1', card: createTestCharacter() },
          { instanceId: 'deck-2', card: createTestCharacter() },
        ],
      },
    };

    const effects = parseEffects('MAIN \u26A1 Draw 1 card.');

    const newState = applyEffects(
      stateWithDeck,
      effects,
      EffectTrigger.MAIN,
      'player-char-1',
      'player',
      0
    );

    expect(newState.player.hand).toHaveLength(1);
    expect(newState.player.deck).toHaveLength(1);
  });

  it('should only apply effects for matching trigger', () => {
    const state = createBaseGameState();
    const effects = parseEffects(
      'MAIN \u26A1 Powerup 3.\nUPGRADE \u26A1 Gain 2 Chakra.'
    );

    // Apply only MAIN trigger
    const newState = applyEffects(
      state,
      effects,
      EffectTrigger.MAIN,
      'player-char-1',
      'player',
      0
    );

    const char = newState.missions[0].playerCharacters.find(
      (c) => c.instanceId === 'player-char-1'
    );
    expect(char?.powerTokens).toBe(3);
    // Chakra should not have changed (UPGRADE effect not triggered)
    expect(newState.player.chakra).toBe(5);
  });

  it('should set pendingEffect when multiple valid targets for POWERUP', () => {
    const state = createBaseGameState();
    const effects = parseEffects(
      'MAIN \u26A1 Powerup 2 another friendly Leaf Village character.'
    );

    // Both player-char-1 and player-char-2 are valid targets (both Leaf Village, not self)
    // But we're applying from a hypothetical third character
    const stateWith3Chars = {
      ...state,
      missions: state.missions.map((m, idx) =>
        idx === 0
          ? {
              ...m,
              playerCharacters: [
                ...m.playerCharacters,
                {
                  instanceId: 'player-char-3',
                  card: createTestCharacter({
                    nameEn: 'Kakashi \u2014 Teacher',
                    group: 'Leaf Village',
                  }),
                  hidden: false,
                  powerTokens: 0,
                  continuousEffects: [],
                },
              ],
            }
          : m
      ),
    };

    const newState = applyEffects(
      stateWith3Chars,
      effects,
      EffectTrigger.MAIN,
      'player-char-3',
      'player',
      0
    );

    // Should have a pending effect since there are 2 valid targets
    expect(newState.pendingEffect).not.toBeNull();
    expect(newState.pendingEffect?.effectType).toBe('POWERUP');
  });
});

// =============================================
// New Effect Parser Tests
// =============================================

describe('parseEffects — new patterns', () => {
  it('should parse TAKE_CONTROL', () => {
    const effects = parseEffects(
      'MAIN \u26A1 Take control of an enemy character with cost 3 or less.'
    );

    expect(effects).toHaveLength(1);
    expect(effects[0].action).toBe(EffectActionType.TAKE_CONTROL);
    expect(effects[0].target).toBe(EffectTarget.ENEMY);
    expect(effects[0].targetFilter?.costMax).toBe(3);
  });

  it('should parse LOOK_AT hand', () => {
    const effects = parseEffects(
      "MAIN \u26A1 Look at the opponent's hand."
    );

    expect(effects).toHaveLength(1);
    expect(effects[0].action).toBe(EffectActionType.LOOK_AT);
  });

  it('should parse PLACE_FROM_DECK', () => {
    const effects = parseEffects(
      'MAIN \u26A1 Place the top 1 card of your deck as a hidden character.'
    );

    expect(effects).toHaveLength(1);
    expect(effects[0].action).toBe(EffectActionType.PLACE_FROM_DECK);
    expect(effects[0].value).toBe(1);
  });

  it('should parse RETURN_TO_HAND continuous', () => {
    const effects = parseEffects(
      'MAIN \u2716 At the end of the round, return this character to your hand.'
    );

    expect(effects).toHaveLength(1);
    expect(effects[0].action).toBe(EffectActionType.RETURN_TO_HAND);
    expect(effects[0].timing).toBe(EffectTiming.CONTINUOUS);
  });

  it('should parse PLAY_CHARACTER with cost reduction', () => {
    const effects = parseEffects(
      'MAIN \u26A1 Play a Leaf Village character anywhere paying 1 less.'
    );

    expect(effects).toHaveLength(1);
    expect(effects[0].action).toBe(EffectActionType.PLAY_CHARACTER);
    expect(effects[0].value).toBe(1);
    expect(effects[0].targetFilter?.group).toBe('Leaf Village');
  });
});

// =============================================
// New Executor Tests
// =============================================

describe('applyEffects — new effects', () => {
  it('should attach RETURN_TO_HAND continuous effect', () => {
    const state = createBaseGameState();
    const effects = parseEffects(
      'MAIN \u2716 At the end of the round, return this character to your hand.'
    );

    const newState = applyEffects(
      state,
      effects,
      EffectTrigger.MAIN,
      'player-char-1',
      'player',
      0
    );

    const char = newState.missions[0].playerCharacters.find(
      (c) => c.instanceId === 'player-char-1'
    );
    expect(char?.continuousEffects).toHaveLength(1);
    expect(char?.continuousEffects[0].type).toBe('RETURN_TO_HAND');
  });

  it('should place cards from deck as hidden with PLACE_FROM_DECK', () => {
    const state = createBaseGameState();
    // Give player deck cards
    const stateWithDeck = {
      ...state,
      player: {
        ...state.player,
        deck: [
          { instanceId: 'deck-1', card: createTestCharacter({ nameEn: 'Clone A' }) },
          { instanceId: 'deck-2', card: createTestCharacter({ nameEn: 'Clone B' }) },
        ],
      },
    };

    const effects = parseEffects(
      'MAIN \u26A1 Place the top 2 cards of your deck as hidden characters.'
    );

    const newState = applyEffects(
      stateWithDeck,
      effects,
      EffectTrigger.MAIN,
      'player-char-1',
      'player',
      0
    );

    // 2 original + 2 placed = 4 player characters at mission 0
    expect(newState.missions[0].playerCharacters).toHaveLength(4);
    // Placed characters should be hidden
    const placed = newState.missions[0].playerCharacters.filter((c) => c.hidden);
    expect(placed).toHaveLength(2);
    // Deck should be empty
    expect(newState.player.deck).toHaveLength(0);
  });

  it('should reveal opponent hand with LOOK_AT', () => {
    const state = createBaseGameState();
    const stateWithOppHand = {
      ...state,
      opponent: {
        ...state.opponent,
        hand: [
          { instanceId: 'opp-hand-1', card: createTestCharacter({ nameEn: 'Secret Card' }) },
        ],
      },
    };

    const effects = parseEffects("MAIN \u26A1 Look at the opponent's hand.");

    const newState = applyEffects(
      stateWithOppHand,
      effects,
      EffectTrigger.MAIN,
      'player-char-1',
      'player',
      0
    );

    expect(newState.revealedInfo).not.toBeNull();
    expect(newState.revealedInfo?.type).toBe('hand');
    expect(newState.revealedInfo?.cards).toHaveLength(1);
    expect(newState.revealedInfo?.cards[0].nameEn).toBe('Secret Card');
  });

  it('should set pending effect for TAKE_CONTROL with multiple targets', () => {
    const state = createBaseGameState();
    // Add a second opponent character
    const stateWith2Opp = {
      ...state,
      missions: state.missions.map((m, idx) =>
        idx === 0
          ? {
              ...m,
              opponentCharacters: [
                ...m.opponentCharacters,
                {
                  instanceId: 'opponent-char-2',
                  card: createTestCharacter({
                    nameEn: 'Haku — Ice Mirror',
                    chakra: 2,
                    power: 2,
                  }),
                  hidden: false,
                  powerTokens: 0,
                  continuousEffects: [],
                },
              ],
            }
          : m
      ),
    };

    const effects = parseEffects(
      'MAIN \u26A1 Take control of an enemy character with cost 3 or less.'
    );

    const newState = applyEffects(
      stateWith2Opp,
      effects,
      EffectTrigger.MAIN,
      'player-char-1',
      'player',
      0
    );

    expect(newState.pendingEffect).not.toBeNull();
    expect(newState.pendingEffect?.effectType).toBe('TAKE_CONTROL');
  });
});

// =============================================
// Engine Tests
// =============================================

describe('engine', () => {
  it('should return characters with RETURN_TO_HAND to hand at end of round', () => {
    const state = createBaseGameState();
    // Attach RETURN_TO_HAND to player-char-1
    const stateWithReturn = {
      ...state,
      phase: GamePhase.END as GamePhase,
      missions: state.missions.map((m, idx) =>
        idx === 0
          ? {
              ...m,
              playerCharacters: m.playerCharacters.map((c) =>
                c.instanceId === 'player-char-1'
                  ? {
                      ...c,
                      continuousEffects: [
                        {
                          effectId: 'ce-1',
                          sourceInstanceId: 'player-char-1',
                          type: 'RETURN_TO_HAND',
                          value: 1,
                        },
                      ],
                    }
                  : c
              ),
            }
          : m
      ),
    };

    const newState = executeEndPhase(stateWithReturn);

    // player-char-1 should be removed from mission
    const missionChars = newState.missions[0].playerCharacters;
    expect(missionChars.find((c) => c.instanceId === 'player-char-1')).toBeUndefined();
    // player-char-2 should still be on mission
    expect(missionChars.find((c) => c.instanceId === 'player-char-2')).toBeDefined();
    // player-char-1 should be back in hand
    expect(newState.player.hand.find((c) => c.instanceId === 'player-char-1')).toBeDefined();
  });

  it('should select 3 missions per player', () => {
    const playerDeck = Array.from({ length: 30 }, (_, i) =>
      createTestCharacter({ id: `P-${i}`, nameEn: `Player Card ${i}`, cardNumber: i })
    );
    const opponentDeck = Array.from({ length: 30 }, (_, i) =>
      createTestCharacter({ id: `O-${i}`, nameEn: `Opponent Card ${i}`, cardNumber: i + 100 })
    );
    const playerMissions = [
      createTestCharacter({ id: 'M-1', type: 'MISSION', nameEn: 'Mission P1' }),
      createTestCharacter({ id: 'M-2', type: 'MISSION', nameEn: 'Mission P2' }),
      createTestCharacter({ id: 'M-3', type: 'MISSION', nameEn: 'Mission P3' }),
    ];
    const opponentMissions = [
      createTestCharacter({ id: 'M-4', type: 'MISSION', nameEn: 'Mission O1' }),
      createTestCharacter({ id: 'M-5', type: 'MISSION', nameEn: 'Mission O2' }),
      createTestCharacter({ id: 'M-6', type: 'MISSION', nameEn: 'Mission O3' }),
    ];

    const gameState = initializeGame(playerDeck, playerMissions, opponentDeck, opponentMissions);

    // Each player should have 3 selected missions
    expect(gameState.player.selectedMissions).toHaveLength(3);
    expect(gameState.opponent.selectedMissions).toHaveLength(3);
    // Total mission deck should be 6 (3+3 shuffled together)
    expect(gameState.missionDeck).toHaveLength(6);
  });
});

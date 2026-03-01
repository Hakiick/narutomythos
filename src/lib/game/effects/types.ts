// =============================================
// Effect System Types
// =============================================

export enum EffectTrigger {
  MAIN = 'MAIN',
  UPGRADE = 'UPGRADE',
  AMBUSH = 'AMBUSH',
  SCORE = 'SCORE',
}

export enum EffectTiming {
  INSTANT = 'INSTANT',
  CONTINUOUS = 'CONTINUOUS',
}

export enum EffectActionType {
  POWERUP = 'POWERUP',
  GAIN_CHAKRA = 'GAIN_CHAKRA',
  STEAL_CHAKRA = 'STEAL_CHAKRA',
  DRAW = 'DRAW',
  MOVE = 'MOVE',
  DEFEAT = 'DEFEAT',
  HIDE = 'HIDE',
  POWER_BOOST = 'POWER_BOOST',
  REMOVE_POWER = 'REMOVE_POWER',
  PAYING_LESS = 'PAYING_LESS',
  DISCARD = 'DISCARD',
  PLAY_CHARACTER = 'PLAY_CHARACTER',
  TAKE_CONTROL = 'TAKE_CONTROL',
  LOOK_AT = 'LOOK_AT',
  PLACE_FROM_DECK = 'PLACE_FROM_DECK',
  RETURN_TO_HAND = 'RETURN_TO_HAND',
  COPY_EFFECT = 'COPY_EFFECT',

  // --- New effect types ---
  /** Defeat ALL matching targets (mass defeat) */
  DEFEAT_ALL = 'DEFEAT_ALL',
  /** Hide ALL matching targets (mass hide) */
  HIDE_ALL = 'HIDE_ALL',
  /** Set a character's effective power to 0 */
  SET_POWER_ZERO = 'SET_POWER_ZERO',
  /** Reduce a character's power by N (negative powerup) */
  REDUCE_POWER = 'REDUCE_POWER',
  /** Opponent draws cards */
  OPPONENT_DRAW = 'OPPONENT_DRAW',
  /** Opponent gains chakra */
  OPPONENT_GAIN_CHAKRA = 'OPPONENT_GAIN_CHAKRA',
  /** Opponent discards cards */
  OPPONENT_DISCARD = 'OPPONENT_DISCARD',
  /** Both players draw */
  BOTH_DRAW = 'BOTH_DRAW',
  /** Character retains power tokens at end of round */
  RETAIN_POWER = 'RETAIN_POWER',
  /** Play a character from the discard pile */
  PLAY_FROM_DISCARD = 'PLAY_FROM_DISCARD',
  /** Retrieve a card from discard pile to hand */
  RETRIEVE_FROM_DISCARD = 'RETRIEVE_FROM_DISCARD',
  /** Protection: can't be hidden or defeated by enemy effects */
  PROTECTION = 'PROTECTION',
  /** Movement restriction: enemies cannot move from this mission */
  RESTRICT_MOVEMENT = 'RESTRICT_MOVEMENT',
  /** Cost reduction aura: keyword characters cost N less to play */
  COST_REDUCTION = 'COST_REDUCTION',

  UNRESOLVED = 'UNRESOLVED',
}

export enum EffectTarget {
  SELF = 'SELF',
  ANOTHER_FRIENDLY = 'ANOTHER_FRIENDLY',
  ALL_FRIENDLY = 'ALL_FRIENDLY',
  ENEMY = 'ENEMY',
  ALL_ENEMY = 'ALL_ENEMY',
  ANY = 'ANY',
}

export interface EffectEvent {
  id: string;
  timestamp: number;
  action: EffectActionType;
  value: number;
  sourceCardNameEn: string;
  sourceCardNameFr: string;
  targetCardNameEn?: string;
  targetCardNameFr?: string;
  side: 'player' | 'opponent';
  missionIndex: number;
}

export interface ParsedEffect {
  trigger: EffectTrigger;
  timing: EffectTiming;
  action: EffectActionType;
  value: number;
  target: EffectTarget;
  targetFilter?: {
    group?: string;
    keyword?: string;
    powerMax?: number;
    costMax?: number;
    atMission?: boolean;
    hidden?: boolean;
    lowestCost?: boolean;
    /** Variable X: computed at execution time based on game state */
    variable?: 'HIDDEN_COUNT' | 'SOUND_FOUR_MISSIONS' | 'DISCARDED_COST' | 'DISCARDED_COUNT';
    /** For "any mission" placement effects */
    anyMission?: boolean;
  };
  rawText: string;
}

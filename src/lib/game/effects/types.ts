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
  };
  rawText: string;
}

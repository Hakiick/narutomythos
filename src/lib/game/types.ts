// =============================================
// Game State Types for Naruto Mythos TCG Engine
// =============================================

export enum GamePhase {
  MULLIGAN = 'MULLIGAN',
  START = 'START',
  ACTION = 'ACTION',
  MISSION_EVALUATION = 'MISSION_EVALUATION',
  END = 'END',
  GAME_OVER = 'GAME_OVER',
}

export enum MissionRank {
  D = 'D',
  C = 'C',
  B = 'B',
  A = 'A',
}

export enum GameActionType {
  PLAY_CHARACTER = 'PLAY_CHARACTER',
  PLAY_HIDDEN = 'PLAY_HIDDEN',
  REVEAL = 'REVEAL',
  UPGRADE = 'UPGRADE',
  PLAY_JUTSU = 'PLAY_JUTSU',
  PASS = 'PASS',
  MULLIGAN = 'MULLIGAN',
  KEEP_HAND = 'KEEP_HAND',
}

export type PlayerSide = 'player' | 'opponent';

/** Lightweight game card (no DB metadata) */
export interface GameCard {
  id: string;
  nameEn: string;
  nameFr: string;
  type: 'CHARACTER' | 'MISSION' | 'JUTSU';
  rarity: string;
  chakra: number;
  power: number;
  keywords: string[];
  group: string | null;
  effectEn: string | null;
  effectFr: string | null;
  imageUrl: string | null;
  set: string;
  cardNumber: number;
}

/** Card instance in the game (unique per copy in deck) */
export interface GameCardInstance {
  instanceId: string;
  card: GameCard;
}

/** A character deployed on the field */
export interface DeployedCharacter {
  instanceId: string;
  card: GameCard;
  hidden: boolean;
  powerTokens: number;
  continuousEffects: ContinuousEffect[];
}

export interface ContinuousEffect {
  effectId: string;
  sourceInstanceId: string;
  type: string;
  value: number;
  condition?: string;
}

/** Mission slot on the board */
export interface MissionSlot {
  rank: MissionRank;
  missionCard: GameCard | null;
  playerCharacters: DeployedCharacter[];
  opponentCharacters: DeployedCharacter[];
  resolved: boolean;
  winner: PlayerSide | 'tie' | null;
}

/** Player's state */
export interface PlayerState {
  hand: GameCardInstance[];
  deck: GameCardInstance[];
  discardPile: GameCardInstance[];
  missionCards: GameCard[];
  selectedMissions: GameCard[];
  chakra: number;
  missionPoints: number;
  edgeTokens: number;
  hasPassed: boolean;
  hasEdge: boolean;
  mulliganDone: boolean;
}

/** Full game state (immutable, create new objects) */
export interface GameState {
  phase: GamePhase;
  round: number;
  turn: PlayerSide;
  missions: MissionSlot[];
  player: PlayerState;
  opponent: PlayerState;
  missionDeck: GameCard[];
  actionHistory: GameAction[];
  winner: PlayerSide | 'draw' | null;
  consecutivePasses: number;
  pendingEffect: PendingEffect | null;
}

/** Action taken by a player */
export interface GameAction {
  type: GameActionType;
  side: PlayerSide;
  data?: {
    cardInstanceId?: string;
    missionIndex?: number;
    targetInstanceId?: string;
    description?: string;
  };
  timestamp: number;
}

/** Available action for UI */
export interface AvailableAction {
  type: GameActionType;
  cardInstanceId?: string;
  validMissions?: number[];
  upgradeTargets?: { instanceId: string; missionIndex: number }[];
  jutsuTargets?: { instanceId: string; missionIndex: number }[];
  cost?: number;
  description?: string;
}

/** Pending effect requiring player choice */
export interface PendingEffect {
  effectType: string;
  sourceInstanceId: string;
  side: PlayerSide;
  validTargets: { instanceId: string; missionIndex: number }[];
  description: string;
  value: number;
  step?: 'SELECT_CHARACTER' | 'SELECT_DESTINATION';
  moveData?: { characterInstanceId: string; fromMissionIndex: number };
}

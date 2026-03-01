// =============================================
// Game Engine Utilities
// =============================================

import {
  MissionRank,
  type DeployedCharacter,
  type GameCard,
  type GameCardInstance,
  type GameState,
  type MissionSlot,
  type PlayerSide,
  type PlayerState,
} from './types';

let instanceCounter = 0;

/** Fisher-Yates shuffle — returns a new array. */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Generate a simple unique instance ID. */
export function generateInstanceId(): string {
  instanceCounter++;
  return `inst_${Date.now()}_${instanceCounter}_${Math.random().toString(36).substring(2, 8)}`;
}

/** Reset instance counter (useful for testing). */
export function resetInstanceCounter(): void {
  instanceCounter = 0;
}

/** Convert raw card data (from Prisma / JSON) to GameCard, defaulting nulls. */
export function toGameCards(
  cards: Array<{
    id: string;
    nameEn: string;
    nameFr: string;
    type: 'CHARACTER' | 'MISSION' | 'JUTSU';
    rarity: string;
    chakra: number | null;
    power: number | null;
    keywords: string[];
    group: string | null;
    effectEn: string | null;
    effectFr: string | null;
    imageUrl: string | null;
    set: string;
    cardNumber: number;
  }>
): GameCard[] {
  return cards.map((card) => ({
    id: card.id,
    nameEn: card.nameEn,
    nameFr: card.nameFr,
    type: card.type,
    rarity: card.rarity,
    chakra: card.chakra ?? 0,
    power: card.power ?? 0,
    keywords: card.keywords,
    group: card.group,
    effectEn: card.effectEn,
    effectFr: card.effectFr,
    imageUrl: card.imageUrl,
    set: card.set,
    cardNumber: card.cardNumber,
  }));
}

/** Wrap GameCards with unique instance IDs. */
export function toGameCardInstances(cards: GameCard[]): GameCardInstance[] {
  return cards.map((card) => ({
    instanceId: generateInstanceId(),
    card,
  }));
}

/** Get power bonus for a character from a mission card's passive effect. */
export function getMissionPowerBonus(
  char: DeployedCharacter,
  effectText: string | null | undefined
): number {
  if (!effectText || char.hidden) return 0;

  // "All non-hidden characters ... +1 Power" (e.g., KS-M02 Chunin Exam)
  const allBonusMatch = effectText.match(
    /[Aa]ll\s+non-hidden\s+characters.*?\+(\d+)\s+[Pp]ower/
  );
  if (allBonusMatch) {
    return parseInt(allBonusMatch[1], 10);
  }

  // "Characters with N Power or more ... +N Power" (e.g., KS-M09 Protect the Leader)
  const conditionalMatch = effectText.match(
    /[Cc]haracters?\s+with\s+(\d+)\s+[Pp]ower\s+or\s+more.*?\+(\d+)\s+[Pp]ower/
  );
  if (conditionalMatch) {
    const minPower = parseInt(conditionalMatch[1], 10);
    const bonus = parseInt(conditionalMatch[2], 10);
    if (char.card.power + char.powerTokens >= minPower) {
      return bonus;
    }
  }

  return 0;
}

/** Calculate total power at a mission for one side. Hidden characters contribute 0. */
export function calculateMissionPower(
  characters: DeployedCharacter[],
  missionCard?: GameCard | null
): number {
  return characters.reduce((total, char) => {
    if (char.hidden) return total;
    const missionBonus = getMissionPowerBonus(char, missionCard?.effectEn);
    // Individual character power cannot go below 0 (powerTokens can be negative from SET_POWER_ZERO/REDUCE_POWER)
    const charPower = Math.max(0, char.card.power + char.powerTokens + missionBonus);
    return total + charPower;
  }, 0);
}

/** Get mission rank for a given round number (1-4). */
export function getMissionRankForRound(round: number): MissionRank {
  const mapping: Record<number, MissionRank> = {
    1: MissionRank.D,
    2: MissionRank.C,
    3: MissionRank.B,
    4: MissionRank.A,
  };
  return mapping[round] ?? MissionRank.D;
}

/** Get point value for a mission rank. */
export function getMissionPointValue(rank: MissionRank): number {
  const values: Record<MissionRank, number> = {
    [MissionRank.D]: 1,
    [MissionRank.C]: 2,
    [MissionRank.B]: 3,
    [MissionRank.A]: 4,
  };
  return values[rank];
}

/** Get a player's state from the game state. */
export function getPlayerState(state: GameState, side: PlayerSide): PlayerState {
  return side === 'player' ? state.player : state.opponent;
}

/** Return a new GameState with updated player state for one side. */
export function updatePlayerState(
  state: GameState,
  side: PlayerSide,
  updates: Partial<PlayerState>
): GameState {
  if (side === 'player') {
    return { ...state, player: { ...state.player, ...updates } };
  }
  return { ...state, opponent: { ...state.opponent, ...updates } };
}

/** Extract the base character name (before " — "). */
export function getCharacterBaseName(card: GameCard): string {
  const parts = card.nameEn.split(' \u2014 ');
  return parts[0];
}

/** Check if a mission already has a character with the given base name for one side. */
export function hasCharacterWithName(
  mission: MissionSlot,
  side: PlayerSide,
  baseName: string
): boolean {
  const characters =
    side === 'player' ? mission.playerCharacters : mission.opponentCharacters;
  return characters.some(
    (char) => getCharacterBaseName(char.card) === baseName
  );
}

/** Count total deployed characters across all missions for one side. */
export function countCharactersOnField(
  missions: MissionSlot[],
  side: PlayerSide
): number {
  return missions.reduce((total, mission) => {
    const characters =
      side === 'player'
        ? mission.playerCharacters
        : mission.opponentCharacters;
    return total + characters.length;
  }, 0);
}

/** Draw N cards from a player's deck. Returns updated hand and deck. */
export function drawCards(
  playerState: PlayerState,
  count: number
): { hand: GameCardInstance[]; deck: GameCardInstance[] } {
  const drawn = playerState.deck.slice(0, count);
  const remainingDeck = playerState.deck.slice(count);
  return {
    hand: [...playerState.hand, ...drawn],
    deck: remainingDeck,
  };
}

/** Get the characters array for a side from a mission slot. */
export function getMissionCharacters(
  mission: MissionSlot,
  side: PlayerSide
): DeployedCharacter[] {
  return side === 'player'
    ? mission.playerCharacters
    : mission.opponentCharacters;
}

/** Return a new MissionSlot with updated characters for a given side. */
export function updateMissionCharacters(
  mission: MissionSlot,
  side: PlayerSide,
  characters: DeployedCharacter[]
): MissionSlot {
  if (side === 'player') {
    return { ...mission, playerCharacters: characters };
  }
  return { ...mission, opponentCharacters: characters };
}

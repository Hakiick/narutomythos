// =============================================
// Effect Text Parser
// =============================================

import {
  EffectActionType,
  EffectTarget,
  EffectTiming,
  EffectTrigger,
  type ParsedEffect,
} from './types';

const VILLAGE_NAMES = [
  'Leaf Village',
  'Hidden Mist Village',
  'Sound Village',
  'Sand Village',
  'Akatsuki',
];

const KEYWORD_NAMES = [
  'Team 7',
  'Team 8',
  'Team 10',
  'Team Guy',
  'Team Baki',
  'Sound Four',
  'Sannin',
  'Hokage',
  'Genin',
  'Jutsu',
  'Kekkei Genkai',
  'Taijutsu',
  'Weapon',
  'Summon',
  'Tailed Beast',
  'Rogue Ninja',
  'Sound Ninja',
  'Special Jonin',
  'Ninja Hound',
];

/** Parse the trigger from the beginning of a line. */
function parseTrigger(line: string): EffectTrigger | null {
  if (line.startsWith('UPGRADE')) return EffectTrigger.UPGRADE;
  if (line.startsWith('AMBUSH')) return EffectTrigger.AMBUSH;
  if (line.startsWith('SCORE')) return EffectTrigger.SCORE;
  if (line.startsWith('MAIN')) return EffectTrigger.MAIN;
  return null;
}

/** Parse the timing symbol from a line. */
function parseTiming(line: string): EffectTiming {
  if (line.includes('\u26A1')) return EffectTiming.INSTANT;
  if (line.includes('\u2716')) return EffectTiming.CONTINUOUS;
  // Default to instant if no symbol found
  return EffectTiming.INSTANT;
}

/** Detect the target from the action text. */
function parseTarget(text: string): EffectTarget {
  const lower = text.toLowerCase();
  if (lower.includes('all friendly') || lower.includes('all other friendly')) {
    return EffectTarget.ALL_FRIENDLY;
  }
  if (lower.includes('all enemy') || lower.includes('all opposing') || lower.includes('all hidden enemy')) {
    return EffectTarget.ALL_ENEMY;
  }
  if (
    lower.includes('another friendly') ||
    lower.includes('other friendly') ||
    lower.includes('a friendly')
  ) {
    return EffectTarget.ANOTHER_FRIENDLY;
  }
  if (
    lower.includes('this character') ||
    lower.includes('this card') ||
    /^powerup \d+\.?$/i.test(text.trim())
  ) {
    return EffectTarget.SELF;
  }
  if (
    lower.includes('opposing') ||
    lower.includes('enemy') ||
    lower.includes('opponent')
  ) {
    return EffectTarget.ENEMY;
  }
  // "each player" → special handling in executor
  if (lower.includes('each player')) {
    return EffectTarget.ANY;
  }
  return EffectTarget.ANY;
}

/** Extract target filters (group, keyword, power constraint, at-mission, hidden). */
function parseTargetFilter(text: string): ParsedEffect['targetFilter'] {
  const filter: ParsedEffect['targetFilter'] = {};

  for (const village of VILLAGE_NAMES) {
    if (text.includes(village)) {
      filter.group = village;
      break;
    }
  }

  for (const keyword of KEYWORD_NAMES) {
    if (text.includes(keyword)) {
      filter.keyword = keyword;
      break;
    }
  }

  const powerMaxMatch = text.match(
    /(?:with\s+)?(?:[Pp]ower\s+)?(\d+)\s+or\s+less\s+[Pp]ower/i
  );
  if (powerMaxMatch) {
    filter.powerMax = parseInt(powerMaxMatch[1], 10);
  }
  // Also handle "with Power N or less" (different word order)
  const powerMaxAlt = text.match(/[Pp]ower\s+(\d+)\s+or\s+less/i);
  if (!powerMaxMatch && powerMaxAlt) {
    filter.powerMax = parseInt(powerMaxAlt[1], 10);
  }
  // "the Power limit is N or less"
  const powerLimitAlt = text.match(/[Pp]ower\s+limit\s+is\s+(\d+)\s+or\s+less/i);
  if (powerLimitAlt) {
    filter.powerMax = parseInt(powerLimitAlt[1], 10);
  }

  const costMaxMatch = text.match(
    /(?:with\s+)?(?:cost|costing)\s+(\d+)\s+or\s+less/i
  );
  if (costMaxMatch) {
    filter.costMax = parseInt(costMaxMatch[1], 10);
  }
  // "the cost limit is N or less"
  const costLimitAlt = text.match(/cost\s+limit\s+is\s+(\d+)\s+or\s+less/i);
  if (costLimitAlt) {
    filter.costMax = parseInt(costLimitAlt[1], 10);
  }
  // "there's no cost limit" → effectively infinite
  if (/there'?s\s+no\s+cost\s+limit/i.test(text)) {
    filter.costMax = 99;
  }

  if (text.toLowerCase().includes('in this mission') || text.toLowerCase().includes('at this mission')) {
    filter.atMission = true;
  }

  if (text.toLowerCase().includes('hidden enemy') || text.toLowerCase().includes('hidden character')) {
    filter.hidden = true;
  }

  // Lowest cost filter
  if (/lowest\s+cost/i.test(text)) {
    filter.lowestCost = true;
  }

  // Variable X patterns
  if (/X\s+is\s+the\s+number\s+of\s+friendly\s+hidden/i.test(text)) {
    filter.variable = 'HIDDEN_COUNT';
  } else if (/X\s+is\s+the\s+number\s+of\s+missions\s+where.*Sound\s+Four/i.test(text)) {
    filter.variable = 'SOUND_FOUR_MISSIONS';
  } else if (/X\s+(?:where\s+)?(?:is\s+)?the\s+(?:cost|number).*discard/i.test(text)) {
    filter.variable = 'DISCARDED_COST';
  }

  // "Any mission" scope
  if (/in\s+any\s+mission/i.test(text) || /to\s+any\s+mission/i.test(text)) {
    filter.anyMission = true;
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}

/** Parse the action type and value from the action text. */
function parseAction(
  text: string
): { action: EffectActionType; value: number } {
  // === Mass/All patterns (check before single-target patterns) ===

  // "Defeat all [hidden] enemy characters [with Power N or less] [in this mission]"
  if (/[Dd]efeat\s+all\s+(?:hidden\s+)?(?:enemy|opposing)/i.test(text)) {
    const powerMatch = text.match(/[Pp]ower\s+(\d+)\s+or\s+less/i);
    const value = powerMatch ? parseInt(powerMatch[1], 10) : 99;
    return { action: EffectActionType.DEFEAT_ALL, value };
  }

  // "Hide all other characters in this mission with less Power than this character"
  if (/[Hh]ide\s+all\s+(?:other\s+)?characters/i.test(text)) {
    return { action: EffectActionType.HIDE_ALL, value: 0 };
  }

  // === Set/Reduce power ===

  // "Set that character's Power to 0"
  if (/[Ss]et\s+(?:that\s+)?(?:character'?s?\s+)?[Pp]ower\s+to\s+0/i.test(text)) {
    return { action: EffectActionType.SET_POWER_ZERO, value: 0 };
  }

  // "That character has -N Power" / "loses all Power tokens and has its Power set to 0"
  const reducePowerMatch = text.match(/has\s+\-(\d+)\s+[Pp]ower/);
  if (reducePowerMatch) {
    return { action: EffectActionType.REDUCE_POWER, value: parseInt(reducePowerMatch[1], 10) };
  }
  if (/loses\s+all\s+[Pp]ower\s+tokens.*[Pp]ower\s+set\s+to\s+0/i.test(text)) {
    return { action: EffectActionType.SET_POWER_ZERO, value: 0 };
  }

  // === Opponent-affecting effects ===

  // "Each player draws a card"
  if (/[Ee]ach\s+player\s+draws?\s+(?:a\s+)?(\d+)?\s*card/i.test(text)) {
    const match = text.match(/[Ee]ach\s+player\s+draws?\s+(?:a\s+)?(\d+)?\s*card/i);
    const val = match && match[1] ? parseInt(match[1], 10) : 1;
    return { action: EffectActionType.BOTH_DRAW, value: val };
  }

  // "Opponent draws a card"
  if (/[Oo]pponent\s+draws?\s+(?:a\s+)?(\d+)?\s*card/i.test(text)) {
    const match = text.match(/[Oo]pponent\s+draws?\s+(?:a\s+)?(\d+)?\s*card/i);
    const val = match && match[1] ? parseInt(match[1], 10) : 1;
    return { action: EffectActionType.OPPONENT_DRAW, value: val };
  }

  // "Opponent gains N Chakra"
  if (/[Oo]pponent\s+gains?\s+(\d+)\s+[Cc]hakra/i.test(text)) {
    const match = text.match(/[Oo]pponent\s+gains?\s+(\d+)\s+[Cc]hakra/i);
    return { action: EffectActionType.OPPONENT_GAIN_CHAKRA, value: match ? parseInt(match[1], 10) : 1 };
  }

  // "Opponent discards a card from hand"
  if (/[Oo]pponent\s+discards?\s+(?:a\s+)?(\d+)?\s*card/i.test(text)) {
    const match = text.match(/[Oo]pponent\s+discards?\s+(?:a\s+)?(\d+)?\s*card/i);
    const val = match && match[1] ? parseInt(match[1], 10) : 1;
    return { action: EffectActionType.OPPONENT_DISCARD, value: val };
  }

  // "The opponent must discard a card"
  if (/opponent\s+must\s+discard/i.test(text)) {
    return { action: EffectActionType.OPPONENT_DISCARD, value: 1 };
  }

  // === Protection ===
  // "Can't be hidden or defeated by enemy effects"
  if (/[Cc]an'?t\s+be\s+(?:hidden|defeated).*(?:enemy|opposing)\s+effects/i.test(text)) {
    return { action: EffectActionType.PROTECTION, value: 1 };
  }
  // "Friendly characters in this mission cannot be hidden or defeated by enemy effects"
  if (/cannot\s+be\s+(?:hidden|defeated).*(?:enemy|opposing)\s+effects/i.test(text)) {
    return { action: EffectActionType.PROTECTION, value: 1 };
  }

  // === Movement restriction ===
  // "Enemy characters cannot move from this mission"
  if (/characters?\s+cannot\s+move\s+from\s+this\s+mission/i.test(text)) {
    return { action: EffectActionType.RESTRICT_MOVEMENT, value: 1 };
  }

  // === Cost reduction aura ===
  // "Other Team 8 characters cost 1 less (min. 1) to play"
  const costReductionMatch = text.match(/cost\s+(\d+)\s+less.*to\s+play/i);
  if (costReductionMatch) {
    return { action: EffectActionType.COST_REDUCTION, value: parseInt(costReductionMatch[1], 10) };
  }

  // === Retain power tokens ===
  if (/doesn'?t\s+lose\s+[Pp]ower\s+tokens/i.test(text)) {
    return { action: EffectActionType.RETAIN_POWER, value: 1 };
  }

  // === Retrieve from discard ===
  if (/choose\s+one\s+character\s+in\s+your\s+discard\s+pile\s+and\s+put/i.test(text)) {
    return { action: EffectActionType.RETRIEVE_FROM_DISCARD, value: 1 };
  }

  // === Play from discard pile ===
  if (/[Pp]lay\s+(?:the\s+)?(?:character\s+)?(?:at\s+)?(?:the\s+)?top\s+(?:card\s+)?of\s+your\s+discard/i.test(text)) {
    const costRedMatch = text.match(/[Pp]aying\s+(\d+)\s+less/);
    const value = costRedMatch ? parseInt(costRedMatch[1], 10) : 0;
    return { action: EffectActionType.PLAY_FROM_DISCARD, value };
  }
  if (/[Pp]lay\s+(?:the\s+)?top\s+(?:card\s+)?of\s+your\s+discard/i.test(text)) {
    const costRedMatch = text.match(/[Pp]aying\s+(\d+)\s+less/);
    const value = costRedMatch ? parseInt(costRedMatch[1], 10) : 0;
    return { action: EffectActionType.PLAY_FROM_DISCARD, value };
  }
  // "Choose one of your Leaf Village characters in your discard pile and play it"
  if (/in\s+your\s+discard\s+pile\s+and\s+play/i.test(text)) {
    const costRedMatch = text.match(/[Pp]aying\s+(\d+)\s+less/);
    const value = costRedMatch ? parseInt(costRedMatch[1], 10) : 0;
    return { action: EffectActionType.PLAY_FROM_DISCARD, value };
  }

  // === Standard patterns (unchanged + improved) ===

  // Powerup N (check for variable X)
  const powerupMatch = text.match(/[Pp]owerup\s+(\d+|X)/);
  if (powerupMatch) {
    if (powerupMatch[1] === 'X') {
      // Variable powerup — value will be computed at runtime
      return { action: EffectActionType.POWERUP, value: -1 }; // -1 signals "variable"
    }
    return { action: EffectActionType.POWERUP, value: parseInt(powerupMatch[1], 10) };
  }

  // +N Power
  const powerBoostMatch = text.match(/\+(\d+)\s+[Pp]ower/);
  if (powerBoostMatch) {
    return {
      action: EffectActionType.POWER_BOOST,
      value: parseInt(powerBoostMatch[1], 10),
    };
  }

  // Steal N Chakra (must be before Gain Chakra)
  const stealMatch = text.match(/[Ss]teal\s+(\d+)\s+[Cc]hakra/);
  if (stealMatch) {
    return { action: EffectActionType.STEAL_CHAKRA, value: parseInt(stealMatch[1], 10) };
  }

  // Gain N Chakra / Chakra +N / Chakra +X
  const gainChakraMatch = text.match(
    /[Gg]ain\s+(\d+)\s+[Cc]hakra|[Cc]hakra\s*\+(\d+|X)/
  );
  if (gainChakraMatch) {
    const val = gainChakraMatch[1] || gainChakraMatch[2];
    if (val === 'X') return { action: EffectActionType.GAIN_CHAKRA, value: -1 }; // variable
    return { action: EffectActionType.GAIN_CHAKRA, value: parseInt(val, 10) };
  }

  // Draw N card(s) / Draw X card(s)
  const drawMatch = text.match(/[Dd]raw\s+(\d+|a|X)\s+card/);
  if (drawMatch) {
    if (drawMatch[1] === 'X') return { action: EffectActionType.DRAW, value: -1 }; // variable
    const val = drawMatch[1] === 'a' ? 1 : parseInt(drawMatch[1], 10);
    return { action: EffectActionType.DRAW, value: val };
  }

  // "Defeat up to N enemy character(s)" (single/limited defeat)
  const defeatUpToMatch = text.match(/[Dd]efeat\s+up\s+to\s+(\d+)/);
  if (defeatUpToMatch) {
    return { action: EffectActionType.DEFEAT, value: parseInt(defeatUpToMatch[1], 10) };
  }

  // Defeat a/an/1 character
  const defeatMatch = text.match(/[Dd]efeat\s+(\d+|a|an)\s/);
  if (defeatMatch) {
    const val =
      defeatMatch[1] === 'a' || defeatMatch[1] === 'an'
        ? 1
        : parseInt(defeatMatch[1], 10);
    return { action: EffectActionType.DEFEAT, value: val };
  }

  // "Defeat that character" (from compound upgrade effects)
  if (/[Dd]efeat\s+that\s+character/i.test(text)) {
    return { action: EffectActionType.DEFEAT, value: 1 };
  }

  // Move X friendly character(s) (variable)
  if (/[Mm]ove\s+X\s+(?:friendly\s+)?character/i.test(text)) {
    return { action: EffectActionType.MOVE, value: -1 }; // variable
  }

  // "Move any [friendly/enemy] character [in play/from this mission]"
  if (/[Mm]ove\s+any\s+(?:friendly\s+)?(?:enemy\s+)?character/i.test(text)) {
    return { action: EffectActionType.MOVE, value: 1 };
  }

  // "Move another [adj] character from this mission"
  if (/[Mm]ove\s+another\s/i.test(text)) {
    return { action: EffectActionType.MOVE, value: 1 };
  }

  // Move a/an/this/1 character
  const moveMatch = text.match(/[Mm]ove\s+(\d+|a|an|this)\s/);
  if (moveMatch) {
    const val =
      moveMatch[1] === 'a' || moveMatch[1] === 'an' || moveMatch[1] === 'this'
        ? 1
        : parseInt(moveMatch[1], 10);
    return { action: EffectActionType.MOVE, value: val };
  }

  // "Hide the non-hidden enemy character with the lowest cost"
  if (/[Hh]ide\s+the\s+non-hidden\s+enemy/i.test(text)) {
    return { action: EffectActionType.HIDE, value: 1 };
  }

  // "Hide an [enemy] character"
  const hideMatch = text.match(/[Hh]ide\s+(\d+|a|an)\s/);
  if (hideMatch) {
    const val =
      hideMatch[1] === 'a' || hideMatch[1] === 'an'
        ? 1
        : parseInt(hideMatch[1], 10);
    return { action: EffectActionType.HIDE, value: val };
  }

  // "Hide another enemy character"
  if (/[Hh]ide\s+another\s+enemy/i.test(text)) {
    return { action: EffectActionType.HIDE, value: 1 };
  }

  // "Hide that character [if its Power is 0 or less]"
  if (/[Hh]ide\s+that\s+character/i.test(text)) {
    return { action: EffectActionType.HIDE, value: 1 };
  }

  // Remove power tokens
  if (/[Rr]emove.*[Pp]ower\s*[Tt]okens?/i.test(text)) {
    const removeMatch = text.match(/[Rr]emove\s+(?:up\s+to\s+)?(\d+|all)/i);
    const val = removeMatch
      ? removeMatch[1] === 'all'
        ? 99
        : parseInt(removeMatch[1], 10)
      : 1;
    return { action: EffectActionType.REMOVE_POWER, value: val };
  }

  // Play a character (extract cost reduction if present) — must be before PAYING_LESS
  if (/[Pp]lay\s+.*character/i.test(text)) {
    const costRedMatch = text.match(/[Pp]aying\s+(\d+)\s+less/);
    const value = costRedMatch ? parseInt(costRedMatch[1], 10) : 0;
    return { action: EffectActionType.PLAY_CHARACTER, value };
  }

  // Paying N less
  const payingLessMatch = text.match(/[Pp]aying\s+(\d+)\s+less/);
  if (payingLessMatch) {
    return {
      action: EffectActionType.PAYING_LESS,
      value: parseInt(payingLessMatch[1], 10),
    };
  }

  // "Discard the top N cards of the opponent's deck" (mill effect)
  if (/[Dd]iscard\s+the\s+top\s+(\d+)\s+cards?\s+of\s+(?:the\s+)?opponent/i.test(text)) {
    const match = text.match(/top\s+(\d+)/);
    const val = match ? parseInt(match[1], 10) : 1;
    return { action: EffectActionType.OPPONENT_DISCARD, value: val };
  }

  // "Discard the top card of your opponent's deck"
  if (/[Dd]iscard\s+the\s+top\s+card\s+of\s+(?:your\s+)?opponent/i.test(text)) {
    return { action: EffectActionType.OPPONENT_DISCARD, value: 1 };
  }

  // "Discard the top card from/of your deck" (self mill)
  if (/[Dd]iscard\s+the\s+top\s+card\s+(?:from|of)\s+your\s+deck/i.test(text)) {
    return { action: EffectActionType.DISCARD, value: 1 };
  }

  // Discard
  const discardMatch = text.match(/[Dd]iscard\s+(\d+|a)\s+card/);
  if (discardMatch) {
    const val = discardMatch[1] === 'a' ? 1 : parseInt(discardMatch[1], 10);
    return { action: EffectActionType.DISCARD, value: val };
  }

  // Upgrade limit modifiers: "the cost limit is N or less" / "the Power limit is N or less"
  const costLimitMatch = text.match(/the\s+cost\s+limit\s+is\s+(\d+)\s+or\s+less/i);
  if (costLimitMatch) {
    return { action: EffectActionType.TAKE_CONTROL, value: 1 }; // reuses TAKE_CONTROL with updated costMax in filter
  }
  const powerLimitMatch = text.match(/the\s+[Pp]ower\s+limit\s+is\s+(\d+)\s+or\s+less/i);
  if (powerLimitMatch) {
    return { action: EffectActionType.DEFEAT, value: 1 }; // reuses DEFEAT with updated powerMax in filter
  }
  // "there's no cost limit"
  if (/there'?s\s+no\s+cost\s+limit/i.test(text)) {
    return { action: EffectActionType.TAKE_CONTROL, value: 1 };
  }
  // "defeat both of them"
  if (/defeat\s+both\s+of\s+them/i.test(text)) {
    return { action: EffectActionType.DEFEAT, value: 2 };
  }

  // Take control of an enemy character
  if (/[Tt]ake\s+control/i.test(text)) {
    return { action: EffectActionType.TAKE_CONTROL, value: 1 };
  }

  // Look at opponent's hand or hidden characters
  if (/[Ll]ook\s+at/i.test(text)) {
    return { action: EffectActionType.LOOK_AT, value: 1 };
  }

  // Place from deck as hidden character
  const placeFromDeckMatch = text.match(
    /[Pp]lace\s+(?:the\s+top\s+)?(\d+)\s+card/i
  );
  if (placeFromDeckMatch) {
    return {
      action: EffectActionType.PLACE_FROM_DECK,
      value: parseInt(placeFromDeckMatch[1], 10),
    };
  }
  // "Place the top card of your deck"
  if (/[Pp]lace\s+the\s+top\s+card\s+of\s+your\s+deck/i.test(text)) {
    return { action: EffectActionType.PLACE_FROM_DECK, value: 1 };
  }

  // "Place a card from your hand as a hidden character"
  if (/[Pp]lace\s+a\s+card\s+from\s+your\s+hand\s+as\s+a\s+hidden/i.test(text)) {
    return { action: EffectActionType.PLACE_FROM_DECK, value: 1 }; // reuse, but from hand
  }

  // Return to hand at end of round
  if (/[Rr]eturn\s+.*(?:to\s+(?:your|its\s+owner'?s?)\s+hand|hand)/i.test(text)) {
    return { action: EffectActionType.RETURN_TO_HAND, value: 1 };
  }
  // "take back this character in hand"
  if (/take\s+back\s+this\s+character\s+in\s+hand/i.test(text)) {
    return { action: EffectActionType.RETURN_TO_HAND, value: 1 };
  }

  // Copy effect
  if (/[Cc]opy\s+.*effect/i.test(text)) {
    return { action: EffectActionType.COPY_EFFECT, value: 1 };
  }

  return { action: EffectActionType.UNRESOLVED, value: 0 };
}

/** Parse effect text from a card into structured ParsedEffect array. */
export function parseEffects(effectText: string | null): ParsedEffect[] {
  if (!effectText) return [];

  const lines = effectText.split('\n');
  const results: ParsedEffect[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Handle "UPGRADE MAIN effect:" compound trigger pattern
    // This means: when played as upgrade, the MAIN effect is replaced by this version
    const upgradeMainMatch = trimmed.match(/^UPGRADE\s+MAIN\s+effect:\s*(.*)/i);
    if (upgradeMainMatch) {
      const remainder = upgradeMainMatch[1].trim();
      const timing = parseTiming(trimmed);

      // Strip "Instead," / "In addition," prefix
      const actionText = remainder
        .replace(/^Instead,?\s*/i, '')
        .replace(/^In\s+addition,?\s*/i, '')
        .replace(/^[\u26A1\u2716]\s*/, '')
        .trim();

      if (actionText) {
        const { action, value } = parseAction(actionText);
        const target = parseTarget(actionText);
        const targetFilter = parseTargetFilter(actionText);
        results.push({
          trigger: EffectTrigger.UPGRADE,
          timing,
          action,
          value,
          target,
          targetFilter,
          rawText: trimmed,
        });
      } else {
        results.push({
          trigger: EffectTrigger.UPGRADE,
          timing,
          action: EffectActionType.UNRESOLVED,
          value: 0,
          target: EffectTarget.ANY,
          rawText: trimmed,
        });
      }
      continue;
    }

    // Handle "UPGRADE AMBUSH effect:" compound trigger
    const upgradeAmbushMatch = trimmed.match(/^UPGRADE\s+AMBUSH\s+effect:\s*(.*)/i);
    if (upgradeAmbushMatch) {
      const remainder = upgradeAmbushMatch[1].trim();
      const timing = parseTiming(trimmed);
      const actionText = remainder
        .replace(/^Instead,?\s*/i, '')
        .replace(/^In\s+addition,?\s*/i, '')
        .replace(/^[\u26A1\u2716]\s*/, '')
        .trim();

      if (actionText) {
        const protText = actionText.replace(/\(([^)]*)\)/g, (match) => match.replace(/\./g, '\u0000'));
        const sentences = protText.split(/\.\s+/)
          .map((s) => s.replace(/\u0000/g, '.').replace(/\.$/, '').trim())
          .filter(Boolean);
        for (const sentence of sentences) {
          const { action, value } = parseAction(sentence);
          const target = parseTarget(sentence);
          const targetFilter = parseTargetFilter(sentence);
          results.push({
            trigger: EffectTrigger.AMBUSH, // fires on ambush (upgrade version)
            timing,
            action,
            value,
            target,
            targetFilter,
            rawText: trimmed,
          });
        }
      }
      continue;
    }

    const trigger = parseTrigger(trimmed);
    if (trigger === null) {
      // Line without a recognized trigger — check if it's a mission passive effect
      const timing = parseTiming(trimmed);
      const strippedText = trimmed.replace(/^[\u26A1\u2716]\s*/, '').trim();
      const { action, value } = parseAction(strippedText);

      if (action !== EffectActionType.UNRESOLVED) {
        // Mission passives or passive effects without explicit trigger
        const target = parseTarget(strippedText);
        const targetFilter = parseTargetFilter(strippedText);
        results.push({
          trigger: EffectTrigger.MAIN,
          timing,
          action,
          value,
          target,
          targetFilter,
          rawText: trimmed,
        });
      } else {
        results.push({
          trigger: EffectTrigger.MAIN,
          timing,
          action: EffectActionType.UNRESOLVED,
          value: 0,
          target: EffectTarget.ANY,
          rawText: trimmed,
        });
      }
      continue;
    }

    const timing = parseTiming(trimmed);

    // Extract the action text after the trigger and timing symbol
    let actionText = trimmed;
    // Remove trigger prefix
    actionText = actionText.replace(/^(UPGRADE\s+AMBUSH|UPGRADE\s+MAIN|MAIN|UPGRADE|AMBUSH|SCORE)\s*/, '');
    // Remove timing symbol and extra whitespace
    actionText = actionText.replace(/^[\u26A1\u2716]\s*/, '').trim();

    // Strip "Target a friendly ... in play." prefix for jutsu effects
    actionText = actionText.replace(/^Target\s+a\s+friendly\s+.*?\s+in\s+play\.\s*/i, '').trim();

    // Split compound effects: "Steal 1 Chakra. Powerup 1." → multiple effects
    // Protect periods inside parentheses (e.g., "(min. 1)") by temporarily replacing them
    const protectedText = actionText.replace(/\(([^)]*)\)/g, (match) => match.replace(/\./g, '\u0000'));
    const rawSentences = protectedText.split(/\.\s+/)
      .map((s) => s.replace(/\u0000/g, '.').replace(/\.$/, '').trim())
      .filter(Boolean);

    // Merge auxiliary sentences into actionable ones:
    // - "Choose an enemy character in this mission" → targeting prefix, merge with next
    // - "X is the number of ..." → variable declaration, merge with previous
    const sentences: string[] = [];
    for (let s = 0; s < rawSentences.length; s++) {
      const sent = rawSentences[s];
      // "Choose a/an/one enemy/friendly character..." is a targeting prefix
      if (/^Choose\s+(?:a|an|one)\s+(?:enemy|friendly)/i.test(sent) && s + 1 < rawSentences.length) {
        sentences.push(sent + '. ' + rawSentences[s + 1]);
        s++; // skip next
        continue;
      }
      // "X is the number of..." is a variable declaration, append to previous
      if (/^X\s+is\s+the\s+number/i.test(sent) && sentences.length > 0) {
        sentences[sentences.length - 1] += '. ' + sent;
        continue;
      }
      // "X where X is..." same pattern
      if (/^where\s+X\s+is/i.test(sent) && sentences.length > 0) {
        sentences[sentences.length - 1] += '. ' + sent;
        continue;
      }
      sentences.push(sent);
    }

    if (sentences.length > 1) {
      for (const sentence of sentences) {
        const { action, value } = parseAction(sentence);
        const target = parseTarget(sentence);
        const targetFilter = parseTargetFilter(sentence);
        results.push({
          trigger,
          timing,
          action,
          value,
          target,
          targetFilter,
          rawText: trimmed,
        });
      }
    } else {
      const text = sentences[0] || actionText;
      const { action, value } = parseAction(text);
      const target = parseTarget(text);
      const targetFilter = parseTargetFilter(text);

      results.push({
        trigger,
        timing,
        action,
        value,
        target,
        targetFilter,
        rawText: trimmed,
      });
    }
  }

  return results;
}

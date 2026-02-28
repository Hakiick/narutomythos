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
  if (lower.includes('all enemy') || lower.includes('all opposing')) {
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
  return EffectTarget.ANY;
}

/** Extract target filters (group, keyword, power constraint, at-mission). */
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
    /(?:with\s+)?(\d+)\s+or\s+less\s+[Pp]ower/i
  );
  if (powerMaxMatch) {
    filter.powerMax = parseInt(powerMaxMatch[1], 10);
  }

  if (text.toLowerCase().includes('in this mission') || text.toLowerCase().includes('at this mission')) {
    filter.atMission = true;
  }

  return Object.keys(filter).length > 0 ? filter : undefined;
}

/** Parse the action type and value from the action text. */
function parseAction(
  text: string
): { action: EffectActionType; value: number } {
  // Powerup N
  const powerupMatch = text.match(/[Pp]owerup\s+(\d+)/);
  if (powerupMatch) {
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

  // Gain N Chakra / Chakra +N
  const gainChakraMatch = text.match(
    /[Gg]ain\s+(\d+)\s+[Cc]hakra|[Cc]hakra\s*\+(\d+)/
  );
  if (gainChakraMatch) {
    const val = gainChakraMatch[1] || gainChakraMatch[2];
    return { action: EffectActionType.GAIN_CHAKRA, value: parseInt(val, 10) };
  }

  // Draw N card(s)
  const drawMatch = text.match(/[Dd]raw\s+(\d+|a)\s+card/);
  if (drawMatch) {
    const val = drawMatch[1] === 'a' ? 1 : parseInt(drawMatch[1], 10);
    return { action: EffectActionType.DRAW, value: val };
  }

  // Defeat
  const defeatMatch = text.match(/[Dd]efeat\s+(\d+|a|an)\s/);
  if (defeatMatch) {
    const val =
      defeatMatch[1] === 'a' || defeatMatch[1] === 'an'
        ? 1
        : parseInt(defeatMatch[1], 10);
    return { action: EffectActionType.DEFEAT, value: val };
  }

  // Move
  const moveMatch = text.match(/[Mm]ove\s+(\d+|a|an|this)\s/);
  if (moveMatch) {
    const val =
      moveMatch[1] === 'a' || moveMatch[1] === 'an' || moveMatch[1] === 'this'
        ? 1
        : parseInt(moveMatch[1], 10);
    return { action: EffectActionType.MOVE, value: val };
  }

  // Hide
  const hideMatch = text.match(/[Hh]ide\s+(\d+|a|an)\s/);
  if (hideMatch) {
    const val =
      hideMatch[1] === 'a' || hideMatch[1] === 'an'
        ? 1
        : parseInt(hideMatch[1], 10);
    return { action: EffectActionType.HIDE, value: val };
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

  // Paying N less
  const payingLessMatch = text.match(/[Pp]aying\s+(\d+)\s+less/);
  if (payingLessMatch) {
    return {
      action: EffectActionType.PAYING_LESS,
      value: parseInt(payingLessMatch[1], 10),
    };
  }

  // Discard
  const discardMatch = text.match(/[Dd]iscard\s+(\d+|a)\s+card/);
  if (discardMatch) {
    const val = discardMatch[1] === 'a' ? 1 : parseInt(discardMatch[1], 10);
    return { action: EffectActionType.DISCARD, value: val };
  }

  // Play a character
  if (/[Pp]lay\s+.*character/i.test(text)) {
    return { action: EffectActionType.PLAY_CHARACTER, value: 1 };
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

    const trigger = parseTrigger(trimmed);
    if (trigger === null) {
      // Line without a recognized trigger — skip or mark unresolved
      results.push({
        trigger: EffectTrigger.MAIN,
        timing: parseTiming(trimmed),
        action: EffectActionType.UNRESOLVED,
        value: 0,
        target: EffectTarget.ANY,
        rawText: trimmed,
      });
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
    const sentences = actionText.split(/\.\s+/).map((s) => s.replace(/\.$/, '').trim()).filter(Boolean);

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
      const { action, value } = parseAction(actionText);
      const target = parseTarget(actionText);
      const targetFilter = parseTargetFilter(actionText);

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

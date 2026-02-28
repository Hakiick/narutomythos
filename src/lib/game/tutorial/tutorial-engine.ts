// =============================================
// Tutorial Engine — Step definitions & state
// =============================================

export type TutorialHighlight =
  | 'hand'
  | 'mission-active'
  | 'chakra'
  | 'pass-button'
  | 'hidden-toggle'
  | 'score'
  | 'board'
  | 'none';

export interface TutorialStep {
  id: string;
  titleKey: string;
  descKey: string;
  highlight: TutorialHighlight;
  /** If true, wait for the player to perform an action before advancing */
  waitForAction: boolean;
  /** If set, auto-advance after this many ms */
  autoAdvanceMs?: number;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    titleKey: 'tutorial.welcome',
    descKey: 'tutorial.welcomeDesc',
    highlight: 'none',
    waitForAction: false,
  },
  {
    id: 'your-hand',
    titleKey: 'tutorial.yourHand',
    descKey: 'tutorial.yourHandDesc',
    highlight: 'hand',
    waitForAction: false,
  },
  {
    id: 'the-mission',
    titleKey: 'tutorial.theMission',
    descKey: 'tutorial.theMissionDesc',
    highlight: 'mission-active',
    waitForAction: false,
  },
  {
    id: 'your-chakra',
    titleKey: 'tutorial.yourChakra',
    descKey: 'tutorial.yourChakraDesc',
    highlight: 'chakra',
    waitForAction: false,
  },
  {
    id: 'play-a-card',
    titleKey: 'tutorial.playACard',
    descKey: 'tutorial.playACardDesc',
    highlight: 'hand',
    waitForAction: true,
  },
  {
    id: 'choose-mission',
    titleKey: 'tutorial.chooseMission',
    descKey: 'tutorial.chooseMissionDesc',
    highlight: 'mission-active',
    waitForAction: true,
  },
  {
    id: 'opponent-turn',
    titleKey: 'tutorial.opponentTurn',
    descKey: 'tutorial.opponentTurnDesc',
    highlight: 'board',
    waitForAction: false,
    autoAdvanceMs: 3000,
  },
  {
    id: 'play-hidden',
    titleKey: 'tutorial.playHidden',
    descKey: 'tutorial.playHiddenDesc',
    highlight: 'hidden-toggle',
    waitForAction: false,
  },
  {
    id: 'passing',
    titleKey: 'tutorial.passing',
    descKey: 'tutorial.passingDesc',
    highlight: 'pass-button',
    waitForAction: false,
  },
  {
    id: 'evaluation',
    titleKey: 'tutorial.evaluation',
    descKey: 'tutorial.evaluationDesc',
    highlight: 'board',
    waitForAction: false,
    autoAdvanceMs: 3000,
  },
  {
    id: 'scoring',
    titleKey: 'tutorial.scoring',
    descKey: 'tutorial.scoringDesc',
    highlight: 'score',
    waitForAction: false,
  },
  {
    id: 'next-round',
    titleKey: 'tutorial.nextRound',
    descKey: 'tutorial.nextRoundDesc',
    highlight: 'board',
    waitForAction: false,
  },
  {
    id: 'upgrading',
    titleKey: 'tutorial.upgrading',
    descKey: 'tutorial.upgradingDesc',
    highlight: 'hand',
    waitForAction: false,
  },
  {
    id: 'final-round',
    titleKey: 'tutorial.finalRound',
    descKey: 'tutorial.finalRoundDesc',
    highlight: 'mission-active',
    waitForAction: false,
  },
  {
    id: 'results',
    titleKey: 'tutorial.results',
    descKey: 'tutorial.resultsDesc',
    highlight: 'score',
    waitForAction: false,
  },
  {
    id: 'complete',
    titleKey: 'tutorial.complete',
    descKey: 'tutorial.completeDesc',
    highlight: 'none',
    waitForAction: false,
  },
];

const TUTORIAL_STORAGE_KEY = 'naruto-mythos-tutorial-completed';

export function isTutorialCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(TUTORIAL_STORAGE_KEY) === 'true';
}

export function markTutorialCompleted(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
}

export function resetTutorialProgress(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TUTORIAL_STORAGE_KEY);
}

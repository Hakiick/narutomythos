'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GameBoard } from '@/components/game/GameBoard';
import { MulliganView } from '@/components/game/MulliganView';
import { GameOverScreen } from '@/components/game/GameOverScreen';
import { MissionEvaluation } from '@/components/game/MissionEvaluation';
import { TutorialOverlay } from '@/components/game/TutorialOverlay';
import { useGameState } from '@/hooks/useGameState';
import { GameThemeProvider } from '@/hooks/useGameTheme';
import { GamePhase, type GameCard } from '@/lib/game/types';
import { toGameCards } from '@/lib/game/utils';
import { PREBUILT_DECKS } from '@/lib/game/ai/prebuilt-decks';

interface DeckSelection {
  deckId: string;
  deckType: 'user' | 'prebuilt';
}

interface RawCard {
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
}

export default function GamePage() {
  return (
    <GameThemeProvider>
      <GamePageInner />
    </GameThemeProvider>
  );
}

function GamePageInner() {
  const t = useTranslations('Play');
  const router = useRouter();

  const {
    gameState,
    availableActions,
    isPlayerTurn,
    isAIThinking,
    gamePhase,
    lastAIAction,
    startGame,
    performAction,
    handleMulligan,
    resolveTarget,
    resetGame,
  } = useGameState();

  const [loadingState, setLoadingState] = useState<'reading-deck' | 'fetching-cards' | 'initializing' | 'ready' | 'error' | 'no-deck'>('reading-deck');
  const [errorMsg, setErrorMsg] = useState('');
  const [showEvaluation, setShowEvaluation] = useState(false);
  const [tutorialActive, setTutorialActive] = useState(false);
  const prevRoundRef = useRef(0);

  // Check if tutorial should be shown (first-time players)
  useEffect(() => {
    const shouldTutorial = sessionStorage.getItem('naruto-mythos-tutorial') === 'true';
    if (shouldTutorial) {
      sessionStorage.removeItem('naruto-mythos-tutorial');
      setTutorialActive(true);
    }
  }, []);

  // Detect round changes to show mission evaluation
  useEffect(() => {
    if (!gameState) return;
    const currentRound = gameState.round;
    const prevRound = prevRoundRef.current;

    // Round advanced or game ended — show evaluation for previous round's missions
    if (prevRound > 0 && (currentRound > prevRound || gameState.phase === GamePhase.GAME_OVER)) {
      setShowEvaluation(true);
    }
    prevRoundRef.current = currentRound;
  }, [gameState]);

  // Initialize the game on mount
  useEffect(() => {
    let cancelled = false;

    async function initGame() {
      // 1. Read deck selection from sessionStorage
      const raw = sessionStorage.getItem('naruto-mythos-game-deck');
      if (!raw) {
        setLoadingState('no-deck');
        return;
      }

      let selection: DeckSelection;
      try {
        selection = JSON.parse(raw) as DeckSelection;
      } catch {
        setLoadingState('no-deck');
        return;
      }

      if (cancelled) return;
      setLoadingState('fetching-cards');

      // 2. Fetch all cards from API
      let allCards: RawCard[];
      try {
        const response = await fetch('/api/cards');
        const json = await response.json();
        if (!json.data) throw new Error('No card data');
        allCards = json.data as RawCard[];
      } catch {
        if (cancelled) return;
        setErrorMsg('Failed to load card data');
        setLoadingState('error');
        return;
      }

      if (cancelled) return;
      setLoadingState('initializing');

      // 3. Build player deck
      let playerCards: GameCard[];
      let playerMissions: GameCard[];

      if (selection.deckType === 'prebuilt') {
        const deck = PREBUILT_DECKS.find((d) => d.id === selection.deckId);
        if (!deck) {
          setErrorMsg('Deck not found');
          setLoadingState('error');
          return;
        }

        const rawPlayerCards = deck.cardIds
          .map((id) => allCards.find((c) => c.id === id))
          .filter((c): c is RawCard => c !== undefined);
        const rawPlayerMissions = deck.missionCardIds
          .map((id) => allCards.find((c) => c.id === id))
          .filter((c): c is RawCard => c !== undefined);

        playerCards = toGameCards(rawPlayerCards);
        playerMissions = toGameCards(rawPlayerMissions);
      } else {
        // User deck — fetch from API
        try {
          const deckRes = await fetch(`/api/decks/${selection.deckId}`);
          const deckJson = await deckRes.json();
          if (!deckJson.data) throw new Error('Deck not found');

          const userDeck = deckJson.data;
          const deckCards: RawCard[] = [];
          const missionCards: RawCard[] = [];

          for (const dc of userDeck.cards || []) {
            const card = dc.card || allCards.find((c: RawCard) => c.id === dc.cardId);
            if (!card) continue;
            for (let i = 0; i < (dc.quantity || 1); i++) {
              if (card.type === 'MISSION') {
                missionCards.push(card);
              } else {
                deckCards.push(card);
              }
            }
          }

          playerCards = toGameCards(deckCards);
          playerMissions = toGameCards(missionCards);
        } catch {
          if (cancelled) return;
          setErrorMsg('Failed to load deck');
          setLoadingState('error');
          return;
        }
      }

      // 4. Pick an AI deck (different from player's)
      const aiDeckCandidates = PREBUILT_DECKS.filter(
        (d) => d.id !== selection.deckId
      );
      const aiDeck =
        aiDeckCandidates[Math.floor(Math.random() * aiDeckCandidates.length)] ??
        PREBUILT_DECKS[0];

      const rawAICards = aiDeck.cardIds
        .map((id) => allCards.find((c) => c.id === id))
        .filter((c): c is RawCard => c !== undefined);
      const rawAIMissions = aiDeck.missionCardIds
        .map((id) => allCards.find((c) => c.id === id))
        .filter((c): c is RawCard => c !== undefined);

      const opponentCards = toGameCards(rawAICards);
      const opponentMissions = toGameCards(rawAIMissions);

      if (cancelled) return;

      // 5. Start the game
      startGame(playerCards, playerMissions, opponentCards, opponentMissions);
      setLoadingState('ready');
    }

    initGame();

    return () => {
      cancelled = true;
    };
  }, [startGame]);

  const handlePlayAgain = useCallback(() => {
    resetGame();
    setLoadingState('reading-deck');
    // Re-trigger initialization
    window.location.reload();
  }, [resetGame]);

  const handleBackToLobby = useCallback(() => {
    resetGame();
    router.push('/play');
  }, [resetGame, router]);

  // Loading states
  if (loadingState === 'no-deck') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-muted-foreground">{t('game.noDeckError')}</p>
        <Button variant="outline" onClick={handleBackToLobby}>
          <ArrowLeft className="h-4 w-4" />
          {t('game.backToLobby')}
        </Button>
      </div>
    );
  }

  if (loadingState === 'error') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-destructive">{errorMsg}</p>
        <Button variant="outline" onClick={handleBackToLobby}>
          <ArrowLeft className="h-4 w-4" />
          {t('game.backToLobby')}
        </Button>
      </div>
    );
  }

  if (loadingState !== 'ready' || !gameState) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t('game.loading')}</p>
        <div className="w-full max-w-md space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  // Game Over
  if (gamePhase === GamePhase.GAME_OVER && !showEvaluation) {
    return (
      <GameOverScreen
        gameState={gameState}
        onPlayAgain={handlePlayAgain}
        onChangeDeck={handleBackToLobby}
        onBackToLobby={handleBackToLobby}
      />
    );
  }

  // Mulligan Phase
  if (gamePhase === GamePhase.MULLIGAN) {
    return (
      <div className="container mx-auto px-2 py-4 sm:px-4">
        <MulliganView
          hand={gameState.player.hand}
          onKeep={() => handleMulligan(true)}
          onMulligan={() => handleMulligan(false)}
          mulliganDone={gameState.player.mulliganDone}
        />
      </div>
    );
  }

  // Main Game (ACTION, MISSION_EVALUATION, END, START phases)
  return (
    <div className="h-dvh overflow-hidden px-2 py-1 sm:px-4 sm:py-2">
      <GameBoard
        gameState={gameState}
        availableActions={availableActions}
        isPlayerTurn={isPlayerTurn}
        isAIThinking={isAIThinking}
        lastAIAction={lastAIAction}
        onAction={performAction}
        onResolveTarget={resolveTarget}
      />

      {/* Mission evaluation overlay */}
      {showEvaluation && (
        <MissionEvaluation
          missions={gameState.missions}
          playerHasEdge={gameState.player.hasEdge}
          onComplete={() => setShowEvaluation(false)}
        />
      )}

      {/* Tutorial overlay */}
      <TutorialOverlay
        active={tutorialActive}
        onEnd={() => setTutorialActive(false)}
      />
    </div>
  );
}

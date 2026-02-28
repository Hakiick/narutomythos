'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  GamePhase,
  GameActionType,
  type GameState,
  type GameAction,
  type GameCard,
  type AvailableAction,
} from '@/lib/game/types';
import {
  initializeGame,
  performMulligan,
  keepHand,
  executePlayerAction,
  getAvailableActions,
} from '@/lib/game/engine';
import {
  decideAIAction,
  decideAIMulligan,
  decideAITarget,
} from '@/lib/game/ai/ai-engine';
import { resolvePendingEffect } from '@/lib/game/effects/executor';

/** Info about the last AI action, for UI feedback */
export interface AIActionFeedback {
  cardName: string;
  actionType: string;
  missionIndex?: number;
  timestamp: number;
}

export interface UseGameStateReturn {
  gameState: GameState | null;
  availableActions: AvailableAction[];
  isPlayerTurn: boolean;
  isAIThinking: boolean;
  gamePhase: GamePhase | null;
  lastAIAction: AIActionFeedback | null;

  startGame: (
    playerDeck: GameCard[],
    playerMissions: GameCard[],
    opponentDeck: GameCard[],
    opponentMissions: GameCard[]
  ) => void;
  performAction: (action: GameAction) => void;
  handleMulligan: (keep: boolean) => void;
  resolveTarget: (targetInstanceId: string) => void;
  resetGame: () => void;
}

const AI_SAFETY_TIMEOUT_MS = 10_000;

export function useGameState(): UseGameStateReturn {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [lastAIAction, setLastAIAction] = useState<AIActionFeedback | null>(null);

  // Ref-based gate for the AI action effect.
  // Using a ref avoids the React re-render cycle that cancels the timer
  // when isAIThinking (state) is in the dependency array.
  const aiIsProcessingRef = useRef(false);

  // Separate timer refs to avoid cross-cancellation
  const aiMulliganTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiActionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiEffectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiSafetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAllTimers = useCallback(() => {
    if (aiMulliganTimerRef.current) clearTimeout(aiMulliganTimerRef.current);
    if (aiActionTimerRef.current) clearTimeout(aiActionTimerRef.current);
    if (aiEffectTimerRef.current) clearTimeout(aiEffectTimerRef.current);
    if (aiSafetyTimerRef.current) clearTimeout(aiSafetyTimerRef.current);
    aiMulliganTimerRef.current = null;
    aiActionTimerRef.current = null;
    aiEffectTimerRef.current = null;
    aiSafetyTimerRef.current = null;
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const availableActions = useMemo(() => {
    if (!gameState || gameState.phase !== GamePhase.ACTION) return [];
    if (gameState.turn !== 'player') return [];
    if (gameState.pendingEffect) return [];
    return getAvailableActions(gameState);
  }, [gameState]);

  const isPlayerTurn = gameState?.turn === 'player' && gameState?.phase === GamePhase.ACTION;

  const gamePhase = gameState?.phase ?? null;

  const startGame = useCallback(
    (
      playerDeck: GameCard[],
      playerMissions: GameCard[],
      opponentDeck: GameCard[],
      opponentMissions: GameCard[]
    ) => {
      clearAllTimers();
      aiIsProcessingRef.current = false;
      const state = initializeGame(playerDeck, playerMissions, opponentDeck, opponentMissions);
      setGameState(state);
      setIsAIThinking(false);
      setLastAIAction(null);
    },
    [clearAllTimers]
  );

  const handleMulligan = useCallback(
    (keep: boolean) => {
      if (!gameState || gameState.phase !== GamePhase.MULLIGAN) return;
      if (gameState.player.mulliganDone) return;

      const newState = keep
        ? keepHand(gameState, 'player')
        : performMulligan(gameState, 'player');
      setGameState(newState);
    },
    [gameState]
  );

  const performAction = useCallback(
    (action: GameAction) => {
      if (!gameState) return;
      if (gameState.phase !== GamePhase.ACTION) return;
      if (action.side !== 'player') return;
      if (gameState.turn !== 'player') return;

      const newState = executePlayerAction(gameState, action);
      setGameState(newState);
    },
    [gameState]
  );

  const resolveTarget = useCallback(
    (targetInstanceId: string) => {
      if (!gameState || !gameState.pendingEffect) return;
      if (gameState.pendingEffect.side !== 'player') return;

      const newState = resolvePendingEffect(gameState, targetInstanceId);
      setGameState(newState);
    },
    [gameState]
  );

  const resetGame = useCallback(() => {
    clearAllTimers();
    aiIsProcessingRef.current = false;
    setGameState(null);
    setIsAIThinking(false);
    setLastAIAction(null);
  }, [clearAllTimers]);

  // AI mulligan (separate timer)
  useEffect(() => {
    if (!gameState) return;
    if (gameState.phase !== GamePhase.MULLIGAN) return;
    if (gameState.opponent.mulliganDone) return;

    aiMulliganTimerRef.current = setTimeout(() => {
      const shouldMulligan = decideAIMulligan(gameState);
      const newState = shouldMulligan
        ? performMulligan(gameState, 'opponent')
        : keepHand(gameState, 'opponent');
      setGameState(newState);
    }, 1000);

    return () => {
      if (aiMulliganTimerRef.current) {
        clearTimeout(aiMulliganTimerRef.current);
        aiMulliganTimerRef.current = null;
      }
    };
  }, [gameState]);

  // AI turn during ACTION phase.
  // Gate on aiIsProcessingRef (a ref, NOT state) so that setting it
  // does not trigger a re-render → effect cleanup → timer cancellation.
  useEffect(() => {
    if (!gameState) return;
    if (gameState.phase !== GamePhase.ACTION) return;
    if (gameState.turn !== 'opponent') return;
    if (aiIsProcessingRef.current) return;
    if (gameState.pendingEffect) return;

    aiIsProcessingRef.current = true;
    setIsAIThinking(true);

    aiActionTimerRef.current = setTimeout(() => {
      setGameState((currentState) => {
        if (!currentState) return null;
        if (currentState.phase !== GamePhase.ACTION) return currentState;
        if (currentState.turn !== 'opponent') return currentState;

        const { action } = decideAIAction(currentState);
        const newState = executePlayerAction(currentState, action);

        // Track AI action for feedback banner
        if (action.type !== GameActionType.PASS && action.data?.cardInstanceId) {
          const card = currentState.opponent.hand.find(
            (h) => h.instanceId === action.data?.cardInstanceId
          );
          if (card) {
            setLastAIAction({
              cardName: card.card.nameEn,
              actionType: action.type,
              missionIndex: action.data?.missionIndex,
              timestamp: Date.now(),
            });
          }
        } else if (action.type === GameActionType.PASS) {
          setLastAIAction({
            cardName: '',
            actionType: 'PASS',
            timestamp: Date.now(),
          });
        }

        return newState;
      });
      // Do NOT clear isAIThinking here — coordination effect handles it.
    }, 1200);

    // Only clean up the timer if the component unmounts or gameState changes
    // in a way that makes this effect irrelevant (e.g. phase change).
    return () => {
      if (aiActionTimerRef.current) {
        clearTimeout(aiActionTimerRef.current);
        aiActionTimerRef.current = null;
      }
    };
  }, [gameState]); // isAIThinking deliberately excluded — we use the ref

  // AI resolves pending effects on opponent side (separate timer)
  useEffect(() => {
    if (!gameState) return;
    if (!gameState.pendingEffect) return;
    if (gameState.pendingEffect.side !== 'opponent') return;

    aiEffectTimerRef.current = setTimeout(() => {
      setGameState((currentState) => {
        if (!currentState || !currentState.pendingEffect) return currentState;
        if (currentState.pendingEffect.side !== 'opponent') return currentState;

        const targetId = decideAITarget(currentState, currentState.pendingEffect);
        if (!targetId) {
          return { ...currentState, pendingEffect: null };
        }
        return resolvePendingEffect(currentState, targetId);
      });
    }, 800);

    return () => {
      if (aiEffectTimerRef.current) {
        clearTimeout(aiEffectTimerRef.current);
        aiEffectTimerRef.current = null;
      }
    };
  }, [gameState]);

  // Coordination effect: clear isAIThinking (and the ref) when turn switches
  // to player AND no opponent pending effect remains.
  useEffect(() => {
    if (!isAIThinking) return;
    if (!gameState) return;

    // Still opponent's turn with no pending effect? AI action hasn't executed yet.
    if (gameState.turn === 'opponent' && !gameState.pendingEffect) return;
    // Still has an opponent pending effect? Wait for it to resolve.
    if (gameState.pendingEffect?.side === 'opponent') return;

    // Turn has switched to player (or phase changed), safe to clear
    if (gameState.turn === 'player' || gameState.phase !== GamePhase.ACTION) {
      aiIsProcessingRef.current = false;
      setIsAIThinking(false);
    }
  }, [isAIThinking, gameState]);

  // Safety timeout: if AI stays "thinking" for too long, force pass and reset
  useEffect(() => {
    if (!isAIThinking) {
      if (aiSafetyTimerRef.current) {
        clearTimeout(aiSafetyTimerRef.current);
        aiSafetyTimerRef.current = null;
      }
      return;
    }

    aiSafetyTimerRef.current = setTimeout(() => {
      console.warn('[useGameState] AI safety timeout triggered — force passing');
      setGameState((currentState) => {
        if (!currentState) return null;
        const cleared = currentState.pendingEffect
          ? { ...currentState, pendingEffect: null }
          : currentState;
        if (cleared.turn === 'opponent' && cleared.phase === GamePhase.ACTION) {
          const passAction: GameAction = {
            type: GameActionType.PASS,
            side: 'opponent',
            timestamp: Date.now(),
          };
          return executePlayerAction(cleared, passAction);
        }
        return cleared;
      });
      aiIsProcessingRef.current = false;
      setIsAIThinking(false);
    }, AI_SAFETY_TIMEOUT_MS);

    return () => {
      if (aiSafetyTimerRef.current) {
        clearTimeout(aiSafetyTimerRef.current);
        aiSafetyTimerRef.current = null;
      }
    };
  }, [isAIThinking]);

  return {
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
  };
}

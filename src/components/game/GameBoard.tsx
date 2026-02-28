'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  GameActionType,
  GamePhase,
  type GameState,
  type GameAction,
  type AvailableAction,
} from '@/lib/game/types';
import { getMissionRankForRound } from '@/lib/game/utils';
import type { AIActionFeedback } from '@/hooks/useGameState';
import { PlayerHUD } from './PlayerHUD';
import { MissionLane } from './MissionLane';
import { HandView } from './HandView';
import { ActionBar } from './ActionBar';
import { GameLog } from './GameLog';
import { TargetSelector } from './TargetSelector';

interface GameBoardProps {
  gameState: GameState;
  availableActions: AvailableAction[];
  isPlayerTurn: boolean;
  isAIThinking: boolean;
  lastAIAction: AIActionFeedback | null;
  onAction: (action: GameAction) => void;
  onResolveTarget: (targetInstanceId: string) => void;
}

/** Map mission index to rank letter */
function missionIndexToRank(missions: GameState['missions'], index: number): string {
  return missions[index]?.rank ?? '?';
}

export function GameBoard({
  gameState,
  availableActions,
  isPlayerTurn,
  isAIThinking,
  lastAIAction,
  onAction,
  onResolveTarget,
}: GameBoardProps) {
  const t = useTranslations('Play');

  const [selectedCardInstanceId, setSelectedCardInstanceId] = useState<string | null>(null);
  const [hiddenMode, setHiddenMode] = useState(false);
  const [jutsuTargetMode, setJutsuTargetMode] = useState(false);

  // Round start banner
  const [roundBanner, setRoundBanner] = useState<number | null>(null);
  const prevRoundRef = useRef(gameState.round);

  // AI action feedback banner
  const [aiFeedback, setAIFeedback] = useState<string | null>(null);
  const aiFeedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect round changes for banner
  useEffect(() => {
    if (gameState.round !== prevRoundRef.current) {
      setRoundBanner(gameState.round);
      const timer = setTimeout(() => setRoundBanner(null), 2500);
      prevRoundRef.current = gameState.round;
      return () => clearTimeout(timer);
    }
  }, [gameState.round]);

  // Show AI action feedback
  useEffect(() => {
    if (!lastAIAction) return;

    let msg: string;
    if (lastAIAction.actionType === 'PASS') {
      msg = t('game.aiPassed');
    } else {
      const cardName = lastAIAction.cardName;
      const missionRank = lastAIAction.missionIndex !== undefined
        ? missionIndexToRank(gameState.missions, lastAIAction.missionIndex)
        : '?';
      msg = t('game.aiPlayed', { card: cardName, mission: missionRank });
    }

    setAIFeedback(msg);
    if (aiFeedbackTimerRef.current) clearTimeout(aiFeedbackTimerRef.current);
    aiFeedbackTimerRef.current = setTimeout(() => setAIFeedback(null), 3000);

    return () => {
      if (aiFeedbackTimerRef.current) clearTimeout(aiFeedbackTimerRef.current);
    };
  }, [lastAIAction, t, gameState.missions]);

  // Determine the current action type for the selected card
  const selectedActionType = useMemo(() => {
    if (!selectedCardInstanceId) return null;
    if (hiddenMode) return GameActionType.PLAY_HIDDEN;
    return GameActionType.PLAY_CHARACTER;
  }, [selectedCardInstanceId, hiddenMode]);

  // Get valid missions for the selected card
  const highlightedMissions = useMemo((): number[] => {
    if (!selectedCardInstanceId) return [];

    const actionType = hiddenMode
      ? GameActionType.PLAY_HIDDEN
      : GameActionType.PLAY_CHARACTER;

    const matchingAction = availableActions.find(
      (a) => a.cardInstanceId === selectedCardInstanceId && a.type === actionType
    );

    return matchingAction?.validMissions ?? [];
  }, [selectedCardInstanceId, hiddenMode, availableActions]);

  // Compute which mission index is for the current round
  const currentRoundRank = getMissionRankForRound(gameState.round);
  const currentRoundMissionIndex = gameState.missions.findIndex(
    (m) => m.rank === currentRoundRank
  );

  // Check if player has any playable cards
  const hasPlayableCards = useMemo(() => {
    return availableActions.some(
      (a) =>
        a.type === GameActionType.PLAY_CHARACTER ||
        a.type === GameActionType.PLAY_HIDDEN ||
        a.type === GameActionType.UPGRADE ||
        a.type === GameActionType.PLAY_JUTSU
    );
  }, [availableActions]);

  const handleSelectCard = useCallback(
    (instanceId: string) => {
      if (selectedCardInstanceId === instanceId) {
        // Deselect
        setSelectedCardInstanceId(null);
        setJutsuTargetMode(false);
      } else {
        setSelectedCardInstanceId(instanceId);
        // Check if this is a jutsu card
        const jutsuAction = availableActions.find(
          (a) => a.cardInstanceId === instanceId && a.type === GameActionType.PLAY_JUTSU
        );
        setJutsuTargetMode(!!jutsuAction);
      }
    },
    [selectedCardInstanceId, availableActions]
  );

  const handleMissionClick = useCallback(
    (missionIndex: number) => {
      if (!selectedCardInstanceId) return;
      if (!highlightedMissions.includes(missionIndex)) return;

      // Check if this is an upgrade action
      const upgradeAction = availableActions.find(
        (a) =>
          a.cardInstanceId === selectedCardInstanceId &&
          a.type === GameActionType.UPGRADE &&
          a.upgradeTargets?.some((ut) => ut.missionIndex === missionIndex)
      );

      if (upgradeAction && !hiddenMode) {
        const target = upgradeAction.upgradeTargets?.find(
          (ut) => ut.missionIndex === missionIndex
        );
        if (target) {
          const action: GameAction = {
            type: GameActionType.UPGRADE,
            side: 'player',
            data: {
              cardInstanceId: selectedCardInstanceId,
              missionIndex,
              targetInstanceId: target.instanceId,
              description: upgradeAction.description,
            },
            timestamp: Date.now(),
          };
          onAction(action);
          setSelectedCardInstanceId(null);
          return;
        }
      }

      const actionType = hiddenMode
        ? GameActionType.PLAY_HIDDEN
        : GameActionType.PLAY_CHARACTER;

      const action: GameAction = {
        type: actionType,
        side: 'player',
        data: {
          cardInstanceId: selectedCardInstanceId,
          missionIndex,
        },
        timestamp: Date.now(),
      };

      onAction(action);
      setSelectedCardInstanceId(null);
    },
    [selectedCardInstanceId, highlightedMissions, hiddenMode, availableActions, onAction]
  );

  const handlePass = useCallback(() => {
    const action: GameAction = {
      type: GameActionType.PASS,
      side: 'player',
      timestamp: Date.now(),
    };
    onAction(action);
    setSelectedCardInstanceId(null);
  }, [onAction]);

  const handleToggleHidden = useCallback(() => {
    setHiddenMode((prev) => !prev);
  }, []);

  // Keyboard shortcuts: Space=Pass, 1-5=select card, H=toggle hidden
  const canAct = isPlayerTurn && !isAIThinking && gameState.phase === GamePhase.ACTION && !gameState.pendingEffect;

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!canAct) return;
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        handlePass();
        return;
      }

      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        handleToggleHidden();
        return;
      }

      // 1-5 to select cards in hand
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 5) {
        const hand = gameState.player.hand;
        const cardIndex = num - 1;
        if (cardIndex < hand.length) {
          handleSelectCard(hand[cardIndex].instanceId);
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canAct, handlePass, handleToggleHidden, handleSelectCard, gameState.player.hand]);

  return (
    <div className="relative flex h-full flex-col gap-2 sm:gap-3" data-tutorial="board">
      {/* Round start banner overlay */}
      {roundBanner !== null && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
          <div className="animate-fade-in-out rounded-xl bg-black/80 px-8 py-4 shadow-lg">
            <p className="text-center text-lg font-bold text-white sm:text-xl">
              {t('game.roundBegins', { round: roundBanner })}
            </p>
          </div>
        </div>
      )}

      {/* AI action feedback banner */}
      {aiFeedback && (
        <div className="pointer-events-none absolute inset-x-0 top-12 z-30 flex justify-center">
          <div className="animate-fade-in-out rounded-lg bg-red-500/90 px-4 py-1.5 shadow-md">
            <p className="text-xs font-medium text-white">
              {aiFeedback}
            </p>
          </div>
        </div>
      )}

      {/* Pending Effect Overlay */}
      {gameState.pendingEffect && gameState.pendingEffect.side === 'player' && (
        <TargetSelector
          pendingEffect={gameState.pendingEffect}
          gameState={gameState}
          onSelectTarget={onResolveTarget}
        />
      )}

      {/* Jutsu Target Selection Overlay */}
      {jutsuTargetMode && selectedCardInstanceId && (() => {
        const jutsuAction = availableActions.find(
          (a) => a.cardInstanceId === selectedCardInstanceId && a.type === GameActionType.PLAY_JUTSU
        );
        if (!jutsuAction?.jutsuTargets?.length) return null;
        const pendingForJutsu = {
          effectType: 'JUTSU_TARGET',
          sourceInstanceId: selectedCardInstanceId,
          side: 'player' as const,
          validTargets: jutsuAction.jutsuTargets,
          description: jutsuAction.description ?? t('game.selectTarget'),
          value: 0,
        };
        return (
          <TargetSelector
            pendingEffect={pendingForJutsu}
            gameState={gameState}
            onSelectTarget={(targetId) => {
              const target = jutsuAction.jutsuTargets!.find((jt) => jt.instanceId === targetId);
              if (target) {
                const action: GameAction = {
                  type: GameActionType.PLAY_JUTSU,
                  side: 'player',
                  data: {
                    cardInstanceId: selectedCardInstanceId,
                    missionIndex: target.missionIndex,
                    targetInstanceId: targetId,
                    description: jutsuAction.description,
                  },
                  timestamp: Date.now(),
                };
                onAction(action);
              }
              setSelectedCardInstanceId(null);
              setJutsuTargetMode(false);
            }}
          />
        );
      })()}

      {/* Opponent HUD */}
      <PlayerHUD
        playerState={gameState.opponent}
        side="opponent"
        isCurrentTurn={gameState.turn === 'opponent'}
        label={t('game.opponent')}
      />

      {/* Mission Lanes — reversed so D is at the bottom, A is at the top */}
      <div className="flex flex-col gap-1.5 sm:gap-2">
        {[...gameState.missions].reverse().map((mission, reversedIdx) => {
          const actualIdx = gameState.missions.length - 1 - reversedIdx;
          const isActive = actualIdx === currentRoundMissionIndex;
          const isLocked = !mission.missionCard;
          const isHighlighted = highlightedMissions.includes(actualIdx);

          return (
            <div key={mission.rank} data-tutorial={isActive ? 'mission-active' : undefined}>
              <MissionLane
                mission={mission}
                missionIndex={actualIdx}
                isActive={isActive}
                isLocked={isLocked}
                isHighlighted={isHighlighted}
                onMissionClick={handleMissionClick}
              />
            </div>
          );
        })}
      </div>

      {/* Action Bar */}
      <ActionBar
        gamePhase={gameState.phase}
        round={gameState.round}
        isPlayerTurn={isPlayerTurn}
        isAIThinking={isAIThinking}
        selectedAction={selectedActionType}
        selectedCardId={selectedCardInstanceId}
        hasPlayableCards={hasPlayableCards}
        pendingEffect={gameState.pendingEffect}
        onPass={handlePass}
        onToggleHidden={handleToggleHidden}
        hiddenMode={hiddenMode}
      />

      {/* Player HUD */}
      <div data-tutorial="chakra">
        <PlayerHUD
          playerState={gameState.player}
          side="player"
          isCurrentTurn={gameState.turn === 'player'}
          label={t('game.player')}
        />
      </div>

      {/* Player Hand */}
      <div data-tutorial="hand">
        <HandView
          hand={gameState.player.hand}
          availableActions={availableActions}
          selectedCardId={selectedCardInstanceId}
          onSelectCard={handleSelectCard}
          disabled={!isPlayerTurn || isAIThinking || gameState.phase !== GamePhase.ACTION}
          gameState={gameState}
        />
      </div>

      {/* Game Log */}
      <GameLog
        actions={gameState.actionHistory}
        round={gameState.round}
      />
    </div>
  );
}

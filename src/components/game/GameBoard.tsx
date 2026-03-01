'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
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
import { EffectToastContainer } from './EffectToastContainer';
import { GameCardInspector } from './GameCardInspector';
import { ThemeParticles } from './ThemeParticles';
import { useGameTheme, themeBoardClass } from '@/hooks/useGameTheme';
import type { DeployedCharacter, GameCard } from '@/lib/game/types';

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
  const locale = useLocale();
  const { theme } = useGameTheme();

  const [selectedCardInstanceId, setSelectedCardInstanceId] = useState<string | null>(null);
  const [hiddenMode, setHiddenMode] = useState(false);
  const [jutsuTargetMode, setJutsuTargetMode] = useState(false);

  // Card inspector state
  const [inspectedCard, setInspectedCard] = useState<GameCard | null>(null);
  const [inspectedDeployed, setInspectedDeployed] = useState<DeployedCharacter | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);

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

  // Get selected card's effect text
  const selectedCardEffect = useMemo((): string | null => {
    if (!selectedCardInstanceId) return null;
    const inst = gameState.player.hand.find((c) => c.instanceId === selectedCardInstanceId);
    if (!inst) return null;
    const effectText = locale === 'fr' ? inst.card.effectFr : inst.card.effectEn;
    return effectText ?? null;
  }, [selectedCardInstanceId, gameState.player.hand, locale]);

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

  const handleInspectCharacter = useCallback((char: DeployedCharacter) => {
    setInspectedCard(char.card);
    setInspectedDeployed(char);
    setInspectorOpen(true);
  }, []);

  const handleInspectCard = useCallback((card: GameCard) => {
    setInspectedCard(card);
    setInspectedDeployed(null);
    setInspectorOpen(true);
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
    <div className={`${themeBoardClass(theme)} relative flex h-full flex-col gap-1 sm:gap-1.5`} data-tutorial="board">
      {/* Ambient theme particles */}
      <ThemeParticles />
      {/* Round start banner overlay — mission briefing style */}
      {roundBanner !== null && (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
          <div className="animate-banner-unfurl relative overflow-hidden rounded-lg border border-orange-500/40 bg-gradient-to-r from-black/90 via-zinc-900/95 to-black/90 px-10 py-5 shadow-[0_0_30px_rgba(249,115,22,0.15)]">
            {/* Top decorative line */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
            {/* Bottom decorative line */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-orange-500/60 to-transparent" />
            {/* Left accent bar */}
            <div className="absolute inset-y-2 left-0 w-1 rounded-r bg-gradient-to-b from-orange-500/0 via-orange-500/70 to-orange-500/0" />
            {/* Right accent bar */}
            <div className="absolute inset-y-2 right-0 w-1 rounded-l bg-gradient-to-b from-orange-500/0 via-orange-500/70 to-orange-500/0" />
            <p className="text-center text-xs font-medium uppercase tracking-[0.25em] text-orange-400/70">
              {t('game.missionBriefing')}
            </p>
            <p className="mt-1 text-center text-lg font-bold tracking-wide text-white sm:text-xl">
              {t('game.roundBegins', { round: roundBanner })}
            </p>
          </div>
        </div>
      )}

      {/* Effect toasts */}
      <EffectToastContainer effectLog={gameState.effectLog} />

      {/* AI action feedback banner */}
      {aiFeedback && (
        <div className="pointer-events-none absolute inset-x-0 top-12 z-30 flex justify-center">
          <div className="animate-ai-feedback relative overflow-hidden rounded-md border border-red-500/30 bg-gradient-to-r from-red-950/90 via-red-900/90 to-red-950/90 px-5 py-2 shadow-[0_0_16px_rgba(239,68,68,0.2)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
            <p className="text-xs font-semibold tracking-wide text-red-200">
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
      <div className={`flex flex-col gap-1.5 sm:gap-2 ${theme === 'chakra' ? 'theme-perspective theme-chakra-3d' : theme === 'scroll' ? 'theme-perspective theme-scroll-3d' : ''}`}>
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
                onInspectCharacter={handleInspectCharacter}
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
        selectedCardEffect={selectedCardEffect}
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
          onInspectCard={handleInspectCard}
        />
      </div>

      {/* Game Log */}
      <GameLog
        actions={gameState.actionHistory}
        round={gameState.round}
        effectLog={gameState.effectLog}
      />

      {/* Card Inspector Modal */}
      <GameCardInspector
        card={inspectedCard}
        deployed={inspectedDeployed}
        revealedInfo={gameState.revealedInfo}
        open={inspectorOpen}
        onOpenChange={setInspectorOpen}
      />
    </div>
  );
}

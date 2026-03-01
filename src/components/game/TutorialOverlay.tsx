'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  TUTORIAL_STEPS,
  markTutorialCompleted,
  type TutorialHighlight,
} from '@/lib/game/tutorial/tutorial-engine';

interface TutorialOverlayProps {
  /** Whether the tutorial is active */
  active: boolean;
  /** Called when the tutorial ends (skip or complete) */
  onEnd: () => void;
  /** Called when a step with waitForAction completes */
  onActionCompleted?: () => void;
  /** Current step override for external advancement (e.g., after user action) */
  externalStepIndex?: number;
}

const HIGHLIGHT_STYLES: Record<TutorialHighlight, string> = {
  hand: '[data-tutorial="hand"]',
  'mission-active': '[data-tutorial="mission-active"]',
  chakra: '[data-tutorial="chakra"]',
  'pass-button': '[data-tutorial="pass-button"]',
  'hidden-toggle': '[data-tutorial="hidden-toggle"]',
  score: '[data-tutorial="score"]',
  board: '[data-tutorial="board"]',
  none: '',
};

export function TutorialOverlay({
  active,
  onEnd,
  externalStepIndex,
}: TutorialOverlayProps) {
  const t = useTranslations('Play');
  const [stepIndex, setStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  // Sync with external step index
  useEffect(() => {
    if (externalStepIndex !== undefined) {
      setStepIndex(externalStepIndex);
    }
  }, [externalStepIndex]);

  const currentStep = TUTORIAL_STEPS[stepIndex];

  const handleNext = useCallback(() => {
    if (stepIndex >= TUTORIAL_STEPS.length - 1) {
      markTutorialCompleted();
      onEnd();
      return;
    }
    setStepIndex((prev) => prev + 1);
  }, [stepIndex, onEnd]);

  const handleSkip = useCallback(() => {
    markTutorialCompleted();
    onEnd();
  }, [onEnd]);

  // Calculate highlight position
  useEffect(() => {
    if (!active || !currentStep) return;

    const selector = HIGHLIGHT_STYLES[currentStep.highlight];
    if (!selector) {
      setHighlightRect(null);
      return;
    }

    const element = document.querySelector(selector);
    if (element) {
      setHighlightRect(element.getBoundingClientRect());
    } else {
      setHighlightRect(null);
    }
  }, [active, currentStep, stepIndex]);

  // Auto-advance for steps with autoAdvanceMs
  useEffect(() => {
    if (!active || !currentStep?.autoAdvanceMs) return;
    if (currentStep.waitForAction) return;

    const timer = setTimeout(() => {
      handleNext();
    }, currentStep.autoAdvanceMs);

    return () => clearTimeout(timer);
  }, [active, stepIndex, currentStep, handleNext]);

  if (!active || !currentStep) return null;

  const isLastStep = stepIndex === TUTORIAL_STEPS.length - 1;
  const progress = ((stepIndex + 1) / TUTORIAL_STEPS.length) * 100;

  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      {/* Backdrop — only show when not highlighting the full board */}
      {currentStep.highlight !== 'board' && currentStep.highlight !== 'none' && (
        <div className="pointer-events-auto absolute inset-0 bg-black/40" />
      )}

      {/* Highlight cutout — orange-accented ring */}
      {highlightRect && currentStep.highlight !== 'none' && (
        <div
          className="absolute rounded-lg ring-2 ring-orange-500/70 ring-offset-2 ring-offset-transparent"
          style={{
            left: highlightRect.left - 4,
            top: highlightRect.top - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
            zIndex: 51,
            boxShadow: '0 0 16px 4px rgba(249, 115, 22, 0.2)',
          }}
        />
      )}

      {/* Tutorial card — Naruto-themed */}
      <div className="pointer-events-auto absolute bottom-4 left-4 right-4 z-[52] mx-auto max-w-md">
        <div className="relative overflow-hidden rounded-xl border border-orange-500/25 bg-gradient-to-b from-zinc-900 to-zinc-950 p-4 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
          {/* Top decorative line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

          {/* Progress bar — orange gradient */}
          <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step content */}
          <div className="mb-4 flex items-start gap-3">
            {/* Step indicator — themed circle with step number */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-orange-500/30 bg-gradient-to-br from-orange-500/20 to-orange-600/10">
              <span className="text-xs font-bold text-orange-400">{stepIndex + 1}</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">{t(currentStep.titleKey)}</h3>
              <p className="mt-1 text-xs text-zinc-400">
                {t(currentStep.descKey)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs text-zinc-500 hover:text-orange-400 transition-colors"
            >
              {t('tutorial.skip')}
            </button>

            {!currentStep.waitForAction && (
              <Button
                size="sm"
                onClick={handleNext}
                className="border-orange-500/40 bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:from-orange-500 hover:to-orange-400"
              >
                {isLastStep ? (
                  t('tutorial.startPlaying')
                ) : (
                  <>
                    {t('tutorial.next')}
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            )}

            {currentStep.waitForAction && (
              <span className="text-xs text-orange-400/60 animate-pulse">
                {t('tutorial.next')}...
              </span>
            )}
          </div>

          {/* Step counter */}
          <div className="mt-2 text-center text-[10px] text-zinc-500">
            {stepIndex + 1} / {TUTORIAL_STEPS.length}
          </div>

          {/* Bottom decorative line */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
        </div>
      </div>

      {/* Skip button (top right) — themed */}
      <button
        type="button"
        onClick={handleSkip}
        className="pointer-events-auto absolute right-4 top-4 z-[52] flex h-8 w-8 items-center justify-center rounded-full border border-orange-500/20 bg-zinc-900/80 text-zinc-400 transition-colors hover:border-orange-500/40 hover:text-orange-400"
        aria-label={t('tutorial.skip')}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

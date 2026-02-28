'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronRight, X, GraduationCap } from 'lucide-react';
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

      {/* Highlight cutout */}
      {highlightRect && currentStep.highlight !== 'none' && (
        <div
          className="absolute rounded-lg ring-4 ring-primary ring-offset-2 ring-offset-transparent"
          style={{
            left: highlightRect.left - 4,
            top: highlightRect.top - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
            zIndex: 51,
          }}
        />
      )}

      {/* Tutorial card */}
      <div className="pointer-events-auto absolute bottom-4 left-4 right-4 z-[52] mx-auto max-w-md">
        <div className="rounded-xl border border-border bg-background p-4 shadow-2xl">
          {/* Progress bar */}
          <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Step content */}
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">{t(currentStep.titleKey)}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {t(currentStep.descKey)}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t('tutorial.skip')}
            </button>

            {!currentStep.waitForAction && (
              <Button size="sm" onClick={handleNext}>
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
              <span className="text-xs text-muted-foreground animate-pulse">
                {t('tutorial.next')}...
              </span>
            )}
          </div>

          {/* Step counter */}
          <div className="mt-2 text-center text-[10px] text-muted-foreground">
            {stepIndex + 1} / {TUTORIAL_STEPS.length}
          </div>
        </div>
      </div>

      {/* Skip button (top right) */}
      <button
        type="button"
        onClick={handleSkip}
        className="pointer-events-auto absolute right-4 top-4 z-[52] flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-muted-foreground hover:text-foreground"
        aria-label={t('tutorial.skip')}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import type {
  CardRecognitionState,
  DetectedCard,
  IdentifiedCard,
} from '@/types/ml';
import { Button } from '@/components/ui/button';

interface ScannerOverlayProps {
  state: CardRecognitionState;
  isActive: boolean;
  isUsingWorker: boolean;
  onToggle: () => void;
  videoWidth?: number;
  videoHeight?: number;
  className?: string;
}

function getFpsColor(fps: number): string {
  if (fps >= 10) return 'text-green-400';
  if (fps >= 5) return 'text-yellow-400';
  return 'text-red-400';
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.75) return 'bg-green-900/70';
  if (confidence >= 0.5) return 'bg-yellow-900/70';
  return 'bg-red-900/70';
}

function getBboxBorderColor(confidence: number): string {
  if (confidence >= 0.7) return 'border-green-400';
  if (confidence >= 0.5) return 'border-yellow-400';
  return 'border-red-400';
}

function getBboxLabelBg(confidence: number): string {
  if (confidence >= 0.7) return 'bg-green-600/80';
  if (confidence >= 0.5) return 'bg-yellow-600/80';
  return 'bg-red-600/80';
}

export function ScannerOverlay({
  state,
  isActive,
  isUsingWorker,
  onToggle,
  videoWidth,
  videoHeight,
  className = '',
}: ScannerOverlayProps) {
  const t = useTranslations('Scanner');

  const {
    status,
    lastResult,
    detectedCards,
    identifiedCards,
    error,
    loadingProgress,
    fps,
  } = state;

  const isLoading = status === 'loading';
  const isError = status === 'error';
  const hasCard = lastResult !== null && lastResult.cardCode !== null;
  const confidencePercent =
    lastResult !== null ? Math.round(lastResult.confidence * 100) : 0;

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-2">
        <div className="flex items-center gap-2">
          {isActive && (
            <>
              <span
                className={`rounded bg-black/60 px-2 py-0.5 text-xs font-mono backdrop-blur-sm ${getFpsColor(fps)}`}
              >
                {t('fps', { value: fps.toFixed(1) })}
              </span>
              <span className="rounded bg-black/60 px-2 py-0.5 text-xs text-gray-300 backdrop-blur-sm">
                {isUsingWorker ? t('worker') : t('mainThread')}
              </span>
            </>
          )}
        </div>

        <Button
          onClick={onToggle}
          variant="secondary"
          size="sm"
          className="pointer-events-auto bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm"
        >
          {isActive ? t('stopScanning') : t('startScanning')}
        </Button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="rounded-xl bg-black/70 px-6 py-4 backdrop-blur-sm flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-600 border-t-primary" />
            <p className="text-sm text-white">{t('loading')}</p>
            {loadingProgress > 0 && (
              <div className="w-40">
                <div className="mb-1 flex justify-between text-xs text-gray-400">
                  <span>{t('loadingProgress', { percent: Math.round(loadingProgress) })}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.round(loadingProgress))}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="rounded-xl bg-black/70 px-6 py-4 backdrop-blur-sm flex flex-col items-center gap-3 pointer-events-auto">
            <p className="max-w-xs text-center text-sm text-red-300">{error}</p>
            <Button variant="destructive" size="sm" onClick={onToggle}>
              {t('retry')}
            </Button>
          </div>
        </div>
      )}

      {/* Bounding boxes */}
      {isActive &&
        videoWidth &&
        videoHeight &&
        (() => {
          const cards: (DetectedCard | IdentifiedCard)[] =
            identifiedCards && identifiedCards.length > 0
              ? identifiedCards
              : detectedCards && detectedCards.length > 0
                ? detectedCards
                : [];
          if (cards.length === 0) return null;

          return (
            <>
              {cards.map((card, idx) => {
                const [bx, by, bw, bh] = card.bbox;
                const left = (bx / videoWidth) * 100;
                const top = (by / videoHeight) * 100;
                const width = (bw / videoWidth) * 100;
                const height = (bh / videoHeight) * 100;

                const isIdentified =
                  'cardCode' in card &&
                  (card as IdentifiedCard).candidates !== undefined;
                const identified = isIdentified
                  ? (card as IdentifiedCard)
                  : null;
                const labelConfidence =
                  identified?.cardCode !== null &&
                  identified?.cardCode !== undefined
                    ? identified.matchConfidence
                    : card.confidence;
                const labelText = identified?.cardCode
                  ? `${identified.cardCode} (${Math.round(identified.matchConfidence * 100)}%)`
                  : `Card ${idx + 1} (${Math.round(card.confidence * 100)}%)`;

                return (
                  <div
                    key={idx}
                    className={`absolute border-2 ${getBboxBorderColor(labelConfidence)} rounded pointer-events-none`}
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      width: `${width}%`,
                      height: `${height}%`,
                    }}
                  >
                    <span
                      className={`absolute -top-5 left-0 rounded px-1 py-0.5 text-[10px] font-mono text-white whitespace-nowrap ${getBboxLabelBg(labelConfidence)}`}
                    >
                      {labelText}
                    </span>
                  </div>
                );
              })}
            </>
          );
        })()}

      {/* Bottom result */}
      {isActive && !isLoading && !isError && (
        <div className="absolute bottom-0 left-0 right-0 flex justify-center p-3">
          {hasCard && lastResult && lastResult.cardCode !== null ? (
            <div
              className={`rounded-xl px-4 py-2.5 backdrop-blur-sm ${getConfidenceColor(lastResult.confidence)}`}
            >
              <p className="text-sm font-semibold text-white">
                {lastResult.cardCode}
              </p>
              <p className="text-xs text-gray-300">
                {t('confidence', { percent: confidencePercent })}
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-black/60 px-4 py-2.5 backdrop-blur-sm">
              <p className="text-xs text-gray-400">{t('noCardDetected')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

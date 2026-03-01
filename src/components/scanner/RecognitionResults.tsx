'use client';

import { useTranslations } from 'next-intl';
import type {
  RecognitionOutput,
  RecognitionResult,
  IdentifiedCard,
} from '@/types/ml';

interface RecognitionResultsProps {
  lastResult: RecognitionOutput | null;
  topCandidates: RecognitionResult[];
  identifiedCards?: IdentifiedCard[];
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const percent = Math.round(confidence * 100);
  const barColor =
    percent >= 75
      ? 'bg-green-500'
      : percent >= 50
        ? 'bg-yellow-500'
        : 'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-mono text-muted-foreground">
        {percent}%
      </span>
    </div>
  );
}

export function RecognitionResults({
  lastResult,
  topCandidates,
  identifiedCards = [],
}: RecognitionResultsProps) {
  const t = useTranslations('Scanner');

  const hasCard = lastResult !== null && lastResult.cardCode !== null;
  const matchedCards = identifiedCards.filter((c) => c.cardCode !== null);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t('recognizedCard')}
        {identifiedCards.length > 0 && (
          <span className="ml-2 text-muted-foreground/70">
            ({t('matchedCards', { matched: matchedCards.length, total: identifiedCards.length })})
          </span>
        )}
      </h3>

      {(!lastResult || !hasCard) && matchedCards.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">{t('noCardDetected')}</p>
        </div>
      )}

      {/* Multi-card list */}
      {matchedCards.length > 1 && (
        <ol className="space-y-3">
          {matchedCards.map((card, index) => (
            <li key={`${card.cardCode}-${index}`} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="font-mono text-sm font-medium">
                    {card.cardCode}
                  </span>
                </div>
                {index === 0 && lastResult && (
                  <span className="text-xs text-muted-foreground">
                    {lastResult.durationMs}ms
                  </span>
                )}
              </div>
              <ConfidenceBar confidence={card.matchConfidence} />
            </li>
          ))}
        </ol>
      )}

      {/* Single card with candidates */}
      {matchedCards.length <= 1 &&
        hasCard &&
        lastResult &&
        lastResult.cardCode !== null && (
          <div>
            {topCandidates.length <= 1 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold">
                    {lastResult.cardCode}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {lastResult.durationMs}ms
                  </span>
                </div>
                <ConfidenceBar confidence={lastResult.confidence} />
              </div>
            ) : (
              <>
                <h4 className="mb-2 text-xs font-medium text-muted-foreground">
                  {t('candidates')}
                </h4>
                <ol className="space-y-3">
                  {topCandidates.slice(0, 5).map((candidate, index) => (
                    <li key={candidate.cardCode} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="font-mono text-sm font-medium">
                            {candidate.cardCode}
                          </span>
                        </div>
                        {index === 0 && (
                          <span className="text-xs text-muted-foreground">
                            {lastResult.durationMs}ms
                          </span>
                        )}
                      </div>
                      <ConfidenceBar confidence={candidate.confidence} />
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        )}
    </div>
  );
}

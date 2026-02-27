'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { DeckValidationResult } from '@/lib/services/deck-validator';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, AlertTriangle, CheckCircle } from 'lucide-react';

interface DeckValidationProps {
  validationResult: DeckValidationResult;
}

export function DeckValidation({ validationResult }: DeckValidationProps) {
  const t = useTranslations('Decks');
  const [expanded, setExpanded] = useState(!validationResult.isValid);

  const hasIssues = validationResult.errors.length > 0 || validationResult.warnings.length > 0;

  return (
    <div className="rounded-lg border border-border p-3">
      <button
        type="button"
        className="flex w-full items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{t('validation')}</span>
          {validationResult.isValid ? (
            <Badge className="border-transparent bg-green-700 text-[10px] text-white">
              <CheckCircle className="mr-1 h-3 w-3" />
              {t('validDeck')}
            </Badge>
          ) : (
            <Badge className="border-transparent bg-red-700 text-[10px] text-white">
              <AlertTriangle className="mr-1 h-3 w-3" />
              {t('invalidDeck')}
            </Badge>
          )}
        </div>
        {hasIssues && (
          expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {expanded && hasIssues && (
        <div className="mt-3 space-y-2">
          {validationResult.errors.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-red-400">{t('errors')}</p>
              <ul className="space-y-1">
                {validationResult.errors.map((error, i) => (
                  <li key={i} className="text-xs text-red-300">
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {validationResult.warnings.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-medium text-amber-400">{t('warnings')}</p>
              <ul className="space-y-1">
                {validationResult.warnings.map((warning, i) => (
                  <li key={i} className="text-xs text-amber-300">
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Select } from '@/components/ui/select';

interface DeckValueData {
  totalValue: number;
  currency: string;
  cardCount: number;
}

interface DeckValuePanelProps {
  deckId: string;
}

export function DeckValuePanel({ deckId }: DeckValuePanelProps) {
  const t = useTranslations('Pricing');
  const [currency, setCurrency] = useState('EUR');
  const [data, setData] = useState<DeckValueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/decks/${deckId}/value?currency=${currency}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((json) => {
        if (json?.data) setData(json.data);
      })
      .finally(() => setLoading(false));
  }, [deckId, currency]);

  const symbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{t('deckValue')}</h3>
        <Select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="h-7 w-auto text-xs"
          aria-label={t('currency')}
        >
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
          <option value="GBP">GBP</option>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">...</p>
      ) : data ? (
        <div>
          <p className="text-2xl font-bold">{symbol}{data.totalValue.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">
            {t('cardCount', { count: data.cardCount })}
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('noPriceData')}</p>
      )}
    </div>
  );
}

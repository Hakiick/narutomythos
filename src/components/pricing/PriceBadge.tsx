import { cn } from '@/lib/utils';
import type { PriceTrend } from '@/lib/services/price-utils';

const currencySymbols: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
};

const trendIcons: Record<PriceTrend, string> = {
  up: '▲',
  down: '▼',
  stable: '—',
};

const trendColors: Record<PriceTrend, string> = {
  up: 'text-green-500',
  down: 'text-red-500',
  stable: 'text-muted-foreground',
};

interface PriceBadgeProps {
  price: number;
  currency: string;
  trend?: PriceTrend;
  isStale?: boolean;
  className?: string;
}

export function PriceBadge({ price, currency, trend, isStale, className }: PriceBadgeProps) {
  const symbol = currencySymbols[currency] || currency;

  if (price === 0) {
    return (
      <span className={cn('text-sm text-muted-foreground', className)}>—</span>
    );
  }

  return (
    <span className={cn('inline-flex items-center gap-1 text-sm font-semibold', isStale && 'opacity-50', className)}>
      <span>{symbol}{price.toFixed(2)}</span>
      {trend && (
        <span className={cn('text-xs', trendColors[trend])}>
          {trendIcons[trend]}
        </span>
      )}
    </span>
  );
}

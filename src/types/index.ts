export type Locale = 'en' | 'fr';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Deck types
export type { DeckWithCardCount, DeckCardWithCard, DeckWithCards } from '@/lib/services/deck-service';
export type { DeckValidationResult, DeckStats } from '@/lib/services/deck-validator';
export type { CreateDeckInput, UpdateDeckInput, AddCardInput } from '@/lib/validators/deck';

// Collection types
export type { CollectionCardWithCard, CollectionStats } from '@/lib/services/collection-service';
export type { AddToCollectionInput, UpdateCollectionCardInput, CollectionFiltersInput } from '@/lib/validators/collection';

// Pricing types
export type { PricePoint, PriceTrend, MarketPriceResult } from '@/lib/services/price-utils';
export type { CardMarketPrice, CollectionValue, DeckValue } from '@/lib/services/price-service';
export type { PriceQueryInput, CollectionValueQueryInput, DeckValueQueryInput } from '@/lib/validators/price';

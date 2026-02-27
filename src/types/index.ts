export type Locale = 'en' | 'fr';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// Deck types
export type { DeckWithCardCount, DeckCardWithCard, DeckWithCards } from '@/lib/services/deck-service';
export type { DeckValidationResult, DeckStats } from '@/lib/services/deck-validator';
export type { CreateDeckInput, UpdateDeckInput, AddCardInput } from '@/lib/validators/deck';

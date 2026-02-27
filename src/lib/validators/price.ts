import { z } from 'zod/v4';

export const priceQuerySchema = z.object({
  source: z.enum(['EBAY', 'CARDMARKET']).optional(),
  currency: z.enum(['EUR', 'USD', 'GBP']).optional().default('EUR'),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export type PriceQueryInput = z.infer<typeof priceQuerySchema>;

export const collectionValueQuerySchema = z.object({
  currency: z.enum(['EUR', 'USD', 'GBP']).optional().default('EUR'),
});

export type CollectionValueQueryInput = z.infer<typeof collectionValueQuerySchema>;

export const deckValueQuerySchema = z.object({
  currency: z.enum(['EUR', 'USD', 'GBP']).optional().default('EUR'),
});

export type DeckValueQueryInput = z.infer<typeof deckValueQuerySchema>;

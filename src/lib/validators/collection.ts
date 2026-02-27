import { z } from 'zod/v4';

export const addToCollectionSchema = z.object({
  cardId: z.string().min(1),
  status: z.enum(['OWNED', 'WISHLIST', 'TRADE']).optional().default('OWNED'),
  condition: z.enum(['MINT', 'NEAR_MINT', 'EXCELLENT', 'GOOD', 'PLAYED', 'POOR']).optional().default('NEAR_MINT'),
  quantity: z.number().int().min(1).max(99).optional().default(1),
  language: z.enum(['en', 'fr']).optional().default('en'),
});

export type AddToCollectionInput = z.infer<typeof addToCollectionSchema>;

export const updateCollectionCardSchema = z.object({
  status: z.enum(['OWNED', 'WISHLIST', 'TRADE']).optional(),
  condition: z.enum(['MINT', 'NEAR_MINT', 'EXCELLENT', 'GOOD', 'PLAYED', 'POOR']).optional(),
  quantity: z.number().int().min(1).max(99).optional(),
  language: z.enum(['en', 'fr']).optional(),
});

export type UpdateCollectionCardInput = z.infer<typeof updateCollectionCardSchema>;

export const collectionFiltersSchema = z.object({
  status: z.enum(['OWNED', 'WISHLIST', 'TRADE']).optional(),
  search: z.string().optional(),
});

export type CollectionFiltersInput = z.infer<typeof collectionFiltersSchema>;

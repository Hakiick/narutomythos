import { z } from 'zod/v4';

export const createDeckSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional().default(false),
});

export type CreateDeckInput = z.infer<typeof createDeckSchema>;

export const updateDeckSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  isPublic: z.boolean().optional(),
});

export type UpdateDeckInput = z.infer<typeof updateDeckSchema>;

export const addCardSchema = z.object({
  cardId: z.string().min(1),
  quantity: z.number().int().min(1).max(2).optional().default(1),
});

export type AddCardInput = z.infer<typeof addCardSchema>;

import { z } from 'zod/v4';

export const cardFiltersSchema = z.object({
  type: z.enum(['CHARACTER', 'MISSION', 'JUTSU']).optional(),
  rarity: z.enum(['C', 'UC', 'R', 'AR', 'S', 'L', 'MYTHOS']).optional(),
  search: z.string().optional(),
  group: z.string().optional(),
  chakraMin: z.coerce.number().int().min(0).max(8).optional(),
  chakraMax: z.coerce.number().int().min(0).max(8).optional(),
  powerMin: z.coerce.number().int().min(0).max(9).optional(),
  powerMax: z.coerce.number().int().min(0).max(9).optional(),
  keywords: z.array(z.string()).optional(),
  effectTypes: z.array(z.enum(['MAIN', 'UPGRADE', 'AMBUSH', 'SCORE'])).optional(),
});

export type CardFiltersInput = z.infer<typeof cardFiltersSchema>;

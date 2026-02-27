import { z } from 'zod/v4';

export const cardFiltersSchema = z.object({
  type: z.enum(['CHARACTER', 'MISSION', 'JUTSU']).optional(),
  rarity: z.enum(['C', 'UC', 'R', 'AR', 'S', 'L']).optional(),
  search: z.string().optional(),
  group: z.string().optional(),
});

export type CardFiltersInput = z.infer<typeof cardFiltersSchema>;

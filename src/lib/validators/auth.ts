import { z } from 'zod/v4';

export const registerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

export type RegisterInput = z.infer<typeof registerSchema>;

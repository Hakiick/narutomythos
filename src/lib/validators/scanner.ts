import { z } from 'zod/v4';

export const scannerLookupSchema = z.object({
  code: z
    .string()
    .regex(/^KS-\d{3}$/, 'Card code must match format KS-XXX (e.g. KS-001)'),
});

export type ScannerLookupInput = z.infer<typeof scannerLookupSchema>;

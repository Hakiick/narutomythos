import { describe, it, expect } from 'vitest';
import { scannerLookupSchema } from '@/lib/validators/scanner';

describe('scannerLookupSchema', () => {
  it('should accept valid card code KS-001', () => {
    const result = scannerLookupSchema.safeParse({ code: 'KS-001' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe('KS-001');
    }
  });

  it('should accept KS-152 (last card in set)', () => {
    const result = scannerLookupSchema.safeParse({ code: 'KS-152' });
    expect(result.success).toBe(true);
  });

  it('should accept KS-100', () => {
    const result = scannerLookupSchema.safeParse({ code: 'KS-100' });
    expect(result.success).toBe(true);
  });

  it('should reject code without prefix', () => {
    const result = scannerLookupSchema.safeParse({ code: '001' });
    expect(result.success).toBe(false);
  });

  it('should reject code with wrong prefix', () => {
    const result = scannerLookupSchema.safeParse({ code: 'OP-001' });
    expect(result.success).toBe(false);
  });

  it('should reject code with too few digits', () => {
    const result = scannerLookupSchema.safeParse({ code: 'KS-01' });
    expect(result.success).toBe(false);
  });

  it('should reject code with too many digits', () => {
    const result = scannerLookupSchema.safeParse({ code: 'KS-0001' });
    expect(result.success).toBe(false);
  });

  it('should reject empty string', () => {
    const result = scannerLookupSchema.safeParse({ code: '' });
    expect(result.success).toBe(false);
  });

  it('should reject missing code', () => {
    const result = scannerLookupSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject lowercase prefix', () => {
    const result = scannerLookupSchema.safeParse({ code: 'ks-001' });
    expect(result.success).toBe(false);
  });

  it('should reject code with spaces', () => {
    const result = scannerLookupSchema.safeParse({ code: 'KS- 001' });
    expect(result.success).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { registerSchema } from '@/lib/validators/auth';

describe('registerSchema', () => {
  it('should accept valid input', () => {
    const result = registerSchema.safeParse({
      name: 'Naruto',
      email: 'naruto@leafvillage.com',
      password: 'rasengan123',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Naruto');
      expect(result.data.email).toBe('naruto@leafvillage.com');
      expect(result.data.password).toBe('rasengan123');
    }
  });

  it('should reject missing name', () => {
    const result = registerSchema.safeParse({
      email: 'naruto@leafvillage.com',
      password: 'rasengan123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty name', () => {
    const result = registerSchema.safeParse({
      name: '',
      email: 'naruto@leafvillage.com',
      password: 'rasengan123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject name longer than 100 chars', () => {
    const result = registerSchema.safeParse({
      name: 'a'.repeat(101),
      email: 'naruto@leafvillage.com',
      password: 'rasengan123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing email', () => {
    const result = registerSchema.safeParse({
      name: 'Naruto',
      password: 'rasengan123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid email', () => {
    const result = registerSchema.safeParse({
      name: 'Naruto',
      email: 'not-an-email',
      password: 'rasengan123',
    });
    expect(result.success).toBe(false);
  });

  it('should reject missing password', () => {
    const result = registerSchema.safeParse({
      name: 'Naruto',
      email: 'naruto@leafvillage.com',
    });
    expect(result.success).toBe(false);
  });

  it('should reject password shorter than 6 chars', () => {
    const result = registerSchema.safeParse({
      name: 'Naruto',
      email: 'naruto@leafvillage.com',
      password: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('should accept password of exactly 6 chars', () => {
    const result = registerSchema.safeParse({
      name: 'Naruto',
      email: 'naruto@leafvillage.com',
      password: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('should reject password longer than 128 chars', () => {
    const result = registerSchema.safeParse({
      name: 'Naruto',
      email: 'naruto@leafvillage.com',
      password: 'a'.repeat(129),
    });
    expect(result.success).toBe(false);
  });

  it('should accept password of exactly 128 chars', () => {
    const result = registerSchema.safeParse({
      name: 'Naruto',
      email: 'naruto@leafvillage.com',
      password: 'a'.repeat(128),
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty object', () => {
    const result = registerSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

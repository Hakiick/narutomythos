import { describe, it, expect } from 'vitest';
import {
  cosineSimilarity,
  normalizeEmbedding,
  computeL2Norm,
  findTopCandidates,
} from '@/lib/card-recognition/reference-db';
import type { ReferenceDatabase } from '@/lib/card-recognition/reference-db';

describe('computeL2Norm', () => {
  it('should compute L2 norm of a simple vector', () => {
    const v = new Float32Array([3, 4]);
    expect(computeL2Norm(v)).toBeCloseTo(5, 5);
  });

  it('should return 0 for zero vector', () => {
    const v = new Float32Array([0, 0, 0]);
    expect(computeL2Norm(v)).toBe(0);
  });

  it('should compute norm for unit vector', () => {
    const v = new Float32Array([1, 0, 0]);
    expect(computeL2Norm(v)).toBeCloseTo(1, 5);
  });
});

describe('normalizeEmbedding', () => {
  it('should normalize vector to unit length', () => {
    const v = new Float32Array([3, 4]);
    const normalized = normalizeEmbedding(v);
    expect(computeL2Norm(normalized)).toBeCloseTo(1, 5);
    expect(normalized[0]).toBeCloseTo(0.6, 5);
    expect(normalized[1]).toBeCloseTo(0.8, 5);
  });

  it('should return zero vector for zero input', () => {
    const v = new Float32Array([0, 0, 0]);
    const normalized = normalizeEmbedding(v);
    expect(normalized[0]).toBe(0);
    expect(normalized[1]).toBe(0);
    expect(normalized[2]).toBe(0);
  });
});

describe('cosineSimilarity', () => {
  it('should return 1 for identical vectors', () => {
    const v = new Float32Array([1, 2, 3]);
    expect(cosineSimilarity(v, v)).toBeCloseTo(1, 5);
  });

  it('should return -1 for opposite vectors', () => {
    const a = new Float32Array([1, 0]);
    const b = new Float32Array([-1, 0]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(-1, 5);
  });

  it('should return 0 for orthogonal vectors', () => {
    const a = new Float32Array([1, 0]);
    const b = new Float32Array([0, 1]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(0, 5);
  });

  it('should return 0 for zero vector', () => {
    const a = new Float32Array([1, 2, 3]);
    const b = new Float32Array([0, 0, 0]);
    expect(cosineSimilarity(a, b)).toBe(0);
  });

  it('should throw on dimension mismatch', () => {
    const a = new Float32Array([1, 2]);
    const b = new Float32Array([1, 2, 3]);
    expect(() => cosineSimilarity(a, b)).toThrow('Vector dimension mismatch');
  });

  it('should be symmetric', () => {
    const a = new Float32Array([1, 2, 3]);
    const b = new Float32Array([4, 5, 6]);
    expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a), 5);
  });
});

describe('findTopCandidates', () => {
  function makeDb(entries: Array<{ code: string; emb: number[] }>): ReferenceDatabase {
    return {
      embeddings: entries.map((e) => ({
        cardCode: e.code,
        embedding: normalizeEmbedding(new Float32Array(e.emb)),
      })),
      cardCount: entries.length,
      embeddingDim: entries[0]?.emb.length ?? 0,
      model: 'test',
    };
  }

  it('should return top candidates sorted by similarity', () => {
    const db = makeDb([
      { code: 'KS-001', emb: [1, 0, 0] },
      { code: 'KS-002', emb: [0.9, 0.1, 0] },
      { code: 'KS-003', emb: [0, 1, 0] },
    ]);
    const query = new Float32Array([1, 0, 0]);
    const results = findTopCandidates(query, db, 3, 0);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].cardCode).toBe('KS-001');
  });

  it('should respect topK limit', () => {
    const db = makeDb([
      { code: 'KS-001', emb: [1, 0] },
      { code: 'KS-002', emb: [0.9, 0.1] },
      { code: 'KS-003', emb: [0.8, 0.2] },
    ]);
    const query = new Float32Array([1, 0]);
    const results = findTopCandidates(query, db, 2, 0);

    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('should filter by threshold', () => {
    const db = makeDb([
      { code: 'KS-001', emb: [1, 0] },
      { code: 'KS-002', emb: [0, 1] },
    ]);
    const query = new Float32Array([1, 0]);
    const results = findTopCandidates(query, db, 10, 0.99);

    // Only perfect or near-perfect match should pass high threshold
    for (const r of results) {
      expect(r.confidence).toBeGreaterThanOrEqual(0.99);
    }
  });

  it('should return empty array for no matches above threshold', () => {
    const db = makeDb([
      { code: 'KS-001', emb: [0, 1] },
    ]);
    const query = new Float32Array([1, 0]);
    // Orthogonal vectors with very high threshold
    const results = findTopCandidates(query, db, 10, 0.99);
    expect(results.length).toBe(0);
  });
});

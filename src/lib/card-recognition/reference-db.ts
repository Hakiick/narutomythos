import type {
  EmbeddingDatabase,
  ReferenceEmbedding,
  RecognitionResult,
} from "@/types/ml";
import { hexToDHash, dHashSimilarity } from "./dhash";

export interface ReferenceDatabase {
  embeddings: ReferenceEmbedding[];
  cardCount: number;
  embeddingDim: number;
  model: string;
}

export function computeL2Norm(v: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < v.length; i++) {
    sum += v[i] * v[i];
  }
  return Math.sqrt(sum);
}

export function normalizeEmbedding(v: Float32Array): Float32Array {
  const norm = computeL2Norm(v);
  if (norm === 0) {
    return new Float32Array(v.length);
  }
  const result = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) {
    result[i] = v[i] / norm;
  }
  return result;
}

export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return dot / denom;
}

export async function loadReferenceDatabase(
  url: string
): Promise<ReferenceDatabase> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to load reference database from ${url}: ${response.status} ${response.statusText}`
    );
  }

  const json: EmbeddingDatabase = (await response.json()) as EmbeddingDatabase;

  const embeddings: ReferenceEmbedding[] = json.entries.map((entry) => ({
    cardCode: entry.cardCode,
    embedding: normalizeEmbedding(new Float32Array(entry.embedding)),
    histogram: entry.histogram ? new Float32Array(entry.histogram) : undefined,
    color: entry.color,
    dhash: entry.dhash ? hexToDHash(entry.dhash) : undefined,
  }));

  return {
    embeddings,
    cardCount: json.cardCount,
    embeddingDim: json.embeddingDim,
    model: json.model,
  };
}

interface ManifestEntry {
  setCode: string;
  embeddingsUrl: string;
  cardCount: number;
}

interface Manifest {
  version: string;
  model: string;
  sets: ManifestEntry[];
}

export async function loadAllReferenceDatabases(
  manifestUrl: string
): Promise<ReferenceDatabase> {
  const response = await fetch(manifestUrl);
  if (!response.ok) {
    throw new Error(
      `Failed to load manifest from ${manifestUrl}: ${response.status}`
    );
  }

  const manifest = (await response.json()) as Manifest;

  let baseOrigin = "";
  try {
    baseOrigin = new URL(manifestUrl).origin;
  } catch {
    // manifestUrl is relative
  }
  const resolveUrl = (url: string): string =>
    baseOrigin && url.startsWith("/") ? baseOrigin + url : url;

  const databases = await Promise.all(
    manifest.sets.map((entry) =>
      loadReferenceDatabase(resolveUrl(entry.embeddingsUrl))
    )
  );

  const allEmbeddings: ReferenceEmbedding[] = [];
  let embeddingDim = 0;

  for (const db of databases) {
    allEmbeddings.push(...db.embeddings);
    if (db.embeddingDim > 0) embeddingDim = db.embeddingDim;
  }

  return {
    embeddings: allEmbeddings,
    cardCount: allEmbeddings.length,
    embeddingDim,
    model: manifest.model,
  };
}

function histogramIntersection(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.min(a[i], b[i]);
  return sum;
}

export function findTopCandidates(
  query: Float32Array,
  db: ReferenceDatabase,
  topK: number,
  threshold: number,
  queryHistogram?: Float32Array,
  colorFilter?: string | null,
  queryDHash?: Float32Array
): RecognitionResult[] {
  const normalizedQuery = normalizeEmbedding(query);
  const useHistogram =
    !!queryHistogram && db.embeddings.some((e) => e.histogram);
  const useDHash =
    queryDHash !== undefined &&
    db.embeddings.some((e) => e.dhash !== undefined);

  const normEmb = (v: number) =>
    Math.min(1, Math.max(0, (v - 0.35) / 0.35));
  const normHist = (v: number) =>
    Math.min(1, Math.max(0, (v - 0.05) / 0.30));
  const normSpatial = (v: number) =>
    Math.min(1, Math.max(0, (v - 0.10) / 0.40));

  function scoreRef(ref: ReferenceEmbedding): { score: number } {
    const embSim = cosineSimilarity(normalizedQuery, ref.embedding);

    if (
      useHistogram &&
      useDHash &&
      ref.histogram &&
      queryHistogram &&
      ref.dhash !== undefined
    ) {
      const histSim = histogramIntersection(queryHistogram, ref.histogram);
      const dhSim = dHashSimilarity(queryDHash, ref.dhash);
      return {
        score:
          0.45 * normEmb(embSim) +
          0.25 * normHist(histSim) +
          0.3 * normSpatial(dhSim),
      };
    } else if (useDHash && ref.dhash !== undefined) {
      const dhSim = dHashSimilarity(queryDHash, ref.dhash);
      return {
        score: 0.55 * normEmb(embSim) + 0.45 * normSpatial(dhSim),
      };
    } else if (useHistogram && ref.histogram && queryHistogram) {
      const histSim = histogramIntersection(queryHistogram, ref.histogram);
      return {
        score: 0.6 * normEmb(embSim) + 0.4 * normHist(histSim),
      };
    }
    return { score: normEmb(embSim) };
  }

  let results: Array<{ cardCode: string; similarity: number }> = [];

  if (colorFilter) {
    const sameColorRefs = db.embeddings.filter((e) => e.color === colorFilter);

    for (const ref of sameColorRefs) {
      const { score } = scoreRef(ref);
      if (score >= threshold) {
        results.push({ cardCode: ref.cardCode, similarity: score });
      }
    }
    results.sort((a, b) => b.similarity - a.similarity);

    const bestSameColor = results[0]?.similarity ?? 0;
    if (bestSameColor < 0.4) {
      results = [];
      for (const ref of db.embeddings) {
        const { score } = scoreRef(ref);
        if (score >= threshold) {
          results.push({ cardCode: ref.cardCode, similarity: score });
        }
      }
      results.sort((a, b) => b.similarity - a.similarity);
    }
  } else {
    for (const ref of db.embeddings) {
      const { score } = scoreRef(ref);
      if (score >= threshold) {
        results.push({ cardCode: ref.cardCode, similarity: score });
      }
    }
    results.sort((a, b) => b.similarity - a.similarity);
  }

  const seen = new Map<string, (typeof results)[0]>();
  for (const r of results) {
    const existing = seen.get(r.cardCode);
    if (!existing || r.similarity > existing.similarity) {
      seen.set(r.cardCode, r);
    }
  }
  const deduped = [...seen.values()].sort(
    (a, b) => b.similarity - a.similarity
  );

  const topResults = deduped.slice(0, topK);
  const candidateCount = topResults.length;

  return topResults.map((r) => ({
    cardCode: r.cardCode,
    confidence: r.similarity,
    candidateCount,
    durationMs: 0,
  }));
}

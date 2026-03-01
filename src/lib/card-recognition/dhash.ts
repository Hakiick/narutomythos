/**
 * Spatial Color Descriptor for perceptual image similarity.
 *
 * Creates a compact descriptor by resizing the image to a 12x12 grid
 * and storing mean-centered, L2-normalized RGB values per cell.
 * This captures the spatial layout of colors — WHERE colors appear.
 */

const GRID_W = 12;
const GRID_H = 12;
const CHANNELS = 3;
export const DHASH_DIM = GRID_W * GRID_H * CHANNELS; // 432

export function computeDHash(imageData: ImageData): Float32Array {
  const { data, width, height } = imageData;
  const descriptor = new Float32Array(DHASH_DIM);
  const cellW = width / GRID_W;
  const cellH = height / GRID_H;

  for (let gy = 0; gy < GRID_H; gy++) {
    for (let gx = 0; gx < GRID_W; gx++) {
      const startX = Math.floor(gx * cellW);
      const endX = Math.min(Math.floor((gx + 1) * cellW), width);
      const startY = Math.floor(gy * cellH);
      const endY = Math.min(Math.floor((gy + 1) * cellH), height);

      let sumR = 0,
        sumG = 0,
        sumB = 0,
        count = 0;
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * width + x) * 4;
          sumR += data[idx];
          sumG += data[idx + 1];
          sumB += data[idx + 2];
          count++;
        }
      }

      const offset = (gy * GRID_W + gx) * CHANNELS;
      if (count > 0) {
        descriptor[offset] = sumR / count / 255;
        descriptor[offset + 1] = sumG / count / 255;
        descriptor[offset + 2] = sumB / count / 255;
      }
    }
  }

  return normalizeDescriptor(descriptor);
}

export function computeDHashFromRgb(
  rgbBuffer: Buffer | Uint8Array,
  width: number,
  height: number
): Float32Array {
  const descriptor = new Float32Array(DHASH_DIM);
  const cellW = width / GRID_W;
  const cellH = height / GRID_H;

  for (let gy = 0; gy < GRID_H; gy++) {
    for (let gx = 0; gx < GRID_W; gx++) {
      const startX = Math.floor(gx * cellW);
      const endX = Math.min(Math.floor((gx + 1) * cellW), width);
      const startY = Math.floor(gy * cellH);
      const endY = Math.min(Math.floor((gy + 1) * cellH), height);

      let sumR = 0,
        sumG = 0,
        sumB = 0,
        count = 0;
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * width + x) * 3;
          sumR += rgbBuffer[idx];
          sumG += rgbBuffer[idx + 1];
          sumB += rgbBuffer[idx + 2];
          count++;
        }
      }

      const offset = (gy * GRID_W + gx) * CHANNELS;
      if (count > 0) {
        descriptor[offset] = sumR / count / 255;
        descriptor[offset + 1] = sumG / count / 255;
        descriptor[offset + 2] = sumB / count / 255;
      }
    }
  }

  return normalizeDescriptor(descriptor);
}

function normalizeDescriptor(descriptor: Float32Array): Float32Array {
  let mean = 0;
  for (let i = 0; i < DHASH_DIM; i++) mean += descriptor[i];
  mean /= DHASH_DIM;
  for (let i = 0; i < DHASH_DIM; i++) descriptor[i] -= mean;

  let norm = 0;
  for (let i = 0; i < DHASH_DIM; i++) norm += descriptor[i] * descriptor[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < DHASH_DIM; i++) descriptor[i] /= norm;
  }

  return descriptor;
}

export function dHashSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom === 0) return 0;
  return Math.max(0, dot / denom);
}

export function dHashToHex(hash: Float32Array): number[] {
  return Array.from(hash);
}

export function hexToDHash(data: number[] | string): Float32Array {
  if (typeof data === "string") return new Float32Array(DHASH_DIM);
  return new Float32Array(data);
}

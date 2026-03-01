/**
 * Color histogram matching for card identification.
 *
 * Computes HSV color histograms and uses histogram intersection for matching.
 * Fast, mirror-invariant, rotation-invariant, robust to watermarks.
 */

const H_BINS = 16;
const S_BINS = 8;
const V_BINS = 8;
export const HISTOGRAM_SIZE = H_BINS * S_BINS * V_BINS;

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (d > 0) {
    if (max === r) {
      h = 60 * (((g - b) / d) % 6);
    } else if (max === g) {
      h = 60 * ((b - r) / d + 2);
    } else {
      h = 60 * ((r - g) / d + 4);
    }
    if (h < 0) h += 360;
  }

  return [h, s, v];
}

export function computeHistogram(imageData: ImageData): Float32Array {
  const { data, width, height } = imageData;
  const histogram = new Float32Array(HISTOGRAM_SIZE);
  const pixelCount = width * height;

  for (let i = 0; i < pixelCount; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];

    const [h, s, v] = rgbToHsv(r, g, b);

    if (v < 0.1 || (s < 0.1 && v > 0.6)) continue;

    const hBin = Math.min(Math.floor((h / 360) * H_BINS), H_BINS - 1);
    const sBin = Math.min(Math.floor(s * S_BINS), S_BINS - 1);
    const vBin = Math.min(Math.floor(v * V_BINS), V_BINS - 1);

    const idx = hBin * S_BINS * V_BINS + sBin * V_BINS + vBin;
    histogram[idx]++;
  }

  let sum = 0;
  for (let i = 0; i < HISTOGRAM_SIZE; i++) sum += histogram[i];
  if (sum > 0) {
    for (let i = 0; i < HISTOGRAM_SIZE; i++) histogram[i] /= sum;
  }

  return histogram;
}

export function histogramIntersection(
  a: Float32Array,
  b: Float32Array
): number {
  let intersection = 0;
  for (let i = 0; i < a.length; i++) {
    intersection += Math.min(a[i], b[i]);
  }
  return intersection;
}

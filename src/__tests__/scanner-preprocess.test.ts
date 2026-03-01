import { describe, it, expect } from 'vitest';
import { normalizePixel, rgbaToNormalizedRgb } from '@/lib/card-recognition/preprocess';

describe('normalizePixel', () => {
  it('should normalize black pixel (0) for R channel', () => {
    // (0 / 255 - 0.485) / 0.229 ≈ -2.1179
    const result = normalizePixel(0, 0);
    expect(result).toBeCloseTo(-2.1179, 3);
  });

  it('should normalize white pixel (255) for R channel', () => {
    // (255 / 255 - 0.485) / 0.229 ≈ 2.2489
    const result = normalizePixel(255, 0);
    expect(result).toBeCloseTo(2.2489, 3);
  });

  it('should normalize midpoint pixel (128) for G channel', () => {
    // (128 / 255 - 0.456) / 0.224 ≈ 0.2065
    const result = normalizePixel(128, 1);
    expect(result).toBeCloseTo((128 / 255 - 0.456) / 0.224, 3);
  });

  it('should normalize for B channel', () => {
    // (100 / 255 - 0.406) / 0.225
    const result = normalizePixel(100, 2);
    expect(result).toBeCloseTo((100 / 255 - 0.406) / 0.225, 3);
  });

  it('should default to channel 0 (R)', () => {
    const result = normalizePixel(128);
    const expected = (128 / 255 - 0.485) / 0.229;
    expect(result).toBeCloseTo(expected, 3);
  });
});

describe('rgbaToNormalizedRgb', () => {
  it('should convert RGBA to NCHW normalized format', () => {
    // 2 pixels: (255, 0, 0, 255) and (0, 255, 0, 255)
    const rgba = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]);
    const result = rgbaToNormalizedRgb(rgba, 2);

    // Result should be [R0, R1, G0, G1, B0, B1]
    expect(result.length).toBe(6);

    // R plane: pixel0=255, pixel1=0
    expect(result[0]).toBeCloseTo(normalizePixel(255, 0), 5);
    expect(result[1]).toBeCloseTo(normalizePixel(0, 0), 5);

    // G plane: pixel0=0, pixel1=255
    expect(result[2]).toBeCloseTo(normalizePixel(0, 1), 5);
    expect(result[3]).toBeCloseTo(normalizePixel(255, 1), 5);

    // B plane: pixel0=0, pixel1=0
    expect(result[4]).toBeCloseTo(normalizePixel(0, 2), 5);
    expect(result[5]).toBeCloseTo(normalizePixel(0, 2), 5);
  });

  it('should drop alpha channel', () => {
    // 1 pixel with alpha=128
    const rgba = new Uint8ClampedArray([100, 150, 200, 128]);
    const result = rgbaToNormalizedRgb(rgba, 1);

    expect(result.length).toBe(3);
    expect(result[0]).toBeCloseTo(normalizePixel(100, 0), 5);
    expect(result[1]).toBeCloseTo(normalizePixel(150, 1), 5);
    expect(result[2]).toBeCloseTo(normalizePixel(200, 2), 5);
  });
});

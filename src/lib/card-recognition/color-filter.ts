/**
 * Card border color detection for search space reduction.
 *
 * Disabled for Naruto Mythos TCG — cards don't have distinctive
 * border colors like One Piece TCG. Returns null to skip color filtering.
 * Can be calibrated later with actual card images.
 */

export type CardColor = string | null;

export function detectBorderColor(_imageData: ImageData): CardColor {
  return null;
}

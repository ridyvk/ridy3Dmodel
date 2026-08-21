const CLOSED_NOSE_AMOUNT = 0.055;
const FULLY_OPEN_NOSE_AMOUNT = 0.88;
const MAX_SURFACE_RIM_WEIGHT = 0.18;
const TISSUE_REVEAL_START = 0.14;
const TISSUE_REVEAL_FULL = 0.82;

export const NOSTRIL_TISSUE_MIN_HALF_WIDTH = 0.00011;
export const NOSTRIL_TISSUE_MAX_HALF_WIDTH = 0.00072;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function nostrilOpenFromRise(rise: number, authoredRise = 0.00265) {
  const authoredAmount = rise / authoredRise;
  const linear = clamp01(
    (authoredAmount - CLOSED_NOSE_AMOUNT) /
      (FULLY_OPEN_NOSE_AMOUNT - CLOSED_NOSE_AMOUNT),
  );
  return linear * linear * (3 - 2 * linear);
}

export function nostrilTissueStrengthFromOpen(open: number) {
  const linear = clamp01(
    (clamp01(open) - TISSUE_REVEAL_START) /
      (TISSUE_REVEAL_FULL - TISSUE_REVEAL_START),
  );
  return linear * linear * (3 - 2 * linear);
}

export function nostrilTissueHalfWidthFromStrength(strength: number) {
  const amount = clamp01(strength);
  return NOSTRIL_TISSUE_MIN_HALF_WIDTH +
    (NOSTRIL_TISSUE_MAX_HALF_WIDTH - NOSTRIL_TISSUE_MIN_HALF_WIDTH) * amount;
}

export function nostrilSurfaceWeightFromOpen(open: number) {
  return clamp01(open) * MAX_SURFACE_RIM_WEIGHT;
}

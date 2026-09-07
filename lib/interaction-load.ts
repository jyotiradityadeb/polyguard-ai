import type { Evidence } from "@/types/polyguard";
export const loadConfig = {
  weights: { LOW: 1, MODERATE: 2, HIGH: 3, UNKNOWN: 0 },
  moderate: 3,
  elevated: 6,
};
export function interactionLoad(
  concerns: Evidence["potentialConcern"][],
  overlaps: number,
) {
  const pairPoints = concerns.reduce((n, c) => n + loadConfig.weights[c], 0);
  const score = pairPoints + overlaps;
  const unknownCount = concerns.filter((c) => c === "UNKNOWN").length;
  return {
    score,
    label: unknownCount
      ? "Incomplete"
      : score >= loadConfig.elevated
        ? "Elevated"
        : score >= loadConfig.moderate
          ? "Moderate"
          : "Low",
    pairPoints,
    overlapPoints: overlaps,
    unknownCount,
  };
}

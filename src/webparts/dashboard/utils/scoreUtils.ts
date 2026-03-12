// scoreUtils.ts
// Score classification helpers for the ISMS Objectives section.
// All visual styling decisions (color, label) flow through these utilities
// so the only place to change thresholds is objectivesConfig.ts.

import { IScoreThreshold, IScoreThresholds } from "../config/objectivesConfig";

/**
 * Returns the threshold band that a given score falls into.
 * A null / undefined score is treated as the lowest band.
 */
export function getScoreStyle(
  score: number | undefined,
  thresholds: IScoreThresholds,
): IScoreThreshold {
  if (score === undefined) return thresholds.low;
  if (score <= thresholds.low.max) return thresholds.low;
  if (score <= thresholds.acceptable.max) return thresholds.acceptable;
  return thresholds.achieved;
}

/** Formats a numeric score for display (2 decimal places), or "—" if null. */
export function formatScore(score: number | undefined): string {
  if (score === undefined) return "—";
  return score.toFixed(2);
}

/**
 * Converts a score (0–1) to a percentage suitable for progress-bar width.
 * Clamps to [0, 100].
 */
export function scoreToPercent(score: number | undefined): number {
  if (score === undefined) return 0;
  return Math.min(100, Math.max(0, score * 100));
}

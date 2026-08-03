import { CefrLevel, Subject } from '@prisma/client';

export const CEFR_ORDER: CefrLevel[] = [
  CefrLevel.A1,
  CefrLevel.A2,
  CefrLevel.B1,
  CefrLevel.B2,
  CefrLevel.C1,
  CefrLevel.C2,
];

export function levelIndex(level: CefrLevel): number {
  return CEFR_ORDER.indexOf(level);
}

export function compareLevels(a: CefrLevel, b: CefrLevel): number {
  return levelIndex(a) - levelIndex(b);
}

/**
 * UzBMB multilevel (English): each section scaled 0–75, overall = average of sections.
 *   C1: 65–75, B2: 51–64, B1: 38–50, below 38 — level not awarded (A2 estimate for feedback).
 */
export function englishScoreToLevel(overall: number): CefrLevel | null {
  if (overall >= 65) return CefrLevel.C1;
  if (overall >= 51) return CefrLevel.B2;
  if (overall >= 38) return CefrLevel.B1;
  return null;
}

/** Scale a raw section score to the 0–75 band used by UzBMB. */
export function scaleTo75(raw: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((raw / max) * 75 * 10) / 10;
}

export function estimateLevel(subject: Subject, overall: number): CefrLevel | null {
  // Both current subjects use a 75-point overall scale
  return englishScoreToLevel(overall);
}

/** Rough level estimate used by placement flows (percentage of graded ladder). */
export function placementEstimate(percent: number): CefrLevel {
  if (percent >= 85) return CefrLevel.C1;
  if (percent >= 70) return CefrLevel.B2;
  if (percent >= 50) return CefrLevel.B1;
  if (percent >= 30) return CefrLevel.A2;
  return CefrLevel.A1;
}

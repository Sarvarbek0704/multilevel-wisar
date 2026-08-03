/**
 * SM-2 spaced repetition.
 * Grade scale: 0 = bilmadim (again), 3 = qiyin (hard), 4 = yaxshi (good), 5 = oson (easy).
 */
export interface SrsState {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
}

export interface SrsUpdate extends SrsState {
  dueAt: Date;
}

export function applySm2(state: SrsState, grade: number, now = new Date()): SrsUpdate {
  const g = Math.max(0, Math.min(5, Math.round(grade)));

  if (g < 3) {
    // Forgotten — relearn in 10 minutes
    return {
      easeFactor: Math.max(1.3, state.easeFactor - 0.2),
      intervalDays: 0,
      repetitions: 0,
      lapses: state.lapses + 1,
      dueAt: new Date(now.getTime() + 10 * 60 * 1000),
    };
  }

  const easeFactor = Math.max(
    1.3,
    state.easeFactor + (0.1 - (5 - g) * (0.08 + (5 - g) * 0.02)),
  );
  const repetitions = state.repetitions + 1;

  let intervalDays: number;
  if (repetitions === 1) intervalDays = 1;
  else if (repetitions === 2) intervalDays = 6;
  else intervalDays = Math.round(state.intervalDays * easeFactor);
  // "Hard" grade grows slower
  if (g === 3 && repetitions > 2) intervalDays = Math.max(1, Math.round(intervalDays * 0.7));

  return {
    easeFactor,
    intervalDays,
    repetitions,
    lapses: state.lapses,
    dueAt: new Date(now.getTime() + intervalDays * 86_400_000),
  };
}

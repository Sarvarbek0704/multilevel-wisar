import { ExerciseType } from '@prisma/client';

export interface CheckResult {
  isCorrect: boolean;
  /** 0..1 fraction for partially-correct answers (gap fills, matching) */
  ratio: number;
  /** Per-item breakdown where applicable */
  detail?: unknown;
}

function normalizeText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[’´`]/g, "'");
}

/**
 * Server-side answer checking. `correct` is the stored answerJson, `given` is
 * the user's submission. Shapes by type:
 *  - MCQ_SINGLE / TRUE_FALSE: correct {value}, given {value}
 *  - MCQ_MULTI: correct {values: []}, given {values: []}
 *  - GAP_FILL / SHORT_ANSWER: correct {gaps: [[acceptable...]...]} or {accept: []}, given {values: []} or {value}
 *  - MATCHING: correct {pairs: {left: right}}, given {pairs: {left: right}}
 *  - ORDERING: correct {order: []}, given {order: []}
 */
export function checkAnswer(
  type: ExerciseType,
  correct: unknown,
  given: unknown,
): CheckResult | null {
  if (correct == null || given == null) return null;
  const c = correct as Record<string, unknown>;
  const g = given as Record<string, unknown>;

  switch (type) {
    case ExerciseType.MCQ_SINGLE:
    case ExerciseType.TRUE_FALSE: {
      const isCorrect = normalizeText(c.value) === normalizeText(g.value);
      return { isCorrect, ratio: isCorrect ? 1 : 0 };
    }

    case ExerciseType.MCQ_MULTI: {
      const correctSet = new Set((Array.isArray(c.values) ? c.values : []).map(normalizeText));
      const givenSet = new Set((Array.isArray(g.values) ? g.values : []).map(normalizeText));
      if (correctSet.size === 0) return null;
      let hits = 0;
      for (const v of givenSet) if (correctSet.has(v)) hits++;
      const wrong = givenSet.size - hits;
      const ratio = Math.max(0, (hits - wrong) / correctSet.size);
      return { isCorrect: ratio === 1, ratio };
    }

    case ExerciseType.GAP_FILL:
    case ExerciseType.SHORT_ANSWER: {
      // Single-answer form
      if (Array.isArray(c.accept)) {
        const accepted = c.accept.map(normalizeText);
        const isCorrect = accepted.includes(normalizeText(g.value));
        return { isCorrect, ratio: isCorrect ? 1 : 0 };
      }
      // Multi-gap form
      const gaps = Array.isArray(c.gaps) ? c.gaps : [];
      const values = Array.isArray(g.values) ? g.values : [];
      if (gaps.length === 0) return null;
      const detail = gaps.map((acceptable, i) => {
        const accepted = (Array.isArray(acceptable) ? acceptable : [acceptable]).map(normalizeText);
        return accepted.includes(normalizeText(values[i]));
      });
      const hits = detail.filter(Boolean).length;
      return { isCorrect: hits === gaps.length, ratio: hits / gaps.length, detail };
    }

    case ExerciseType.MATCHING: {
      const correctPairs = (c.pairs ?? {}) as Record<string, unknown>;
      const givenPairs = (g.pairs ?? {}) as Record<string, unknown>;
      const keys = Object.keys(correctPairs);
      if (keys.length === 0) return null;
      const detail: Record<string, boolean> = {};
      let hits = 0;
      for (const key of keys) {
        const ok = normalizeText(correctPairs[key]) === normalizeText(givenPairs[key]);
        detail[key] = ok;
        if (ok) hits++;
      }
      return { isCorrect: hits === keys.length, ratio: hits / keys.length, detail };
    }

    case ExerciseType.ORDERING: {
      const correctOrder = (Array.isArray(c.order) ? c.order : []).map(normalizeText);
      const givenOrder = (Array.isArray(g.order) ? g.order : []).map(normalizeText);
      if (correctOrder.length === 0) return null;
      let hits = 0;
      for (let i = 0; i < correctOrder.length; i++) {
        if (correctOrder[i] === givenOrder[i]) hits++;
      }
      return { isCorrect: hits === correctOrder.length, ratio: hits / correctOrder.length };
    }

    case ExerciseType.WRITING_TASK:
    case ExerciseType.SPEAKING_TASK:
      // Open-ended — evaluated by AI, not auto-checked
      return null;

    default:
      return null;
  }
}

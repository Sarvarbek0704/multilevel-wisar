import { CefrLevel, PlanTaskKind, Subject } from '@prisma/client';
import { CEFR_ORDER, levelIndex } from '../common/utils/cefr';

export interface LessonRef {
  id: string;
  titleUz: string;
  level: CefrLevel;
  estimatedMinutes: number;
}

export interface MockRef {
  id: string;
  titleUz: string;
  kind: string;
}

export interface GeneratedTask {
  date: Date;
  order: number;
  kind: PlanTaskKind;
  titleUz: string;
  durationMinutes: number;
  lessonId?: string;
  mockExamId?: string;
  vocabCount?: number;
}

export interface PlanInput {
  subject: Subject;
  startLevel: CefrLevel;
  targetLevel: CefrLevel;
  startDate: Date;
  examDate: Date | null;
  dailyMinutes: number;
  lessons: LessonRef[]; // ordered course lessons in [startLevel..targetLevel]
  fullMocks: MockRef[];
  miniMocks: MockRef[];
}

export interface GeneratedPlan {
  tasks: GeneratedTask[];
  meta: {
    horizonDays: number;
    phases: Array<{ level: CefrLevel; fromDay: number; toDay: number }>;
    lessonsPerDay: number;
  };
}

const DAY_MS = 86_400_000;

/**
 * Deterministic study plan:
 *  - Mon–Fri: lessons (as many as fit the daily minutes) + daily vocab review
 *  - Sat: mock day (mini mocks weekly, full mock every 4th week) + vocab
 *  - Sun: rest / catch-up
 * Lessons are distributed sequentially over the level ladder; remaining days
 * after lessons run out become revision + mock days.
 */
export function generatePlan(input: PlanInput): GeneratedPlan {
  const horizonDays = input.examDate
    ? Math.max(14, Math.ceil((input.examDate.getTime() - input.startDate.getTime()) / DAY_MS))
    : 180;

  const lessonMinutes = Math.max(15, input.dailyMinutes - 15); // 15 min vocab daily
  const lessonsPerDay = Math.max(1, Math.floor(lessonMinutes / 30));

  const tasks: GeneratedTask[] = [];
  let lessonCursor = 0;
  let week = 0;

  for (let day = 0; day < horizonDays; day++) {
    const date = new Date(input.startDate.getTime() + day * DAY_MS);
    const weekday = date.getUTCDay(); // 0=Sun ... 6=Sat
    if (weekday === 1) week++;
    let order = 0;

    if (weekday === 0) {
      tasks.push({
        date,
        order: order++,
        kind: PlanTaskKind.CUSTOM,
        titleUz: 'Dam olish yoki o‘tgan haftani qayta ko‘rish',
        durationMinutes: 20,
      });
      continue;
    }

    if (weekday === 6) {
      const isFullMockWeek = week > 0 && week % 4 === 0;
      const pool = isFullMockWeek ? input.fullMocks : input.miniMocks;
      const mock = pool.length > 0 ? pool[week % pool.length] : undefined;
      tasks.push({
        date,
        order: order++,
        kind: isFullMockWeek ? PlanTaskKind.MOCK_FULL : PlanTaskKind.MOCK_SECTION,
        titleUz: mock
          ? `Mock imtihon: ${mock.titleUz}`
          : isFullMockWeek
            ? 'To‘liq mock imtihon'
            : 'Bo‘lim bo‘yicha mock (mini)',
        durationMinutes: isFullMockWeek ? 180 : 45,
        mockExamId: mock?.id,
      });
    } else {
      for (let i = 0; i < lessonsPerDay; i++) {
        const lesson = input.lessons[lessonCursor];
        if (lesson) {
          lessonCursor++;
          tasks.push({
            date,
            order: order++,
            kind: PlanTaskKind.LESSON,
            titleUz: lesson.titleUz,
            durationMinutes: lesson.estimatedMinutes,
            lessonId: lesson.id,
          });
        } else {
          tasks.push({
            date,
            order: order++,
            kind: PlanTaskKind.EXERCISE_SET,
            titleUz: 'Amaliyot: zaif ko‘nikmalar bo‘yicha mashqlar',
            durationMinutes: 30,
          });
          break;
        }
      }
    }

    tasks.push({
      date,
      order: order++,
      kind: PlanTaskKind.VOCAB_REVIEW,
      titleUz: 'So‘zlarni takrorlash (flashcards)',
      durationMinutes: 15,
      vocabCount: 20,
    });
  }

  // Level phases (informational): split horizon evenly across ladder levels
  const fromIdx = levelIndex(input.startLevel);
  const toIdx = Math.max(fromIdx, levelIndex(input.targetLevel));
  const ladder = CEFR_ORDER.slice(fromIdx, toIdx + 1);
  const perPhase = Math.floor(horizonDays / ladder.length);
  const phases = ladder.map((level, i) => ({
    level,
    fromDay: i * perPhase,
    toDay: i === ladder.length - 1 ? horizonDays : (i + 1) * perPhase,
  }));

  return { tasks, meta: { horizonDays, phases, lessonsPerDay } };
}

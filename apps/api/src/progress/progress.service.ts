import { Injectable, NotFoundException } from '@nestjs/common';
import { ProgressStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Day boundary in the user's timezone (platform default: Asia/Tashkent, UTC+5). */
export function tashkentToday(): Date {
  const now = new Date();
  const tashkent = new Date(now.getTime() + 5 * 3600 * 1000);
  return new Date(Date.UTC(tashkent.getUTCFullYear(), tashkent.getUTCMonth(), tashkent.getUTCDate()));
}

export interface ActivityDelta {
  xp?: number;
  minutes?: number;
  lessonsCompleted?: number;
  wordsReviewed?: number;
}

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async addActivity(userId: string, delta: ActivityDelta) {
    const date = tashkentToday();
    await this.prisma.dailyActivity.upsert({
      where: { userId_date: { userId, date } },
      create: {
        userId,
        date,
        xp: delta.xp ?? 0,
        minutes: delta.minutes ?? 0,
        lessonsCompleted: delta.lessonsCompleted ?? 0,
        wordsReviewed: delta.wordsReviewed ?? 0,
      },
      update: {
        xp: { increment: delta.xp ?? 0 },
        minutes: { increment: delta.minutes ?? 0 },
        lessonsCompleted: { increment: delta.lessonsCompleted ?? 0 },
        wordsReviewed: { increment: delta.wordsReviewed ?? 0 },
      },
    });
  }

  async completeLesson(userId: string, lessonId: string, score?: number) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, isPublished: true },
    });
    if (!lesson) throw new NotFoundException('Dars topilmadi');

    const existing = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
    const alreadyCompleted = existing?.status === ProgressStatus.COMPLETED;

    const progress = await this.prisma.lessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        status: ProgressStatus.COMPLETED,
        score,
        completedAt: new Date(),
      },
      update: {
        status: ProgressStatus.COMPLETED,
        ...(score !== undefined ? { score } : {}),
        completedAt: existing?.completedAt ?? new Date(),
      },
    });

    if (!alreadyCompleted) {
      await this.addActivity(userId, {
        xp: 50,
        minutes: lesson.estimatedMinutes,
        lessonsCompleted: 1,
      });
    }
    return progress;
  }

  async streak(userId: string): Promise<number> {
    const activities = await this.prisma.dailyActivity.findMany({
      where: { userId, xp: { gt: 0 } },
      orderBy: { date: 'desc' },
      take: 400,
      select: { date: true },
    });
    if (activities.length === 0) return 0;

    const today = tashkentToday().getTime();
    const dayMs = 86_400_000;
    let streak = 0;
    let cursor = today;
    // Streak survives if today has no activity yet (counts from yesterday)
    if (activities[0].date.getTime() !== today) cursor = today - dayMs;

    for (const activity of activities) {
      if (activity.date.getTime() === cursor) {
        streak++;
        cursor -= dayMs;
      } else if (activity.date.getTime() < cursor) {
        break;
      }
    }
    return streak;
  }

  async dashboard(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        firstName: true,
        targetLevel: true,
        currentLevel: true,
        examDate: true,
        dailyGoalMinutes: true,
      },
    });

    const today = tashkentToday();
    const [todayActivity, totals, lessonsDone, streak, dueCards, lastAttempt] = await Promise.all([
      this.prisma.dailyActivity.findUnique({ where: { userId_date: { userId, date: today } } }),
      this.prisma.dailyActivity.aggregate({
        where: { userId },
        _sum: { xp: true, minutes: true, wordsReviewed: true, lessonsCompleted: true },
      }),
      this.prisma.lessonProgress.count({
        where: { userId, status: ProgressStatus.COMPLETED },
      }),
      this.streak(userId),
      this.prisma.userVocabCard.count({ where: { userId, dueAt: { lte: new Date() } } }),
      this.prisma.mockAttempt.findFirst({
        where: { userId, status: 'SCORED' },
        orderBy: { scoredAt: 'desc' },
        include: { exam: { select: { titleUz: true, slug: true, subject: true } } },
      }),
    ]);

    const daysToExam = user.examDate
      ? Math.max(0, Math.ceil((user.examDate.getTime() - Date.now()) / 86_400_000))
      : null;

    return {
      user,
      daysToExam,
      streak,
      today: {
        xp: todayActivity?.xp ?? 0,
        minutes: todayActivity?.minutes ?? 0,
        goalMinutes: user.dailyGoalMinutes,
        wordsReviewed: todayActivity?.wordsReviewed ?? 0,
      },
      totals: {
        xp: totals._sum.xp ?? 0,
        minutes: totals._sum.minutes ?? 0,
        wordsReviewed: totals._sum.wordsReviewed ?? 0,
        lessonsCompleted: lessonsDone,
      },
      vocabDue: dueCards,
      lastMockResult: lastAttempt
        ? {
            exam: lastAttempt.exam,
            overallScore: lastAttempt.overallScore,
            estimatedLevel: lastAttempt.estimatedLevel,
            scoredAt: lastAttempt.scoredAt,
          }
        : null,
    };
  }

  async heatmap(userId: string, days = 180) {
    const from = new Date(tashkentToday().getTime() - days * 86_400_000);
    return this.prisma.dailyActivity.findMany({
      where: { userId, date: { gte: from } },
      orderBy: { date: 'asc' },
      select: { date: true, xp: true, minutes: true },
    });
  }
}

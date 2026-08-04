import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CefrLevel,
  MockKind,
  PlanTaskStatus,
  Prisma,
  Subject,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressService, tashkentToday } from '../progress/progress.service';
import { compareLevels } from '../common/utils/cefr';
import { generatePlan } from './plan-generator';

@Injectable()
export class StudyPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progressService: ProgressService,
  ) {}

  async generate(
    userId: string,
    params: {
      subject: Subject;
      targetLevel: CefrLevel;
      examDate?: Date;
      dailyMinutes?: number;
    },
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const startLevel = user.currentLevel ?? CefrLevel.A2;
    if (compareLevels(startLevel, params.targetLevel) > 0) {
      throw new BadRequestException(
        'Maqsad daraja joriy darajadan past bo‘lishi mumkin emas',
      );
    }
    const dailyMinutes = params.dailyMinutes ?? user.dailyGoalMinutes ?? 60;

    // Course lessons on the ladder, ordered by course level → module → lesson
    const courses = await this.prisma.course.findMany({
      where: { subject: params.subject, isPublished: true },
      // Daraja ichida ham tartib muhim: bir xil darajada bir nechta kurs bor
      // (masalan C1: mahorat -> ko'prik -> writing namunalari -> speaking namunalari)
      orderBy: [{ level: 'asc' }, { order: 'asc' }],
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              where: { isPublished: true },
              orderBy: { order: 'asc' },
              select: { id: true, titleUz: true, level: true, estimatedMinutes: true },
            },
          },
        },
      },
    });
    const lessons = courses
      .filter(
        (c) =>
          compareLevels(c.level, startLevel) >= 0 &&
          compareLevels(c.level, params.targetLevel) <= 0,
      )
      .flatMap((c) => c.modules.flatMap((m) => m.lessons));

    const [fullMocks, miniMocks] = await Promise.all([
      this.prisma.mockExam.findMany({
        where: { subject: params.subject, isPublished: true, kind: MockKind.FULL },
        orderBy: { order: 'asc' },
        select: { id: true, titleUz: true, kind: true },
      }),
      this.prisma.mockExam.findMany({
        where: {
          subject: params.subject,
          isPublished: true,
          kind: { in: [MockKind.MINI, MockKind.SECTION] },
        },
        orderBy: { order: 'asc' },
        select: { id: true, titleUz: true, kind: true },
      }),
    ]);

    const generated = generatePlan({
      subject: params.subject,
      startLevel,
      targetLevel: params.targetLevel,
      startDate: tashkentToday(),
      examDate: params.examDate ?? user.examDate ?? null,
      dailyMinutes,
      lessons,
      fullMocks,
      miniMocks,
    });

    // Deactivate previous plans for this subject, create the new one
    await this.prisma.studyPlan.updateMany({
      where: { userId, subject: params.subject, isActive: true },
      data: { isActive: false },
    });

    const plan = await this.prisma.studyPlan.create({
      data: {
        userId,
        subject: params.subject,
        startLevel,
        targetLevel: params.targetLevel,
        examDate: params.examDate ?? user.examDate,
        dailyMinutes,
        metaJson: generated.meta as unknown as Prisma.InputJsonValue,
        tasks: {
          createMany: {
            data: generated.tasks.map((t) => ({
              date: t.date,
              order: t.order,
              kind: t.kind,
              titleUz: t.titleUz,
              durationMinutes: t.durationMinutes,
              lessonId: t.lessonId,
              mockExamId: t.mockExamId,
              vocabCount: t.vocabCount,
            })),
          },
        },
      },
    });

    // Also persist target on the profile
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        targetLevel: params.targetLevel,
        ...(params.examDate ? { examDate: params.examDate } : {}),
      },
    });

    return this.getActive(userId, params.subject);
  }

  async getActive(userId: string, subject?: Subject) {
    const plan = await this.prisma.studyPlan.findFirst({
      where: { userId, isActive: true, ...(subject ? { subject } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    if (!plan) return null;

    const today = tashkentToday();
    const weekEnd = new Date(today.getTime() + 7 * 86_400_000);
    const [todayTasks, weekTasks, stats] = await Promise.all([
      this.prisma.planTask.findMany({
        where: { planId: plan.id, date: today },
        orderBy: { order: 'asc' },
        include: {
          lesson: { select: { id: true, slug: true, titleUz: true, moduleId: true } },
          mockExam: { select: { id: true, slug: true, titleUz: true, kind: true } },
        },
      }),
      this.prisma.planTask.findMany({
        where: { planId: plan.id, date: { gt: today, lte: weekEnd } },
        orderBy: [{ date: 'asc' }, { order: 'asc' }],
        include: {
          lesson: { select: { id: true, slug: true, titleUz: true } },
          mockExam: { select: { id: true, slug: true, titleUz: true, kind: true } },
        },
      }),
      this.prisma.planTask.groupBy({
        by: ['status'],
        where: { planId: plan.id, date: { lt: today } },
        _count: { _all: true },
      }),
    ]);

    const done = stats.find((s) => s.status === PlanTaskStatus.DONE)?._count._all ?? 0;
    const missed = stats.find((s) => s.status === PlanTaskStatus.PENDING)?._count._all ?? 0;

    return { plan, todayTasks, weekTasks, pastStats: { done, missed } };
  }

  async completeTask(userId: string, taskId: string) {
    const task = await this.prisma.planTask.findUnique({
      where: { id: taskId },
      include: { plan: true },
    });
    if (!task) throw new NotFoundException('Vazifa topilmadi');
    if (task.plan.userId !== userId) throw new ForbiddenException();

    const updated = await this.prisma.planTask.update({
      where: { id: taskId },
      data: { status: PlanTaskStatus.DONE, completedAt: new Date() },
    });
    await this.progressService.addActivity(userId, {
      xp: 10,
      minutes: task.durationMinutes,
    });
    return updated;
  }

  async tasksRange(userId: string, from: Date, to: Date) {
    const plan = await this.prisma.studyPlan.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!plan) return [];
    return this.prisma.planTask.findMany({
      where: { planId: plan.id, date: { gte: from, lte: to } },
      orderBy: [{ date: 'asc' }, { order: 'asc' }],
      include: {
        lesson: { select: { id: true, slug: true, titleUz: true } },
        mockExam: { select: { id: true, slug: true, titleUz: true, kind: true } },
      },
    });
  }
}

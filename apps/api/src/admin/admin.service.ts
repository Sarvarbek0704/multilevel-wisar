import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EvalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { importCourse, importMock, importVocab } from '../content/importer';
import { courseFileSchema, mockFileSchema, vocabFileSchema } from '../content/schemas';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async importCourse(body: unknown) {
    const parsed = courseFileSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.slice(0, 10));
    }
    return importCourse(this.prisma, parsed.data);
  }

  async importMock(body: unknown, force = false) {
    const parsed = mockFileSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.slice(0, 10));
    }
    try {
      return await importMock(this.prisma, parsed.data, { force });
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }
  }

  async importVocab(body: unknown) {
    const parsed = vocabFileSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues.slice(0, 10));
    }
    return importVocab(this.prisma, parsed.data);
  }

  async setPublished(type: 'course' | 'mock', slug: string, isPublished: boolean) {
    if (type === 'course') {
      const course = await this.prisma.course.findUnique({ where: { slug } });
      if (!course) throw new NotFoundException('Kurs topilmadi');
      return this.prisma.course.update({ where: { slug }, data: { isPublished } });
    }
    const mock = await this.prisma.mockExam.findUnique({ where: { slug } });
    if (!mock) throw new NotFoundException('Mock topilmadi');
    return this.prisma.mockExam.update({ where: { slug }, data: { isPublished } });
  }

  async stats() {
    const [users, courses, lessons, exercises, words, mocks, attempts, evaluations, failedEvals] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.course.count(),
        this.prisma.lesson.count(),
        this.prisma.exercise.count(),
        this.prisma.vocabWord.count(),
        this.prisma.mockExam.count(),
        this.prisma.mockAttempt.count(),
        this.prisma.aiEvaluation.count(),
        this.prisma.aiEvaluation.count({ where: { status: EvalStatus.FAILED } }),
      ]);
    return { users, courses, lessons, exercises, words, mocks, attempts, evaluations, failedEvals };
  }

  async listUsers(page: number, limit: number) {
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          telegramId: true,
          currentLevel: true,
          targetLevel: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count(),
    ]);
    return { items, total, page, limit };
  }

  async retryEvaluation(evaluationId: string) {
    const evaluation = await this.prisma.aiEvaluation.findUnique({ where: { id: evaluationId } });
    if (!evaluation) throw new NotFoundException('Baholash topilmadi');
    return this.prisma.aiEvaluation.update({
      where: { id: evaluationId },
      data: { status: EvalStatus.PENDING, retryCount: 0, errorMessage: null },
    });
  }
}

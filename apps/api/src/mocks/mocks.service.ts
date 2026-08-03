import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttemptStatus, MockKind, Prisma, Subject } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ScoringService } from './scoring.service';

@Injectable()
export class MocksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scoringService: ScoringService,
  ) {}

  async listExams(subject?: Subject, kind?: MockKind) {
    return this.prisma.mockExam.findMany({
      where: {
        isPublished: true,
        ...(subject ? { subject } : {}),
        ...(kind ? { kind } : {}),
      },
      orderBy: [{ subject: 'asc' }, { kind: 'asc' }, { order: 'asc' }],
      include: {
        sections: {
          orderBy: { order: 'asc' },
          select: { id: true, skill: true, durationMinutes: true },
        },
      },
    });
  }

  /** Exam structure without questions — overview page. */
  async getExam(slug: string) {
    const exam = await this.prisma.mockExam.findFirst({
      where: { slug, isPublished: true },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            parts: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                order: true,
                titleUz: true,
                titleEn: true,
                _count: { select: { questions: true } },
              },
            },
          },
        },
      },
    });
    if (!exam) throw new NotFoundException('Imtihon topilmadi');
    return exam;
  }

  async startAttempt(userId: string, examSlug: string) {
    const exam = await this.prisma.mockExam.findFirst({
      where: { slug: examSlug, isPublished: true },
    });
    if (!exam) throw new NotFoundException('Imtihon topilmadi');

    const existing = await this.prisma.mockAttempt.findFirst({
      where: { userId, examId: exam.id, status: AttemptStatus.IN_PROGRESS },
    });
    if (existing) return this.getAttemptForTaking(userId, existing.id);

    const attempt = await this.prisma.mockAttempt.create({
      data: { userId, examId: exam.id },
    });
    return this.getAttemptForTaking(userId, attempt.id);
  }

  /** Attempt + full exam content, with correct answers stripped. */
  async getAttemptForTaking(userId: string, attemptId: string) {
    const attempt = await this.prisma.mockAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            sections: {
              orderBy: { order: 'asc' },
              include: {
                parts: {
                  orderBy: { order: 'asc' },
                  include: {
                    questions: {
                      orderBy: { order: 'asc' },
                      select: {
                        id: true,
                        order: true,
                        number: true,
                        type: true,
                        promptEn: true,
                        promptUz: true,
                        dataJson: true,
                        points: true,
                        // answerJson & rubricJson intentionally omitted
                      },
                    },
                  },
                },
              },
            },
          },
        },
        answers: {
          select: { questionId: true, answerJson: true, audioUrl: true },
        },
      },
    });
    if (!attempt) throw new NotFoundException('Urinish topilmadi');
    if (attempt.userId !== userId) throw new ForbiddenException();
    return attempt;
  }

  async saveAnswer(
    userId: string,
    attemptId: string,
    questionId: string,
    payload: { answer?: Record<string, unknown>; audioUrl?: string },
  ) {
    const attempt = await this.prisma.mockAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new NotFoundException('Urinish topilmadi');
    if (attempt.userId !== userId) throw new ForbiddenException();
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Bu urinish allaqachon yakunlangan');
    }

    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { part: { include: { section: true } } },
    });
    if (!question || question.part.section.examId !== attempt.examId) {
      throw new NotFoundException('Savol topilmadi');
    }

    await this.prisma.attemptAnswer.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      create: {
        attemptId,
        questionId,
        answerJson: (payload.answer ?? undefined) as Prisma.InputJsonValue | undefined,
        audioUrl: payload.audioUrl,
      },
      update: {
        ...(payload.answer !== undefined
          ? { answerJson: payload.answer as Prisma.InputJsonValue }
          : {}),
        ...(payload.audioUrl !== undefined ? { audioUrl: payload.audioUrl } : {}),
      },
    });
    return { saved: true };
  }

  async submitAttempt(userId: string, attemptId: string) {
    const attempt = await this.prisma.mockAttempt.findUnique({ where: { id: attemptId } });
    if (!attempt) throw new NotFoundException('Urinish topilmadi');
    if (attempt.userId !== userId) throw new ForbiddenException();
    if (attempt.status !== AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Bu urinish allaqachon topshirilgan');
    }

    await this.prisma.mockAttempt.update({
      where: { id: attemptId },
      data: { status: AttemptStatus.SUBMITTED, submittedAt: new Date() },
    });
    return this.scoringService.scoreAttempt(attemptId);
  }

  /** Result view: scores + correct answers + AI feedback (only after submission). */
  async getResult(userId: string, attemptId: string) {
    const attempt = await this.prisma.mockAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exam: { select: { slug: true, titleUz: true, subject: true, kind: true } },
        answers: {
          include: {
            question: {
              select: {
                id: true,
                number: true,
                type: true,
                promptEn: true,
                promptUz: true,
                dataJson: true,
                answerJson: true,
                points: true,
                part: {
                  select: {
                    titleUz: true,
                    titleEn: true,
                    section: { select: { skill: true } },
                  },
                },
              },
            },
          },
        },
        evaluations: {
          select: {
            id: true,
            questionId: true,
            skill: true,
            status: true,
            transcript: true,
            resultJson: true,
          },
        },
      },
    });
    if (!attempt) throw new NotFoundException('Urinish topilmadi');
    if (attempt.userId !== userId) throw new ForbiddenException();
    if (attempt.status === AttemptStatus.IN_PROGRESS) {
      throw new BadRequestException('Urinish hali topshirilmagan');
    }
    return attempt;
  }

  async myAttempts(userId: string) {
    return this.prisma.mockAttempt.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: {
        exam: { select: { slug: true, titleUz: true, subject: true, kind: true } },
      },
    });
  }
}

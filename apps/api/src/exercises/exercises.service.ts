import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CefrLevel, ExerciseType, Prisma, Skill, Subject } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressService } from '../progress/progress.service';
import { checkAnswer } from './answer-checker';

@Injectable()
export class ExercisesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progressService: ProgressService,
  ) {}

  /** Random practice set filtered by subject/skill/level (optionally by type). */
  async practiceSet(params: {
    subject: Subject;
    skill?: Skill;
    level?: CefrLevel;
    count: number;
    types?: ExerciseType[];
  }) {
    const where: Prisma.ExerciseWhereInput = {
      isPublished: true,
      subject: params.subject,
      ...(params.skill ? { skill: params.skill } : {}),
      ...(params.level ? { level: params.level } : {}),
      type: params.types?.length
        ? { in: params.types }
        : { notIn: [ExerciseType.WRITING_TASK, ExerciseType.SPEAKING_TASK] },
    };
    const total = await this.prisma.exercise.count({ where });
    if (total === 0) return [];
    const take = Math.min(params.count, total, 50);
    const skip = Math.max(0, Math.floor(Math.random() * Math.max(1, total - take)));
    const exercises = await this.prisma.exercise.findMany({
      where,
      skip,
      take,
      select: {
        id: true,
        type: true,
        skill: true,
        level: true,
        promptUz: true,
        promptEn: true,
        dataJson: true,
        points: true,
      },
    });
    return exercises;
  }

  /** Single exercise without the answer key (used by the Telegram quiz flow). */
  async getExercise(exerciseId: string) {
    return this.prisma.exercise.findFirst({
      where: { id: exerciseId, isPublished: true },
      select: {
        id: true,
        type: true,
        skill: true,
        level: true,
        promptUz: true,
        promptEn: true,
        dataJson: true,
        points: true,
      },
    });
  }

  async submitAnswer(userId: string, exerciseId: string, answer: Record<string, unknown>) {
    const exercise = await this.prisma.exercise.findFirst({
      where: { id: exerciseId, isPublished: true },
    });
    if (!exercise) throw new NotFoundException('Mashq topilmadi');

    const result = checkAnswer(exercise.type, exercise.answerJson, answer);
    if (result === null) {
      throw new BadRequestException(
        'Bu mashq avtomatik tekshirilmaydi — writing/speaking uchun AI baholash endpointidan foydalaning',
      );
    }

    await this.prisma.exerciseAttempt.create({
      data: {
        userId,
        exerciseId,
        answerJson: answer as Prisma.InputJsonValue,
        isCorrect: result.isCorrect,
        score: result.ratio * exercise.points,
      },
    });

    // XP: full points ×10, partial proportionally
    await this.progressService.addActivity(userId, {
      xp: Math.round(result.ratio * exercise.points * 10),
    });

    return {
      isCorrect: result.isCorrect,
      ratio: result.ratio,
      detail: result.detail ?? null,
      correctAnswer: exercise.answerJson,
      explanationUz: exercise.explanationUz,
    };
  }
}

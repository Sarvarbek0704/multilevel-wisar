import { Injectable, Logger } from '@nestjs/common';
import {
  AttemptStatus,
  EvalStatus,
  ExerciseType,
  MockKind,
  Prisma,
  Skill,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { checkAnswer } from '../exercises/answer-checker';
import { estimateLevel, placementEstimate, scaleTo75 } from '../common/utils/cefr';

const AI_SKILLS: Skill[] = [Skill.WRITING, Skill.SPEAKING];
const AI_TYPES: ExerciseType[] = [ExerciseType.WRITING_TASK, ExerciseType.SPEAKING_TASK];

interface SectionScore {
  skill: Skill;
  raw: number;
  max: number;
  scaled: number | null; // null while AI evaluation pending
  pendingAi: boolean;
}

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Score a submitted attempt: auto-check closed questions immediately,
   * enqueue AI evaluations for writing/speaking, finalize if nothing pending.
   */
  async scoreAttempt(attemptId: string) {
    const attempt = await this.prisma.mockAttempt.findUniqueOrThrow({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            sections: {
              orderBy: { order: 'asc' },
              include: {
                parts: { include: { questions: true }, orderBy: { order: 'asc' } },
              },
            },
          },
        },
        answers: true,
      },
    });

    const answersByQuestion = new Map(attempt.answers.map((a) => [a.questionId, a]));
    let aiEnqueued = 0;

    for (const section of attempt.exam.sections) {
      for (const part of section.parts) {
        for (const question of part.questions) {
          const answer = answersByQuestion.get(question.id);

          if (AI_TYPES.includes(question.type)) {
            const inputText =
              answer?.answerJson && typeof answer.answerJson === 'object'
                ? String((answer.answerJson as Record<string, unknown>).text ?? '')
                : '';
            const hasContent = inputText.trim().length > 0 || !!answer?.audioUrl;
            if (!hasContent) {
              // Unanswered open task → zero
              if (answer) {
                await this.prisma.attemptAnswer.update({
                  where: { id: answer.id },
                  data: { score: 0, isCorrect: false },
                });
              }
              continue;
            }
            await this.prisma.aiEvaluation.create({
              data: {
                userId: attempt.userId,
                attemptId: attempt.id,
                questionId: question.id,
                skill: section.skill,
                subject: attempt.exam.subject,
                inputText: inputText || null,
                inputAudioUrl: answer?.audioUrl ?? null,
              },
            });
            aiEnqueued++;
            continue;
          }

          // Auto-checkable
          const result = answer?.answerJson
            ? checkAnswer(question.type, question.answerJson, answer.answerJson)
            : null;
          const score = result ? result.ratio * question.points : 0;
          if (answer) {
            await this.prisma.attemptAnswer.update({
              where: { id: answer.id },
              data: { score, isCorrect: result?.isCorrect ?? false },
            });
          }
        }
      }
    }

    await this.prisma.mockAttempt.update({
      where: { id: attemptId },
      data: { status: aiEnqueued > 0 ? AttemptStatus.SCORING : AttemptStatus.SUBMITTED },
    });

    return this.tryFinalizeAttempt(attemptId);
  }

  /**
   * Aggregate section scores when no AI evaluations remain pending.
   * Safe to call repeatedly — no-ops while evaluations are still running.
   */
  async tryFinalizeAttempt(attemptId: string) {
    const pending = await this.prisma.aiEvaluation.count({
      where: {
        attemptId,
        status: { in: [EvalStatus.PENDING, EvalStatus.PROCESSING] },
      },
    });
    if (pending > 0) {
      return this.prisma.mockAttempt.findUnique({ where: { id: attemptId } });
    }

    const attempt = await this.prisma.mockAttempt.findUniqueOrThrow({
      where: { id: attemptId },
      include: {
        exam: {
          include: {
            sections: {
              orderBy: { order: 'asc' },
              include: { parts: { include: { questions: true } } },
            },
          },
        },
        answers: true,
        evaluations: true,
      },
    });
    if (attempt.status === AttemptStatus.SCORED) return attempt;

    const answersByQuestion = new Map(attempt.answers.map((a) => [a.questionId, a]));
    const evalsByQuestion = new Map(
      attempt.evaluations
        .filter((e) => e.questionId)
        .map((e) => [e.questionId as string, e]),
    );

    const sectionScores: SectionScore[] = [];
    for (const section of attempt.exam.sections) {
      const isAiSection = AI_SKILLS.includes(section.skill);
      let raw = 0;
      let max = 0;
      let aiWeighted = 0;
      let aiWeight = 0;

      for (const part of section.parts) {
        for (const question of part.questions) {
          if (AI_TYPES.includes(question.type)) {
            const evaluation = evalsByQuestion.get(question.id);
            const result = evaluation?.resultJson as { overallScore?: number } | null;
            const taskScore =
              evaluation?.status === EvalStatus.COMPLETED && result
                ? Number(result.overallScore) || 0
                : 0;
            aiWeighted += taskScore * question.points;
            aiWeight += question.points;
          } else {
            max += question.points;
            raw += answersByQuestion.get(question.id)?.score ?? 0;
          }
        }
      }

      let scaled: number;
      if (isAiSection && aiWeight > 0) {
        // AI tasks already return 0–75; combine with any auto part proportionally
        const aiScaled = aiWeighted / aiWeight;
        scaled = max > 0 ? (aiScaled + scaleTo75(raw, max)) / 2 : aiScaled;
      } else {
        scaled = scaleTo75(raw, max);
      }
      sectionScores.push({
        skill: section.skill,
        raw: Math.round(raw * 10) / 10,
        max,
        scaled: Math.round(scaled * 10) / 10,
        pendingAi: false,
      });
    }

    const overall =
      sectionScores.length > 0
        ? Math.round(
            (sectionScores.reduce((sum, s) => sum + (s.scaled ?? 0), 0) / sectionScores.length) * 10,
          ) / 10
        : 0;
    const level = estimateLevel(attempt.exam.subject, overall);

    const updated = await this.prisma.mockAttempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatus.SCORED,
        scoredAt: new Date(),
        overallScore: overall,
        estimatedLevel: level,
        sectionScoresJson: sectionScores as unknown as Prisma.InputJsonValue,
      },
    });

    // Placement exams update the user's current level estimate
    if (attempt.exam.kind === MockKind.PLACEMENT) {
      const totalMax = sectionScores.reduce((sum, s) => sum + s.max, 0);
      const totalRaw = sectionScores.reduce((sum, s) => sum + s.raw, 0);
      const percent = totalMax > 0 ? (totalRaw / totalMax) * 100 : 0;
      await this.prisma.user.update({
        where: { id: attempt.userId },
        data: { currentLevel: placementEstimate(percent) },
      });
    }

    this.logger.log(`Attempt ${attemptId} scored: ${overall} (${level ?? 'below B1'})`);
    return updated;
  }
}

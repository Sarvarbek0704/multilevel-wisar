import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Interval } from '@nestjs/schedule';
import { EvalStatus, Prisma, Skill, Subject } from '@prisma/client';
import { promises as fs } from 'fs';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { ScoringService } from '../mocks/scoring.service';
import { TelegramService } from '../telegram/telegram.service';
import {
  AI_PROVIDER,
  AiProvider,
  EvaluationResult,
} from './providers/ai-provider.interface';

const MAX_RETRIES = 3;
const BATCH_SIZE = 3;

const MIME_BY_EXT: Record<string, string> = {
  webm: 'audio/webm',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  wav: 'audio/wav',
  flac: 'audio/flac',
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private processing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly scoringService: ScoringService,
    private readonly telegramService: TelegramService,
    @Inject(AI_PROVIDER) private readonly provider: AiProvider,
  ) {}

  // ---------- Queue processor (mock exam W/S evaluations) ----------

  @Interval(15_000)
  async processQueue() {
    if (this.processing) return;
    this.processing = true;
    try {
      const pending = await this.prisma.aiEvaluation.findMany({
        where: { status: EvalStatus.PENDING, questionId: { not: null } },
        orderBy: { createdAt: 'asc' },
        take: BATCH_SIZE,
      });
      for (const evaluation of pending) {
        await this.processOne(evaluation.id);
      }
    } catch (error) {
      this.logger.error(`Queue tick failed: ${(error as Error).message}`);
    } finally {
      this.processing = false;
    }
  }

  private async processOne(evaluationId: string) {
    const evaluation = await this.prisma.aiEvaluation.update({
      where: { id: evaluationId },
      data: { status: EvalStatus.PROCESSING },
      include: { question: true },
    });

    try {
      const taskPrompt =
        evaluation.question?.promptEn ?? evaluation.question?.promptUz ?? 'Evaluate the answer.';
      const rubric = evaluation.question?.rubricJson ?? undefined;
      const user = await this.prisma.user.findUnique({ where: { id: evaluation.userId } });

      let result: EvaluationResult;
      if (evaluation.skill === Skill.SPEAKING && evaluation.inputAudioUrl) {
        const { base64, mimeType } = await this.readAudio(evaluation.inputAudioUrl);
        result = await this.provider.evaluateSpeaking({
          subject: evaluation.subject,
          taskPrompt,
          rubric,
          audioBase64: base64,
          mimeType,
          targetLevel: user?.targetLevel,
        });
      } else {
        result = await this.provider.evaluateWriting({
          subject: evaluation.subject,
          taskPrompt,
          rubric,
          text: evaluation.inputText ?? '',
          targetLevel: user?.targetLevel,
        });
      }

      await this.prisma.aiEvaluation.update({
        where: { id: evaluation.id },
        data: {
          status: EvalStatus.COMPLETED,
          provider: this.provider.name,
          model: this.provider.model,
          transcript: result.transcript,
          resultJson: result as unknown as Prisma.InputJsonValue,
          completedAt: new Date(),
        },
      });

      if (evaluation.attemptId) {
        const attempt = await this.scoringService.tryFinalizeAttempt(evaluation.attemptId);
        if (attempt?.status === 'SCORED') {
          await this.notifyScored(attempt.userId, attempt.id);
        }
      }
    } catch (error) {
      const message = (error as Error).message.slice(0, 900);
      const failed = evaluation.retryCount + 1 >= MAX_RETRIES;
      await this.prisma.aiEvaluation.update({
        where: { id: evaluation.id },
        data: {
          status: failed ? EvalStatus.FAILED : EvalStatus.PENDING,
          retryCount: { increment: 1 },
          errorMessage: message,
        },
      });
      this.logger.warn(`Evaluation ${evaluation.id} failed (retry=${!failed}): ${message}`);
      if (failed && evaluation.attemptId) {
        // Don't leave the attempt stuck — finalize with what we have
        await this.scoringService.tryFinalizeAttempt(evaluation.attemptId);
      }
    }
  }

  private async notifyScored(userId: string, attemptId: string) {
    const attempt = await this.prisma.mockAttempt.findUnique({
      where: { id: attemptId },
      include: { exam: { select: { titleUz: true } } },
    });
    if (!attempt) return;
    await this.telegramService.notifyUser(
      userId,
      `📊 Natijangiz tayyor!\n\n${attempt.exam.titleUz}\nUmumiy ball: ${attempt.overallScore}/75\nTaxminiy daraja: ${attempt.estimatedLevel ?? 'B1 dan past'}\n\nBatafsil tahlil saytda sizni kutmoqda.`,
    );
  }

  private async readAudio(audioUrl: string): Promise<{ base64: string; mimeType: string }> {
    const uploadDir = this.configService.get<string>('UPLOAD_DIR') ?? 'uploads';
    const relative = audioUrl.replace(/^\/?uploads\//, '');
    const filePath = join(process.cwd(), uploadDir, relative);
    const buffer = await fs.readFile(filePath);
    const ext = filePath.split('.').pop()?.toLowerCase() ?? 'webm';
    return {
      base64: buffer.toString('base64'),
      mimeType: MIME_BY_EXT[ext] ?? 'audio/webm',
    };
  }

  // ---------- Standalone practice evaluations (synchronous) ----------

  async practiceWriting(
    userId: string,
    params: { subject: Subject; taskPrompt: string; text: string },
  ) {
    if (params.text.trim().length < 20) {
      throw new BadRequestException('Matn juda qisqa — kamida 20 belgi yozing');
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const result = await this.provider.evaluateWriting({
      subject: params.subject,
      taskPrompt: params.taskPrompt,
      text: params.text,
      targetLevel: user?.targetLevel,
    });

    await this.prisma.aiEvaluation.create({
      data: {
        userId,
        skill: Skill.WRITING,
        subject: params.subject,
        status: EvalStatus.COMPLETED,
        inputText: params.text,
        provider: this.provider.name,
        model: this.provider.model,
        resultJson: { taskPrompt: params.taskPrompt, ...result } as unknown as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });
    return result;
  }

  async practiceSpeaking(
    userId: string,
    params: { subject: Subject; taskPrompt: string; audioUrl: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const { base64, mimeType } = await this.readAudio(params.audioUrl);
    const result = await this.provider.evaluateSpeaking({
      subject: params.subject,
      taskPrompt: params.taskPrompt,
      audioBase64: base64,
      mimeType,
      targetLevel: user?.targetLevel,
    });

    await this.prisma.aiEvaluation.create({
      data: {
        userId,
        skill: Skill.SPEAKING,
        subject: params.subject,
        status: EvalStatus.COMPLETED,
        inputAudioUrl: params.audioUrl,
        transcript: result.transcript,
        provider: this.provider.name,
        model: this.provider.model,
        resultJson: { taskPrompt: params.taskPrompt, ...result } as unknown as Prisma.InputJsonValue,
        completedAt: new Date(),
      },
    });
    return result;
  }

  async myEvaluations(userId: string, limit = 20) {
    return this.prisma.aiEvaluation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
      select: {
        id: true,
        skill: true,
        subject: true,
        status: true,
        createdAt: true,
        completedAt: true,
        resultJson: true,
      },
    });
  }

  async getEvaluation(userId: string, evaluationId: string) {
    const evaluation = await this.prisma.aiEvaluation.findUnique({
      where: { id: evaluationId },
    });
    if (!evaluation) throw new NotFoundException('Baholash topilmadi');
    if (evaluation.userId !== userId) throw new ForbiddenException();
    return evaluation;
  }
}

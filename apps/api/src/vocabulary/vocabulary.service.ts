import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CefrLevel, Prisma, Subject } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressService } from '../progress/progress.service';
import { applySm2 } from './srs';

@Injectable()
export class VocabularyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly progressService: ProgressService,
  ) {}

  async topics(subject: Subject, level?: CefrLevel) {
    const groups = await this.prisma.vocabWord.groupBy({
      by: ['topic', 'level'],
      where: { subject, ...(level ? { level } : {}) },
      _count: { _all: true },
    });
    return groups
      .filter((g) => g.topic)
      .map((g) => ({ topic: g.topic, level: g.level, count: g._count._all }));
  }

  async listWords(params: {
    subject: Subject;
    level?: CefrLevel;
    topic?: string;
    page: number;
    limit: number;
  }) {
    const where: Prisma.VocabWordWhereInput = {
      subject: params.subject,
      ...(params.level ? { level: params.level } : {}),
      ...(params.topic ? { topic: params.topic } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.vocabWord.findMany({
        where,
        orderBy: [{ level: 'asc' }, { topic: 'asc' }, { word: 'asc' }],
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.vocabWord.count({ where }),
    ]);
    return { items, total, page: params.page, limit: params.limit };
  }

  /** Add words to the user's SRS deck. */
  async startLearning(
    userId: string,
    params: { wordIds?: string[]; subject?: Subject; level?: CefrLevel; topic?: string; count?: number },
  ) {
    let wordIds = params.wordIds ?? [];
    if (wordIds.length === 0) {
      if (!params.subject) throw new BadRequestException('wordIds yoki subject kerak');
      const existing = await this.prisma.userVocabCard.findMany({
        where: { userId },
        select: { wordId: true },
      });
      const excludeIds = existing.map((c) => c.wordId);
      const words = await this.prisma.vocabWord.findMany({
        where: {
          subject: params.subject,
          ...(params.level ? { level: params.level } : {}),
          ...(params.topic ? { topic: params.topic } : {}),
          id: { notIn: excludeIds },
        },
        orderBy: [{ topic: 'asc' }, { word: 'asc' }],
        take: Math.min(params.count ?? 20, 100),
        select: { id: true },
      });
      wordIds = words.map((w) => w.id);
    }

    await this.prisma.userVocabCard.createMany({
      data: wordIds.map((wordId) => ({ userId, wordId })),
      skipDuplicates: true,
    });
    return { added: wordIds.length };
  }

  /** Cards due for review, oldest first. */
  async dueCards(userId: string, limit = 20) {
    return this.prisma.userVocabCard.findMany({
      where: { userId, dueAt: { lte: new Date() } },
      orderBy: { dueAt: 'asc' },
      take: Math.min(limit, 100),
      include: { word: true },
    });
  }

  /** Single card with its word — used by the Telegram flashcard flow. */
  async getCard(userId: string, cardId: string) {
    const card = await this.prisma.userVocabCard.findFirst({
      where: { id: cardId, userId },
      include: { word: true },
    });
    if (!card) throw new NotFoundException('Kartochka topilmadi');
    return card;
  }

  async review(userId: string, cardId: string, grade: number) {
    const card = await this.prisma.userVocabCard.findFirst({
      where: { id: cardId, userId },
    });
    if (!card) throw new NotFoundException('Kartochka topilmadi');

    const update = applySm2(card, grade);
    const updated = await this.prisma.userVocabCard.update({
      where: { id: card.id },
      data: {
        easeFactor: update.easeFactor,
        intervalDays: update.intervalDays,
        repetitions: update.repetitions,
        lapses: update.lapses,
        dueAt: update.dueAt,
        lastReviewedAt: new Date(),
      },
    });

    await this.progressService.addActivity(userId, { xp: grade >= 3 ? 5 : 2, wordsReviewed: 1 });
    return { nextDueAt: updated.dueAt, intervalDays: updated.intervalDays };
  }

  async stats(userId: string) {
    const now = new Date();
    const [total, due, learning, mature] = await Promise.all([
      this.prisma.userVocabCard.count({ where: { userId } }),
      this.prisma.userVocabCard.count({ where: { userId, dueAt: { lte: now } } }),
      this.prisma.userVocabCard.count({ where: { userId, repetitions: { lt: 3 } } }),
      this.prisma.userVocabCard.count({ where: { userId, intervalDays: { gte: 21 } } }),
    ]);
    return { total, due, learning, mature };
  }

  /** Daily words for the Telegram bot: due cards first, topped up with new words. */
  async dailyWords(userId: string, count = 5) {
    const due = await this.dueCards(userId, count);
    if (due.length >= count) return due.map((c) => c.word);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const existing = await this.prisma.userVocabCard.findMany({
      where: { userId },
      select: { wordId: true },
    });
    const fresh = await this.prisma.vocabWord.findMany({
      where: {
        subject: Subject.ENGLISH,
        ...(user?.currentLevel ? { level: user.currentLevel } : {}),
        id: { notIn: existing.map((c) => c.wordId) },
      },
      take: count - due.length,
    });
    return [...due.map((c) => c.word), ...fresh];
  }
}

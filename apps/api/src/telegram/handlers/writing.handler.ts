import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { ExerciseType, Subject } from '@prisma/client';
import { InlineKeyboard } from 'grammy';
import { AiService } from '../../ai/ai.service';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramUserService } from '../telegram-user.service';
import { AppBot, BotContext, TelegramHandler, WritingTopic } from '../telegram.types';
import { clamp, esc, formatEvaluation } from '../telegram.ui';

const HOURLY_LIMIT = 5;
const MIN_WORDS = 25;

const FALLBACK_TOPICS: WritingTopic[] = [
  {
    promptEn:
      'Some people believe technology makes our lives easier, while others think it creates new problems. Discuss both views and give your own opinion.',
    promptUz:
      'Ba’zilar texnologiya hayotni osonlashtiradi deb hisoblaydi, boshqalar esa u yangi muammolar keltirib chiqaradi deydi. Ikkala fikrni muhokama qiling va o‘z fikringizni bildiring.',
    minWords: 180,
  },
  {
    promptEn:
      'Write an email to your English-speaking friend telling them about a memorable trip you had. Say where you went, who you were with, and why it was special.',
    promptUz:
      'Ingliz tilida so‘zlashuvchi do‘stingizga esda qolarli sayohatingiz haqida email yozing: qayerga borgansiz, kim bilan va nima uchun u alohida esda qolgan.',
    minWords: 80,
  },
  {
    promptEn:
      'Many students in Uzbekistan study abroad after graduation. Do the advantages outweigh the disadvantages? Give reasons and examples.',
    promptUz:
      'O‘zbekistonda ko‘p talabalar bitirgach chet elda o‘qiydi. Afzalliklari kamchiliklaridan ustunmi? Sabab va misollar keltiring.',
    minWords: 180,
  },
];

@Injectable()
export class WritingHandler implements TelegramHandler {
  private readonly logger = new Logger(WritingHandler.name);

  constructor(
    private readonly userService: TelegramUserService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => AiService)) private readonly aiService: AiService,
  ) {}

  register(bot: AppBot): void {
    bot.command('writing', (ctx) => this.showTopics(ctx, false));
    bot.callbackQuery('wr:start', async (ctx) => {
      await ctx.answerCallbackQuery();
      await this.showTopics(ctx, true);
    });

    bot.callbackQuery(/^wr:topic:(\d+)$/, async (ctx) => {
      await ctx.answerCallbackQuery();
      const topics = ctx.session.writingTopics ?? FALLBACK_TOPICS;
      const topic = topics[Number(ctx.match[1])];
      if (!topic) {
        await this.showTopics(ctx, true);
        return;
      }

      ctx.session.mode = 'awaiting_writing';
      ctx.session.writingPrompt = topic.promptEn;
      ctx.session.writingMinWords = topic.minWords;

      await this.edit(
        ctx,
        `<b>✍️ Writing mashqi</b>\n\n` +
          `<b>Topshiriq:</b>\n${esc(topic.promptUz)}\n\n` +
          `<i>${esc(topic.promptEn)}</i>\n\n` +
          `📝 Endi javobingizni <b>ingliz tilida</b> shu chatga yozing (kamida ${topic.minWords} so‘z).\n` +
          `AI uni rasmiy imtihon mezonlari bo‘yicha baholab, o‘zbekcha tahlil beradi.`,
        new InlineKeyboard().text('❌ Bekor qilish', 'wr:cancel'),
      );
    });

    bot.callbackQuery('wr:cancel', async (ctx) => {
      await ctx.answerCallbackQuery({ text: 'Bekor qilindi' });
      this.clearSession(ctx);
      await this.edit(
        ctx,
        'Writing mashqi bekor qilindi.',
        new InlineKeyboard().text('⬅️ Asosiy menyu', 'menu:main'),
      );
    });

    // Free-text messages only matter while the user is writing an essay
    bot.on('message:text', async (ctx, next) => {
      if (ctx.session.mode !== 'awaiting_writing') return next();
      await this.evaluate(ctx, ctx.message.text);
    });
  }

  private async showTopics(ctx: BotContext, viaCallback: boolean) {
    const user = await this.userService.ensureUser(ctx);
    if (!user) return;

    const topics = await this.loadTopics();
    ctx.session.writingTopics = topics;

    const keyboard = new InlineKeyboard();
    for (const [index, topic] of topics.entries()) {
      keyboard.text(`${index + 1}. ${this.shorten(topic.promptUz)}`, `wr:topic:${index}`).row();
    }
    keyboard.text('⬅️ Asosiy menyu', 'menu:main');

    const text =
      `<b>✍️ Writing mashqi</b>\n\n` +
      `Mavzuni tanlang — javobingizni yozganingizdan so‘ng AI uni <b>4 ta rasmiy mezon</b> bo‘yicha baholaydi:\n` +
      `vazifani bajarish, izchillik, so‘z boyligi va grammatika.\n\n` +
      `Xatolaringiz tuzatilgan variant bilan ko‘rsatiladi. 👇`;

    if (viaCallback) await this.edit(ctx, text, keyboard);
    else await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
  }

  /** Pull real WRITING_TASK prompts from the curriculum, falling back to built-ins. */
  private async loadTopics(): Promise<WritingTopic[]> {
    const total = await this.prisma.exercise.count({
      where: { isPublished: true, type: ExerciseType.WRITING_TASK, subject: Subject.ENGLISH },
    });
    if (total === 0) return FALLBACK_TOPICS;

    const skip = Math.max(0, Math.floor(Math.random() * Math.max(1, total - 3)));
    const exercises = await this.prisma.exercise.findMany({
      where: { isPublished: true, type: ExerciseType.WRITING_TASK, subject: Subject.ENGLISH },
      skip,
      take: 3,
      select: { promptEn: true, promptUz: true, dataJson: true },
    });

    const topics = exercises
      .filter((exercise) => exercise.promptEn || exercise.promptUz)
      .map((exercise) => {
        const data = (exercise.dataJson ?? {}) as { minWords?: number };
        return {
          promptEn: exercise.promptEn ?? exercise.promptUz ?? '',
          promptUz: exercise.promptUz ?? exercise.promptEn ?? '',
          minWords: data.minWords ?? 100,
        };
      });

    return topics.length > 0 ? topics : FALLBACK_TOPICS;
  }

  private async evaluate(ctx: BotContext, text: string) {
    const user = await this.userService.ensureUser(ctx);
    if (!user) return;

    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < MIN_WORDS) {
      await ctx.reply(
        `⚠️ Javobingiz juda qisqa (<b>${wordCount}</b> so‘z). Kamida ${MIN_WORDS} so‘z yozing — ` +
          `imtihonda ham so‘z soni baholanadi.`,
        { parse_mode: 'HTML' },
      );
      return;
    }

    const recentCount = await this.prisma.aiEvaluation.count({
      where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 3600_000) } },
    });
    if (recentCount >= HOURLY_LIMIT) {
      this.clearSession(ctx);
      await ctx.reply(
        `⏳ Soatiga ${HOURLY_LIMIT} tagacha AI baholash mumkin. Biroz keyinroq urinib ko‘ring — ` +
          `bu vaqtda so‘z takrorlash yoki test yechishingiz mumkin.`,
        { reply_markup: new InlineKeyboard().text('📚 So‘z takrorlash', 'vocab:start').text('🎯 Test', 'quiz:new') },
      );
      return;
    }

    const prompt = ctx.session.writingPrompt ?? 'Write an essay on the given topic.';
    this.clearSession(ctx);

    const status = await ctx.reply(
      `⏳ <b>Baholanmoqda...</b> (${wordCount} so‘z)\n<i>Bu 10-30 soniya olishi mumkin.</i>`,
      { parse_mode: 'HTML' },
    );

    try {
      const result = await this.aiService.practiceWriting(user.id, {
        subject: Subject.ENGLISH,
        taskPrompt: prompt,
        text,
      });

      await ctx.api
        .deleteMessage(status.chat.id, status.message_id)
        .catch(() => undefined);

      await ctx.reply(formatEvaluation(result), {
        parse_mode: 'HTML',
        reply_markup: new InlineKeyboard()
          .text('✍️ Yana yozish', 'wr:start')
          .row()
          .text('⬅️ Asosiy menyu', 'menu:main'),
      });

      if (result.improvedVersion) {
        await ctx.reply(
          clamp(`<b>📄 Yaxshilangan variant:</b>\n\n<i>${esc(result.improvedVersion)}</i>`),
          { parse_mode: 'HTML' },
        );
      }
    } catch (error) {
      this.logger.warn(`Writing evaluation failed: ${(error as Error).message}`);
      await ctx.api.deleteMessage(status.chat.id, status.message_id).catch(() => undefined);
      await ctx.reply(
        '⚠️ Baholashda xatolik yuz berdi. Biroz keyinroq qayta urinib ko‘ring.',
        { reply_markup: new InlineKeyboard().text('🔄 Qayta urinish', 'wr:start') },
      );
    }
  }

  private clearSession(ctx: BotContext) {
    ctx.session.mode = undefined;
    ctx.session.writingPrompt = undefined;
    ctx.session.writingMinWords = undefined;
  }

  private shorten(text: string, max = 45): string {
    const oneLine = text.replace(/\s+/g, ' ').trim();
    return oneLine.length <= max ? oneLine : `${oneLine.slice(0, max - 1)}…`;
  }

  private async edit(ctx: BotContext, text: string, keyboard: InlineKeyboard) {
    try {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
    }
  }
}

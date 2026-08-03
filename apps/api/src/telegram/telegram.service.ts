import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { ExerciseType, PlanTaskStatus, Subject } from '@prisma/client';
import { randomBytes } from 'crypto';
import { Bot, Context } from 'grammy';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressService, tashkentToday } from '../progress/progress.service';
import { StudyPlanService } from '../study-plan/study-plan.service';
import { VocabularyService } from '../vocabulary/vocabulary.service';

const TASHKENT_OFFSET_H = 5;

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Bot | null = null;
  private botUsername: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly progressService: ProgressService,
    private readonly studyPlanService: StudyPlanService,
    private readonly vocabularyService: VocabularyService,
  ) {}

  get enabled(): boolean {
    return !!this.bot;
  }

  async onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN yo‘q — bot o‘chirilgan');
      return;
    }
    this.bot = new Bot(token);
    this.registerHandlers(this.bot);
    await this.bot.init();
    this.botUsername = this.bot.botInfo.username;

    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    if (isProd) {
      const appUrl = this.configService.get<string>('APP_URL');
      const secret = this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET');
      await this.bot.api.setWebhook(`${appUrl}/api/telegram/webhook/${secret}`, {
        drop_pending_updates: true,
      });
      this.logger.log(`Webhook o‘rnatildi: @${this.botUsername}`);
    } else {
      await this.bot.api.deleteWebhook({ drop_pending_updates: true });
      // Long polling in dev — intentionally not awaited
      void this.bot.start({ drop_pending_updates: true });
      this.logger.log(`Polling boshlandi: @${this.botUsername}`);
    }
  }

  async onModuleDestroy() {
    await this.bot?.stop().catch(() => undefined);
  }

  async handleWebhookUpdate(update: unknown) {
    if (!this.bot) return;
    await this.bot.handleUpdate(update as Parameters<Bot['handleUpdate']>[0]);
  }

  // ---------- Account linking ----------

  async createLinkToken(userId: string) {
    if (!this.botUsername) {
      return { linkUrl: null, note: 'Bot hali sozlanmagan' };
    }
    const token = randomBytes(16).toString('hex');
    await this.prisma.telegramLinkToken.create({
      data: {
        userId,
        token,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });
    return { linkUrl: `https://t.me/${this.botUsername}?start=${token}` };
  }

  /** Send a message to a linked user; silently no-ops when impossible. */
  async notifyUser(userId: string, text: string) {
    if (!this.bot) return;
    const profile = await this.prisma.telegramProfile.findUnique({ where: { userId } });
    if (!profile) return;
    try {
      await this.bot.api.sendMessage(profile.chatId.toString(), text);
    } catch (error) {
      this.logger.warn(`notifyUser(${userId}) failed: ${(error as Error).message}`);
    }
  }

  // ---------- Bot commands ----------

  private registerHandlers(bot: Bot) {
    bot.command('start', async (ctx) => {
      const payload = ctx.match?.trim();
      if (payload) {
        await this.linkByToken(ctx, payload);
        return;
      }
      const user = await this.findUser(ctx);
      if (user) {
        await this.ensureProfile(ctx, user.id);
        await ctx.reply(
          `Assalomu alaykum, ${user.firstName}! 👋\n\nMultilevel botiga xush kelibsiz.\n\nBuyruqlar:\n/today — bugungi reja\n/words — kunlik so‘zlar\n/quiz — tezkor test\n/streak — natijalarim\n/reminders_off — eslatmalarni o‘chirish`,
        );
      } else {
        await ctx.reply(
          `Assalomu alaykum! 👋\n\nMen multilevel.wisar.uz botiman — CEFR imtihoniga BEPUL tayyorlanish platformasi.\n\nBoshlash uchun saytda Telegram orqali ro‘yxatdan o‘ting yoki profil sozlamalarida botni ulang:\n${this.configService.get<string>('WEB_URL')}`,
        );
      }
    });

    bot.command('today', async (ctx) => {
      const user = await this.findUser(ctx);
      if (!user) return this.askToRegister(ctx);
      const active = await this.studyPlanService.getActive(user.id);
      if (!active || active.todayTasks.length === 0) {
        await ctx.reply(
          'Bugunga reja topilmadi. Saytda "O‘quv reja" bo‘limidan shaxsiy reja tuzing 📅',
        );
        return;
      }
      const lines = active.todayTasks.map((t) => {
        const mark = t.status === PlanTaskStatus.DONE ? '✅' : '▫️';
        return `${mark} ${t.titleUz} (${t.durationMinutes} daq)`;
      });
      await ctx.reply(`📅 Bugungi reja:\n\n${lines.join('\n')}\n\nOmad! 💪`);
    });

    bot.command('words', async (ctx) => {
      const user = await this.findUser(ctx);
      if (!user) return this.askToRegister(ctx);
      const words = await this.vocabularyService.dailyWords(user.id, 5);
      if (words.length === 0) {
        await ctx.reply('Hozircha so‘zlar yo‘q. Saytda lug‘at bo‘limidan so‘z to‘plamini tanlang.');
        return;
      }
      const lines = words.map(
        (w, i) =>
          `${i + 1}. *${w.word}*${w.phonetic ? ` ${w.phonetic}` : ''} — ${w.translation}${w.exampleEn ? `\n   _${w.exampleEn}_` : ''}`,
      );
      await ctx.reply(`📚 Bugungi so‘zlar:\n\n${lines.join('\n\n')}`, { parse_mode: 'Markdown' });
    });

    bot.command('quiz', async (ctx) => {
      const user = await this.findUser(ctx);
      if (!user) return this.askToRegister(ctx);
      await this.sendQuiz(ctx);
    });

    bot.command('streak', async (ctx) => {
      const user = await this.findUser(ctx);
      if (!user) return this.askToRegister(ctx);
      const dashboard = await this.progressService.dashboard(user.id);
      await ctx.reply(
        `🔥 Streak: ${dashboard.streak} kun\n⭐ Bugungi XP: ${dashboard.today.xp}\n⏱ Bugun: ${dashboard.today.minutes}/${dashboard.today.goalMinutes} daqiqa\n📚 Takrorlash kutmoqda: ${dashboard.vocabDue} ta so‘z`,
      );
    });

    bot.command('reminders_on', (ctx) => this.toggleReminders(ctx, true));
    bot.command('reminders_off', (ctx) => this.toggleReminders(ctx, false));
  }

  private async linkByToken(ctx: Context, token: string) {
    const linkToken = await this.prisma.telegramLinkToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!linkToken || linkToken.usedAt || linkToken.expiresAt < new Date()) {
      await ctx.reply('Ulanish havolasi eskirgan. Saytdan yangi havola oling.');
      return;
    }
    const telegramId = BigInt(ctx.from!.id);
    await this.prisma.$transaction([
      this.prisma.telegramLinkToken.update({
        where: { id: linkToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: linkToken.userId },
        data: { telegramId },
      }),
      this.prisma.telegramProfile.upsert({
        where: { userId: linkToken.userId },
        create: {
          userId: linkToken.userId,
          telegramId,
          chatId: BigInt(ctx.chat!.id),
          username: ctx.from?.username,
        },
        update: {
          telegramId,
          chatId: BigInt(ctx.chat!.id),
          username: ctx.from?.username,
        },
      }),
    ]);
    await ctx.reply(
      `✅ Akkaunt muvaffaqiyatli ulandi, ${linkToken.user.firstName}!\n\nEndi eslatmalar, kunlik so‘zlar va natijalar shu yerga keladi.\n\n/today — bugungi reja\n/words — kunlik so‘zlar\n/quiz — tezkor test`,
    );
  }

  private async findUser(ctx: Context) {
    if (!ctx.from) return null;
    return this.prisma.user.findUnique({ where: { telegramId: BigInt(ctx.from.id) } });
  }

  private async ensureProfile(ctx: Context, userId: string) {
    if (!ctx.from || !ctx.chat) return;
    await this.prisma.telegramProfile.upsert({
      where: { userId },
      create: {
        userId,
        telegramId: BigInt(ctx.from.id),
        chatId: BigInt(ctx.chat.id),
        username: ctx.from.username,
      },
      update: { chatId: BigInt(ctx.chat.id), username: ctx.from.username },
    });
  }

  private async askToRegister(ctx: Context) {
    await ctx.reply(
      `Avval saytda ro‘yxatdan o‘tib, botni ulang:\n${this.configService.get<string>('WEB_URL')}`,
    );
  }

  private async toggleReminders(ctx: Context, enabled: boolean) {
    const user = await this.findUser(ctx);
    if (!user) return this.askToRegister(ctx);
    await this.prisma.telegramProfile.updateMany({
      where: { userId: user.id },
      data: { remindersEnabled: enabled },
    });
    await ctx.reply(enabled ? '🔔 Eslatmalar yoqildi' : '🔕 Eslatmalar o‘chirildi');
  }

  private async sendQuiz(ctx: Context) {
    const count = await this.prisma.exercise.count({
      where: { isPublished: true, type: ExerciseType.MCQ_SINGLE, subject: Subject.ENGLISH },
    });
    if (count === 0) {
      await ctx.reply('Hozircha testlar yo‘q.');
      return;
    }
    const skip = Math.floor(Math.random() * count);
    const [exercise] = await this.prisma.exercise.findMany({
      where: { isPublished: true, type: ExerciseType.MCQ_SINGLE, subject: Subject.ENGLISH },
      skip,
      take: 1,
    });
    const data = exercise.dataJson as { text?: string; options?: string[] };
    const answer = exercise.answerJson as { value?: string };
    const options = (data.options ?? []).slice(0, 10);
    const correctIndex = options.findIndex(
      (o) => o.trim().toLowerCase() === String(answer.value ?? '').trim().toLowerCase(),
    );
    if (options.length < 2 || correctIndex < 0) {
      await ctx.reply('Test topilmadi, qaytadan urinib ko‘ring: /quiz');
      return;
    }
    const question = (exercise.promptEn ?? exercise.promptUz ?? '') + (data.text ? `\n\n${data.text}` : '');
    await ctx.api.sendPoll(ctx.chat!.id, question.slice(0, 300), options.map((o) => ({ text: o.slice(0, 100) })), {
      type: 'quiz',
      correct_option_ids: [correctIndex],
      is_anonymous: true,
      explanation: exercise.explanationUz?.slice(0, 200),
    });
  }

  // ---------- Scheduled broadcasts ----------

  /** Hourly: study reminders at each user's chosen hour (Tashkent time), only if idle today. */
  @Cron('0 * * * *')
  async sendReminders() {
    if (!this.bot) return;
    const tashkentHour = (new Date().getUTCHours() + TASHKENT_OFFSET_H) % 24;
    const hourString = `${String(tashkentHour).padStart(2, '0')}:00`;
    const profiles = await this.prisma.telegramProfile.findMany({
      where: { remindersEnabled: true, reminderTime: hourString },
    });
    if (profiles.length === 0) return;

    const today = tashkentToday();
    for (const profile of profiles) {
      const activity = await this.prisma.dailyActivity.findUnique({
        where: { userId_date: { userId: profile.userId, date: today } },
      });
      if (activity && activity.xp > 0) continue; // already studied today
      const streak = await this.progressService.streak(profile.userId);
      await this.bot.api
        .sendMessage(
          profile.chatId.toString(),
          streak > 0
            ? `🔥 ${streak} kunlik streak xavf ostida!\n\nBugun hali mashq qilmadingiz. 15 daqiqa ham katta natija beradi 💪\n/today — bugungi reja`
            : `📖 Bugun mashq qilish vaqti keldi!\n\n/today — bugungi reja\n/words — kunlik so‘zlar`,
        )
        .catch(() => undefined);
    }
  }

  /** Daily words broadcast at 08:00 Tashkent (03:00 UTC). */
  @Cron('0 3 * * *')
  async sendDailyWords() {
    if (!this.bot) return;
    const profiles = await this.prisma.telegramProfile.findMany({
      where: { dailyWordsEnabled: true },
    });
    for (const profile of profiles) {
      const words = await this.vocabularyService.dailyWords(profile.userId, 5);
      if (words.length === 0) continue;
      const lines = words.map(
        (w, i) =>
          `${i + 1}. *${w.word}*${w.phonetic ? ` ${w.phonetic}` : ''} — ${w.translation}`,
      );
      await this.bot.api
        .sendMessage(profile.chatId.toString(), `🌅 Bugungi so‘zlar:\n\n${lines.join('\n')}`, {
          parse_mode: 'Markdown',
        })
        .catch(() => undefined);
    }
  }
}

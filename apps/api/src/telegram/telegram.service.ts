import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { randomBytes } from 'crypto';
import { Bot, InlineKeyboard, session } from 'grammy';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressService, tashkentToday } from '../progress/progress.service';
import { VocabularyService } from '../vocabulary/vocabulary.service';
import { ContactHandler } from './handlers/contact.handler';
import { MenuHandler } from './handlers/menu.handler';
import { PlanHandler } from './handlers/plan.handler';
import { QuizHandler } from './handlers/quiz.handler';
import { SettingsHandler } from './handlers/settings.handler';
import { VocabularyHandler } from './handlers/vocabulary.handler';
import { WritingHandler } from './handlers/writing.handler';
import { AppBot, SessionData } from './telegram.types';
import { esc, mainMenu } from './telegram.ui';

const TASHKENT_OFFSET_H = 5;

const BOT_COMMANDS = [
  { command: 'menu', description: '🏠 Asosiy menyu' },
  { command: 'today', description: '📅 Bugungi o‘quv reja' },
  { command: 'words', description: '📚 So‘zlarni takrorlash' },
  { command: 'quiz', description: '🎯 Tezkor test' },
  { command: 'writing', description: '✍️ Writing mashqi (AI baholaydi)' },
  { command: 'phone', description: '📱 Telefon raqamni ulash' },
  { command: 'stats', description: '📊 Statistikam va streak' },
  { command: 'settings', description: '⚙️ Sozlamalar' },
  { command: 'help', description: 'ℹ️ Yordam' },
];

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: AppBot | null = null;
  private botUsername: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly progressService: ProgressService,
    private readonly vocabularyService: VocabularyService,
    private readonly menuHandler: MenuHandler,
    private readonly contactHandler: ContactHandler,
    private readonly planHandler: PlanHandler,
    private readonly vocabularyHandler: VocabularyHandler,
    private readonly quizHandler: QuizHandler,
    // WritingHandler depends on AiService, which notifies through this service —
    // forwardRef keeps that cycle resolvable.
    @Inject(forwardRef(() => WritingHandler))
    private readonly writingHandler: WritingHandler,
    private readonly settingsHandler: SettingsHandler,
  ) {}

  get enabled(): boolean {
    return !!this.bot;
  }

  private get webUrl(): string {
    return this.configService.get<string>('WEB_URL') ?? 'https://multilevel.wisar.uz';
  }

  async onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN yo‘q — bot o‘chirilgan');
      return;
    }

    const bot = new Bot<import('./telegram.types').BotContext>(token);
    this.bot = bot;

    bot.use(session({ initial: (): SessionData => ({}) }));

    // Feature handlers — order matters: commands and callbacks first,
    // free-text (writing flow) next, unknown-input fallback last.
    this.menuHandler.register(bot);
    this.contactHandler.register(bot);
    this.planHandler.register(bot);
    this.vocabularyHandler.register(bot);
    this.quizHandler.register(bot);
    this.settingsHandler.register(bot);
    this.writingHandler.register(bot);
    this.registerFallback(bot);

    bot.catch((error) => {
      this.logger.error(`Bot xatosi: ${error.message}`, error.stack);
    });

    await bot.init();
    this.botUsername = bot.botInfo.username;
    await bot.api.setMyCommands(BOT_COMMANDS).catch((error) => {
      this.logger.warn(`setMyCommands: ${(error as Error).message}`);
    });

    const isProd = this.configService.get<string>('NODE_ENV') === 'production';
    if (isProd) {
      const appUrl = this.configService.get<string>('APP_URL');
      const secret = this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET');
      await bot.api.setWebhook(`${appUrl}/api/telegram/webhook/${secret}`, {
        drop_pending_updates: true,
      });
      this.logger.log(`Webhook o‘rnatildi: @${this.botUsername}`);
    } else {
      await bot.api.deleteWebhook({ drop_pending_updates: true });
      // Polling rad etilsa (masalan bir token bilan ikkinchi nusxa ishga tushsa,
      // Telegram 409 qaytaradi) — bu API'ni yiqitmasligi kerak: bot o'chadi,
      // qolgan xizmatlar ishlashda davom etadi.
      void bot.start({ drop_pending_updates: true }).catch((error: Error) => {
        this.bot = null;
        this.logger.error(
          `Polling to'xtadi: ${error.message}. Bot o'chirildi, API ishlashda davom etadi.`,
        );
      });
      this.logger.log(`Polling boshlandi: @${this.botUsername}`);
    }
  }

  async onModuleDestroy() {
    await this.bot?.stop().catch(() => undefined);
  }

  /**
   * grammY only routes errors to `bot.catch` for long polling — in webhook mode
   * they propagate to the caller. Swallow them here so Telegram always gets a
   * 200 and stops re-delivering the same update.
   */
  async handleWebhookUpdate(update: unknown) {
    if (!this.bot) return;
    try {
      await this.bot.handleUpdate(update as Parameters<AppBot['handleUpdate']>[0]);
    } catch (error) {
      this.logger.error(`Webhook update failed: ${(error as Error).message}`);
    }
  }

  private registerFallback(bot: AppBot) {
    bot.on('message', async (ctx) => {
      await ctx.reply(
        'Buyruqni tushunmadim 🤔\n\nQuyidagi menyudan tanlang yoki /help yozing.',
        { reply_markup: mainMenu(this.webUrl) },
      );
    });
  }

  // ---------- Account linking (called from the API) ----------

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

  /**
   * Send a message to a linked user.
   * @returns true when Telegram accepted the message (false if the bot is off,
   * the user isn't linked, or the chat is unreachable — e.g. the bot is blocked).
   */
  async notifyUser(userId: string, text: string, keyboard?: InlineKeyboard): Promise<boolean> {
    if (!this.bot) return false;
    const profile = await this.prisma.telegramProfile.findUnique({ where: { userId } });
    if (!profile) return false;
    try {
      await this.bot.api.sendMessage(profile.chatId.toString(), text, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      });
      return true;
    } catch (error) {
      this.logger.warn(`notifyUser(${userId}) failed: ${(error as Error).message}`);
      return false;
    }
  }

  // ---------- Scheduled broadcasts ----------

  /** Hourly: study reminders at each user's chosen hour (Tashkent), only if idle today. */
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
    let sent = 0;
    for (const profile of profiles) {
      const activity = await this.prisma.dailyActivity.findUnique({
        where: { userId_date: { userId: profile.userId, date: today } },
      });
      if (activity && activity.xp > 0) continue; // already studied today

      const streak = await this.progressService.streak(profile.userId);
      const text =
        streak > 0
          ? `🔥 <b>${streak} kunlik streak xavf ostida!</b>\n\nBugun hali mashq qilmadingiz. 5 daqiqalik so‘z takrorlash ham streakni saqlaydi 💪`
          : `📖 <b>Mashq vaqti keldi!</b>\n\nHar kuni ozgina — imtihon kuni katta natija. Nimadan boshlaymiz?`;

      await this.bot.api
        .sendMessage(profile.chatId.toString(), text, {
          parse_mode: 'HTML',
          reply_markup: new InlineKeyboard()
            .text('📚 So‘z takrorlash', 'vocab:start')
            .text('🎯 Tezkor test', 'quiz:new')
            .row()
            .text('📅 Bugungi reja', 'menu:today'),
        })
        .then(() => sent++)
        .catch(() => undefined);
    }
    if (sent > 0) this.logger.log(`Eslatma yuborildi: ${sent} ta (${hourString})`);
  }

  /** Daily words broadcast at 08:00 Tashkent (03:00 UTC). */
  @Cron('0 3 * * *')
  async sendDailyWords() {
    if (!this.bot) return;
    const profiles = await this.prisma.telegramProfile.findMany({
      where: { dailyWordsEnabled: true },
    });
    let sent = 0;

    for (const profile of profiles) {
      const words = await this.vocabularyService.dailyWords(profile.userId, 5);
      if (words.length === 0) continue;

      const lines = words.map((word, index) => {
        const example = word.exampleEn ? `\n   <i>${esc(word.exampleEn)}</i>` : '';
        return `${index + 1}. <b>${esc(word.word)}</b>${word.phonetic ? ` <code>${esc(word.phonetic)}</code>` : ''} — ${esc(word.translation)}${example}`;
      });

      await this.bot.api
        .sendMessage(
          profile.chatId.toString(),
          `🌅 <b>Bugungi so‘zlar</b>\n\n${lines.join('\n\n')}`,
          {
            parse_mode: 'HTML',
            reply_markup: new InlineKeyboard()
              .text('📚 Takrorlashni boshlash', 'vocab:start')
              .row()
              .text('🎯 Tezkor test', 'quiz:new'),
          },
        )
        .then(() => sent++)
        .catch(() => undefined);
    }
    if (sent > 0) this.logger.log(`Kunlik so‘zlar yuborildi: ${sent} ta`);
  }
}

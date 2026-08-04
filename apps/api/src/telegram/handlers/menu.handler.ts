import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProgressService } from '../../progress/progress.service';
import { TelegramUserService } from '../telegram-user.service';
import { AppBot, BotContext, TelegramHandler } from '../telegram.types';
import { backToMenu, esc, levelBadge, mainMenu, progressBar } from '../telegram.ui';

const WELCOME = (name: string) =>
  `Assalomu alaykum, <b>${esc(name)}</b>! 👋\n\n` +
  `Men <b>multilevel.wisar.uz</b> botiman — CEFR (multilevel) imtihoniga <b>bepul</b> tayyorlanish yordamchingiz.\n\n` +
  `Shu yerning o‘zida:\n` +
  `📚 so‘zlarni takrorlash (ilmiy takrorlash algoritmi bilan)\n` +
  `🎯 tezkor testlar yechish\n` +
  `✍️ Writing yozib, AI dan batafsil tahlil olish\n` +
  `📅 kunlik rejangizni kuzatish\n\n` +
  `Quyidagi menyudan boshlang 👇`;

const HELP =
  `<b>🤖 Bot imkoniyatlari</b>\n\n` +
  `/menu — asosiy menyu\n` +
  `/today — bugungi o‘quv reja\n` +
  `/words — so‘zlarni takrorlash (flashcard)\n` +
  `/quiz — tezkor test savoli\n` +
  `/writing — Writing mashqi, AI baholaydi\n` +
  `/stats — statistikam va streak\n` +
  `/settings — eslatmalar va sozlamalar\n` +
  `/help — shu yordam\n\n` +
  `<b>Eslatmalar:</b> har kuni mashq qilmasangiz, bot sizni turtib qo‘yadi 🔥\n` +
  `<b>Natijalar:</b> saytda mock imtihon topshirsangiz, natija shu yerga ham keladi.`;

@Injectable()
export class MenuHandler implements TelegramHandler {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: TelegramUserService,
    private readonly progressService: ProgressService,
  ) {}

  private get webUrl(): string {
    return this.configService.get<string>('WEB_URL') ?? 'https://multilevel.wisar.uz';
  }

  register(bot: AppBot): void {
    bot.command('start', async (ctx) => {
      const payload = (ctx.match as string | undefined)?.trim();

      if (payload) {
        const result = await this.userService.linkByToken(ctx, payload);
        if (result.ok) {
          await ctx.reply(
            `✅ <b>Akkaunt ulandi, ${esc(result.firstName)}!</b>\n\n` +
              `Endi saytdagi progressingiz va bot bir xil hisobda. Natijalar va eslatmalar shu yerga keladi.`,
            { parse_mode: 'HTML', reply_markup: mainMenu(this.webUrl) },
          );
          return;
        }
        if (result.reason === 'taken') {
          await ctx.reply(
            `⚠️ Bu Telegram akkaunt allaqachon boshqa profilga bog‘langan.\n\n` +
              `Saytga <b>Telegram orqali</b> kiring — o‘sha profil ochiladi. Yoki /settings dan akkauntni ajratib, qaytadan urinib ko‘ring.`,
            { parse_mode: 'HTML' },
          );
          return;
        }
        await ctx.reply('⚠️ Ulanish havolasi eskirgan. Saytdan yangi havola oling.');
        return;
      }

      const user = await this.userService.ensureUser(ctx);
      if (!user) return;
      await ctx.reply(WELCOME(user.firstName), {
        parse_mode: 'HTML',
        reply_markup: mainMenu(this.webUrl),
      });
    });

    bot.command(['menu', 'help'], async (ctx) => {
      const user = await this.userService.ensureUser(ctx);
      if (!user) return;
      const isHelp = ctx.message?.text?.startsWith('/help');
      await ctx.reply(isHelp ? HELP : `<b>Asosiy menyu</b>\n\nNima qilamiz? 👇`, {
        parse_mode: 'HTML',
        reply_markup: mainMenu(this.webUrl),
      });
    });

    bot.callbackQuery('menu:main', async (ctx) => {
      await ctx.answerCallbackQuery();
      await this.safeEdit(ctx, `<b>Asosiy menyu</b>\n\nNima qilamiz? 👇`, mainMenu(this.webUrl));
    });

    bot.command('stats', async (ctx) => {
      const user = await this.userService.ensureUser(ctx);
      if (!user) return;
      await ctx.reply(await this.statsText(user.id), {
        parse_mode: 'HTML',
        reply_markup: backToMenu(),
      });
    });

    bot.callbackQuery('menu:stats', async (ctx) => {
      await ctx.answerCallbackQuery();
      const user = await this.userService.ensureUser(ctx);
      if (!user) return;
      await this.safeEdit(ctx, await this.statsText(user.id), backToMenu());
    });
  }

  private async statsText(userId: string): Promise<string> {
    const dashboard = await this.progressService.dashboard(userId);
    const lines = [
      '<b>📊 Statistikangiz</b>',
      '',
      `🔥 <b>Streak:</b> ${dashboard.streak} kun`,
      `⭐ <b>Umumiy XP:</b> ${dashboard.totals.xp}`,
      `⏱ <b>Bugun:</b> ${dashboard.today.minutes}/${dashboard.today.goalMinutes} daqiqa`,
      `   ${progressBar(dashboard.today.minutes, dashboard.today.goalMinutes)}`,
      `📘 <b>Tugallangan darslar:</b> ${dashboard.totals.lessonsCompleted}`,
      `📚 <b>Takrorlash kutmoqda:</b> ${dashboard.vocabDue} ta so‘z`,
    ];

    if (dashboard.daysToExam !== null) {
      lines.push('', `📆 <b>Imtihongacha:</b> ${dashboard.daysToExam} kun`);
    }
    if (dashboard.user.currentLevel || dashboard.user.targetLevel) {
      lines.push(
        `🎯 <b>Daraja:</b> ${dashboard.user.currentLevel ?? '—'} → maqsad ${dashboard.user.targetLevel ?? '—'}`,
      );
    }
    if (dashboard.lastMockResult) {
      lines.push(
        '',
        `<b>Oxirgi mock:</b> ${esc(dashboard.lastMockResult.exam.titleUz)}`,
        `Ball: <b>${dashboard.lastMockResult.overallScore}/75</b> — ${esc(levelBadge(dashboard.lastMockResult.estimatedLevel))}`,
      );
    }
    return lines.join('\n');
  }

  /** editMessageText throws when the content is unchanged — ignore that case. */
  private async safeEdit(ctx: BotContext, text: string, keyboard: ReturnType<typeof mainMenu>) {
    try {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
    }
  }
}

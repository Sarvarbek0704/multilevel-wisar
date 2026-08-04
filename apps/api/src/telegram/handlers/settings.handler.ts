import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InlineKeyboard } from 'grammy';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramUserService } from '../telegram-user.service';
import { AppBot, BotContext, TelegramHandler } from '../telegram.types';
import { esc } from '../telegram.ui';

const REMINDER_HOURS = ['08:00', '12:00', '16:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

@Injectable()
export class SettingsHandler implements TelegramHandler {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly userService: TelegramUserService,
  ) {}

  private get webUrl(): string {
    return this.configService.get<string>('WEB_URL') ?? 'https://multilevel.wisar.uz';
  }

  register(bot: AppBot): void {
    bot.command('settings', (ctx) => this.show(ctx, false));
    bot.callbackQuery('menu:settings', async (ctx) => {
      await ctx.answerCallbackQuery();
      await this.show(ctx, true);
    });

    bot.callbackQuery('set:toggle:reminders', async (ctx) => {
      const user = await this.userService.ensureUser(ctx);
      if (!user) return;
      const profile = await this.prisma.telegramProfile.findUnique({ where: { userId: user.id } });
      const next = !(profile?.remindersEnabled ?? true);
      await this.prisma.telegramProfile.updateMany({
        where: { userId: user.id },
        data: { remindersEnabled: next },
      });
      await ctx.answerCallbackQuery({ text: next ? '🔔 Eslatmalar yoqildi' : '🔕 Eslatmalar o‘chirildi' });
      await this.show(ctx, true);
    });

    bot.callbackQuery('set:toggle:words', async (ctx) => {
      const user = await this.userService.ensureUser(ctx);
      if (!user) return;
      const profile = await this.prisma.telegramProfile.findUnique({ where: { userId: user.id } });
      const next = !(profile?.dailyWordsEnabled ?? true);
      await this.prisma.telegramProfile.updateMany({
        where: { userId: user.id },
        data: { dailyWordsEnabled: next },
      });
      await ctx.answerCallbackQuery({
        text: next ? '📚 Kunlik so‘zlar yoqildi' : '📚 Kunlik so‘zlar o‘chirildi',
      });
      await this.show(ctx, true);
    });

    bot.callbackQuery('set:time', async (ctx) => {
      await ctx.answerCallbackQuery();
      const keyboard = new InlineKeyboard();
      for (const [index, hour] of REMINDER_HOURS.entries()) {
        keyboard.text(hour, `set:time:${hour}`);
        if (index % 4 === 3) keyboard.row();
      }
      keyboard.row().text('⬅️ Orqaga', 'menu:settings');
      await this.edit(
        ctx,
        '<b>⏰ Eslatma vaqti</b>\n\nHar kuni qaysi soatda turtki xabar kelsin? <i>(Toshkent vaqti)</i>',
        keyboard,
      );
    });

    bot.callbackQuery(/^set:time:(\d{2}:\d{2})$/, async (ctx) => {
      const user = await this.userService.ensureUser(ctx);
      if (!user) return;
      const time = ctx.match[1];
      await this.prisma.telegramProfile.updateMany({
        where: { userId: user.id },
        data: { reminderTime: time, remindersEnabled: true },
      });
      await ctx.answerCallbackQuery({ text: `⏰ ${time} ga sozlandi` });
      await this.show(ctx, true);
    });

    bot.callbackQuery('set:unlink', async (ctx) => {
      await ctx.answerCallbackQuery();
      await this.edit(
        ctx,
        '<b>🔓 Akkauntni ajratish</b>\n\n' +
          'Telegram hisobingiz platformadan ajratiladi: eslatmalar, kunlik so‘zlar va natijalar bu yerga kelmaydi.\n\n' +
          '⚠️ Agar hisobingizda email/parol bo‘lmasa, bot orqali to‘plangan progressga kira olmaysiz.\n\n' +
          'Davom etamizmi?',
        new InlineKeyboard()
          .text('✅ Ha, ajratish', 'set:unlink:confirm')
          .row()
          .text('⬅️ Yo‘q, orqaga', 'menu:settings'),
      );
    });

    bot.callbackQuery('set:unlink:confirm', async (ctx) => {
      const user = await this.userService.ensureUser(ctx);
      if (!user) return;
      await this.userService.unlink(user.id);
      ctx.session.userId = undefined;
      ctx.session.profileSynced = false;
      await ctx.answerCallbackQuery({ text: 'Ajratildi' });
      await this.edit(
        ctx,
        'Akkaunt ajratildi. Qaytadan boshlash uchun /start buyrug‘ini yuboring.',
        new InlineKeyboard().url('🌐 Saytga o‘tish', this.webUrl),
      );
    });
  }

  private async show(ctx: BotContext, viaCallback: boolean) {
    const user = await this.userService.ensureUser(ctx);
    if (!user) return;

    const profile = await this.prisma.telegramProfile.findUnique({ where: { userId: user.id } });
    const remindersOn = profile?.remindersEnabled ?? true;
    const wordsOn = profile?.dailyWordsEnabled ?? true;
    const time = profile?.reminderTime ?? '19:00';

    const text = [
      '<b>⚙️ Sozlamalar</b>',
      '',
      `👤 <b>Hisob:</b> ${esc(user.firstName)}${user.email ? ` (${esc(user.email)})` : ''}`,
      `📱 <b>Telefon:</b> ${user.phone ? `${esc(user.phone)} ✅` : 'ulanmagan'}`,
      `🎯 <b>Maqsad daraja:</b> ${user.targetLevel ?? '—'}`,
      '',
      `${remindersOn ? '🔔' : '🔕'} <b>Eslatmalar:</b> ${remindersOn ? 'yoqilgan' : 'o‘chirilgan'}`,
      `⏰ <b>Eslatma vaqti:</b> ${time} <i>(Toshkent)</i>`,
      `📚 <b>Kunlik so‘zlar:</b> ${wordsOn ? 'yoqilgan (08:00)' : 'o‘chirilgan'}`,
      '',
      '<i>Daraja, imtihon sanasi va kunlik maqsadni saytdagi profil bo‘limidan o‘zgartirasiz.</i>',
    ].join('\n');

    const keyboard = new InlineKeyboard()
      .text(user.phone ? '📱 Raqamni almashtirish' : '📱 Telefon raqamni ulash', 'contact:request')
      .row()
      .text(remindersOn ? '🔕 Eslatmalarni o‘chirish' : '🔔 Eslatmalarni yoqish', 'set:toggle:reminders')
      .row()
      .text('⏰ Eslatma vaqti', 'set:time')
      .row()
      .text(wordsOn ? '📚 Kunlik so‘zlarni o‘chirish' : '📚 Kunlik so‘zlarni yoqish', 'set:toggle:words')
      .row()
      .url('🌐 Profil sozlamalari', `${this.webUrl}/profile`)
      .row()
      .text('🔓 Akkauntni ajratish', 'set:unlink')
      .row()
      .text('⬅️ Asosiy menyu', 'menu:main');

    if (viaCallback) await this.edit(ctx, text, keyboard);
    else await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
  }

  private async edit(ctx: BotContext, text: string, keyboard: InlineKeyboard) {
    try {
      await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard });
    } catch {
      await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
    }
  }
}

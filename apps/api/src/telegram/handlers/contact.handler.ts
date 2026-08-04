import { Injectable, Logger } from '@nestjs/common';
import { InlineKeyboard, Keyboard } from 'grammy';
import { normalizePhone } from '../../common/utils/phone';
import { PrismaService } from '../../prisma/prisma.service';
import { TelegramUserService } from '../telegram-user.service';
import { AppBot, BotContext, TelegramHandler } from '../telegram.types';
import { CONTACT_PROMPT, contactRequestKeyboard, esc } from '../telegram.ui';

/**
 * Binds a Telegram-verified phone number to the account. The number becomes the
 * delivery address for phone OTP logins on the website.
 */
@Injectable()
export class ContactHandler implements TelegramHandler {
  private readonly logger = new Logger(ContactHandler.name);

  constructor(
    private readonly userService: TelegramUserService,
    private readonly prisma: PrismaService,
  ) {}

  register(bot: AppBot): void {
    bot.command('phone', (ctx) => this.askForContact(ctx));

    bot.callbackQuery('contact:request', async (ctx) => {
      await ctx.answerCallbackQuery();
      await this.askForContact(ctx);
    });

    bot.on('message:contact', async (ctx) => {
      const user = await this.userService.ensureUser(ctx);
      if (!user) return;

      const contact = ctx.message.contact;
      // Users can forward someone else's contact card — only accept their own
      if (contact.user_id !== ctx.from?.id) {
        await ctx.reply(
          '⚠️ Faqat <b>o‘zingizning</b> raqamingizni yuborishingiz mumkin. ' +
            'Iltimos, tugma orqali yuboring.',
          { parse_mode: 'HTML', reply_markup: contactRequestKeyboard() },
        );
        return;
      }

      const phone = normalizePhone(contact.phone_number);
      if (!phone) {
        await ctx.reply('⚠️ Raqamni o‘qib bo‘lmadi. Qayta urinib ko‘ring.', {
          reply_markup: { remove_keyboard: true },
        });
        return;
      }

      const [phoneOwner, profileOwner] = await Promise.all([
        this.prisma.user.findUnique({ where: { phone } }),
        this.prisma.telegramProfile.findUnique({ where: { phone } }),
      ]);

      if (
        (phoneOwner && phoneOwner.id !== user.id) ||
        (profileOwner && profileOwner.userId !== user.id)
      ) {
        await ctx.reply(
          '⚠️ Bu raqam boshqa hisobga biriktirilgan.\n\n' +
            'Agar bu sizning eski hisobingiz bo‘lsa, o‘sha hisobga telefon orqali kiring ' +
            'yoki /settings dan hisobni ajrating.',
          { reply_markup: { remove_keyboard: true } },
        );
        return;
      }

      await this.prisma.$transaction([
        this.prisma.telegramProfile.updateMany({
          where: { userId: user.id },
          data: { phone },
        }),
        this.prisma.user.update({
          where: { id: user.id },
          data: { phone, phoneVerifiedAt: new Date() },
        }),
      ]);
      this.logger.log(`Telefon ulandi: user=${user.id}`);

      await ctx.reply(
        `✅ <b>Raqam ulandi:</b> ${esc(phone)}\n\n` +
          'Endi saytga <b>telefon raqam + kod</b> orqali kira olasiz — tasdiqlash kodi shu chatga keladi.',
        {
          parse_mode: 'HTML',
          reply_markup: { remove_keyboard: true },
        },
      );
      await ctx.reply('Davom etamizmi? 👇', {
        reply_markup: new InlineKeyboard()
          .text('📚 So‘z takrorlash', 'vocab:start')
          .text('🎯 Tezkor test', 'quiz:new')
          .row()
          .text('🏠 Asosiy menyu', 'menu:main'),
      });
    });
  }

  private async askForContact(ctx: BotContext) {
    const user = await this.userService.ensureUser(ctx);
    if (!user) return;

    if (user.phone) {
      await ctx.reply(
        `📱 Sizda raqam allaqachon ulangan: <b>${esc(user.phone)}</b>\n\n` +
          'Boshqa raqamga almashtirmoqchi bo‘lsangiz, pastdagi tugmadan yangi raqamni yuboring.',
        { parse_mode: 'HTML', reply_markup: contactRequestKeyboard() },
      );
      return;
    }

    await ctx.reply(CONTACT_PROMPT, {
      parse_mode: 'HTML',
      reply_markup: contactRequestKeyboard() as Keyboard,
    });
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { BotContext } from './telegram.types';

/**
 * Resolves the platform user behind a Telegram update, creating an account on
 * first contact so the bot is useful without visiting the website first. The
 * same account is picked up by the website's Telegram login.
 */
@Injectable()
export class TelegramUserService {
  private readonly logger = new Logger(TelegramUserService.name);

  constructor(private readonly prisma: PrismaService) {}

  async ensureUser(ctx: BotContext): Promise<User | null> {
    if (!ctx.from || ctx.from.is_bot) return null;

    const telegramId = BigInt(ctx.from.id);
    let user = await this.prisma.user.findUnique({ where: { telegramId } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          telegramId,
          firstName: ctx.from.first_name,
          lastName: ctx.from.last_name,
        },
      });
      this.logger.log(`Bot orqali yangi foydalanuvchi: ${user.id} (tg ${ctx.from.id})`);
      ctx.session.profileSynced = false;
    }

    ctx.session.userId = user.id;

    // Keep the chat id fresh so scheduled broadcasts can reach the user.
    if (!ctx.session.profileSynced && ctx.chat) {
      await this.prisma.telegramProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          telegramId,
          chatId: BigInt(ctx.chat.id),
          username: ctx.from.username,
        },
        update: {
          telegramId,
          chatId: BigInt(ctx.chat.id),
          username: ctx.from.username,
        },
      });
      ctx.session.profileSynced = true;
    }

    return user;
  }

  /** Link a website account (identified by a one-time token) to this Telegram user. */
  async linkByToken(
    ctx: BotContext,
    token: string,
  ): Promise<{ ok: true; firstName: string } | { ok: false; reason: 'invalid' | 'taken' }> {
    const linkToken = await this.prisma.telegramLinkToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!linkToken || linkToken.usedAt || linkToken.expiresAt < new Date()) {
      return { ok: false, reason: 'invalid' };
    }

    const telegramId = BigInt(ctx.from!.id);
    const holder = await this.prisma.user.findUnique({ where: { telegramId } });
    if (holder && holder.id !== linkToken.userId) {
      return { ok: false, reason: 'taken' };
    }

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

    ctx.session.userId = linkToken.userId;
    ctx.session.profileSynced = true;
    return { ok: true, firstName: linkToken.user.firstName };
  }

  /** Detach Telegram from the current account (settings → unlink). */
  async unlink(userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.telegramProfile.deleteMany({ where: { userId } }),
      this.prisma.user.update({ where: { id: userId }, data: { telegramId: null } }),
    ]);
  }
}

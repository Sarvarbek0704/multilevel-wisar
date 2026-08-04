import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { OtpChannel, OtpCode, OtpPurpose } from '@prisma/client';
import { createHmac, randomInt } from 'crypto';
import { InlineKeyboard } from 'grammy';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';

const CODE_TTL_MS = 5 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_PER_HOUR = 5;
const MAX_ATTEMPTS = 5;

const PURPOSE_UZ: Record<OtpPurpose, string> = {
  LOGIN: 'Hisobga kirish',
  ATTACH_EMAIL: 'Emailni biriktirish',
  ATTACH_PHONE: 'Telefon raqamni biriktirish',
  PASSWORD_RESET: 'Parolni tiklash',
};

export interface OtpRequestResult {
  sent: true;
  channel: OtpChannel;
  expiresInSeconds: number;
  /** Present only in dev when no real delivery channel is configured */
  devCode?: string;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly telegramService: TelegramService,
  ) {}

  private get secret(): string {
    return (
      this.configService.get<string>('OTP_SECRET') ??
      this.configService.get<string>('JWT_ACCESS_SECRET') ??
      'otp-dev-secret'
    );
  }

  private hash(code: string, identifier: string): string {
    return createHmac('sha256', this.secret).update(`${identifier}:${code}`).digest('hex');
  }

  /** Telegram chat that owns this phone number, if any. */
  async findTelegramTargetByPhone(phone: string) {
    return this.prisma.telegramProfile.findUnique({
      where: { phone },
      select: { userId: true, chatId: true, telegramId: true },
    });
  }

  async issue(params: {
    channel: OtpChannel;
    purpose: OtpPurpose;
    identifier: string;
    userId?: string;
  }): Promise<OtpRequestResult> {
    const { channel, purpose, identifier, userId } = params;

    const [lastCode, hourCount] = await Promise.all([
      this.prisma.otpCode.findFirst({
        where: { identifier, purpose },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.otpCode.count({
        where: { identifier, purpose, createdAt: { gte: new Date(Date.now() - 3600_000) } },
      }),
    ]);

    if (lastCode && Date.now() - lastCode.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil(
        (RESEND_COOLDOWN_MS - (Date.now() - lastCode.createdAt.getTime())) / 1000,
      );
      throw new BadRequestException(`Yangi kod so‘rash uchun ${wait} soniya kuting`);
    }
    if (hourCount >= MAX_PER_HOUR) {
      throw new BadRequestException(
        'Juda ko‘p kod so‘raldi. Bir soatdan keyin qayta urinib ko‘ring.',
      );
    }

    // Invalidate previous unconsumed codes for this identifier/purpose
    await this.prisma.otpCode.updateMany({
      where: { identifier, purpose, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await this.prisma.otpCode.create({
      data: {
        channel,
        purpose,
        identifier,
        userId,
        codeHash: this.hash(code, identifier),
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    });

    const delivered = await this.deliver(channel, identifier, code, purpose);

    return {
      sent: true,
      channel,
      expiresInSeconds: CODE_TTL_MS / 1000,
      // Without a configured channel the code would be unreachable — expose it in dev only
      ...(delivered ? {} : { devCode: this.isProduction ? undefined : code }),
    };
  }

  private get isProduction(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  /** @returns true when the code left the server through a real channel */
  private async deliver(
    channel: OtpChannel,
    identifier: string,
    code: string,
    purpose: OtpPurpose,
  ): Promise<boolean> {
    if (channel === OtpChannel.EMAIL) {
      await this.mailService.sendOtp(identifier, code, PURPOSE_UZ[purpose]);
      return this.mailService.isConfigured;
    }

    const target = await this.findTelegramTargetByPhone(identifier);
    if (!target) return false;

    return this.telegramService.notifyUser(
      target.userId,
      `🔐 <b>Tasdiqlash kodi: <code>${code}</code></b>\n\n` +
        `Maqsad: ${PURPOSE_UZ[purpose]}\n` +
        `Kod 5 daqiqa amal qiladi.\n\n` +
        `<i>Agar bu so‘rovni siz yubormagan bo‘lsangiz, kodni hech kimga bermang.</i>`,
      new InlineKeyboard().text('🏠 Asosiy menyu', 'menu:main'),
    );
  }

  /**
   * Validate a code and consume it. Throws on wrong/expired codes and burns the
   * code after too many attempts.
   */
  async consume(params: {
    purpose: OtpPurpose;
    identifier: string;
    code: string;
  }): Promise<OtpCode> {
    const { purpose, identifier, code } = params;

    const record = await this.prisma.otpCode.findFirst({
      where: { identifier, purpose, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) {
      throw new UnauthorizedException('Kod topilmadi — yangi kod so‘rang');
    }
    if (record.expiresAt < new Date()) {
      await this.prisma.otpCode.update({
        where: { id: record.id },
        data: { consumedAt: new Date() },
      });
      throw new UnauthorizedException('Kod muddati tugagan — yangi kod so‘rang');
    }
    if (record.codeHash !== this.hash(code.trim(), identifier)) {
      const attempts = record.attempts + 1;
      await this.prisma.otpCode.update({
        where: { id: record.id },
        data: {
          attempts,
          ...(attempts >= MAX_ATTEMPTS ? { consumedAt: new Date() } : {}),
        },
      });
      throw new UnauthorizedException(
        attempts >= MAX_ATTEMPTS
          ? 'Kod bir necha marta noto‘g‘ri kiritildi — yangi kod so‘rang'
          : `Kod noto‘g‘ri. Qolgan urinishlar: ${MAX_ATTEMPTS - attempts}`,
      );
    }

    return this.prisma.otpCode.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    });
  }

  /** Housekeeping: drop codes that expired more than a day ago. */
  @Cron('0 4 * * *')
  async cleanupExpired() {
    const result = await this.prisma.otpCode.deleteMany({
      where: { expiresAt: { lt: new Date(Date.now() - 86_400_000) } },
    });
    if (result.count > 0) this.logger.log(`Eski OTP kodlar tozalandi: ${result.count}`);
  }
}

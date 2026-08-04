import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OtpChannel, OtpPurpose, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, createHmac } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { maskEmail, maskPhone, normalizePhone } from '../common/utils/phone';
import { OtpService } from './otp.service';
import { TokenService, TokenPair } from './token.service';
import {
  GoogleLoginDto,
  LoginDto,
  RegisterDto,
  TelegramLoginDto,
} from './dto/auth.dto';
import {
  AttachEmailRequestDto,
  AttachEmailVerifyDto,
  AttachPhoneRequestDto,
  AttachPhoneVerifyDto,
  ChangePasswordDto,
  EmailOtpRequestDto,
  EmailOtpVerifyDto,
  ForgotPasswordDto,
  PhoneOtpRequestDto,
  PhoneOtpVerifyDto,
  ResetPasswordDto,
} from './dto/otp.dto';

export type SafeUser = Omit<User, 'passwordHash'>;

export interface AuthResult {
  user: SafeUser;
  tokens: TokenPair;
}

function toSafeUser(user: User): SafeUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

export interface OtpSentResponse {
  sent: boolean;
  channel: OtpChannel;
  target: string;
  expiresInSeconds: number;
  devCode?: string;
}

/** Phone OTP needs the bot to know the number — returned when it doesn't yet. */
export interface BotContactRequiredResponse {
  sent: false;
  needsBotContact: true;
  botUrl: string | null;
  message: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
  ) {
    this.googleClient = new OAuth2Client(this.configService.get<string>('GOOGLE_CLIENT_ID'));
  }

  async register(dto: RegisterDto, userAgent?: string, ip?: string): Promise<AuthResult> {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('Bu email allaqachon ro‘yxatdan o‘tgan');

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash: await bcrypt.hash(dto.password, 10),
        firstName: dto.firstName.trim(),
        lastName: dto.lastName?.trim(),
      },
    });
    return { user: toSafeUser(user), tokens: await this.tokenService.issuePair(user, userAgent, ip) };
  }

  async login(dto: LoginDto, userAgent?: string, ip?: string): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });
    if (!user?.passwordHash || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Email yoki parol noto‘g‘ri');
    }
    return { user: toSafeUser(user), tokens: await this.tokenService.issuePair(user, userAgent, ip) };
  }

  async googleLogin(dto: GoogleLoginDto, userAgent?: string, ip?: string): Promise<AuthResult> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) throw new BadRequestException('Google login sozlanmagan');

    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.idToken,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Google token yaroqsiz');
    }
    if (!payload?.sub) throw new UnauthorizedException('Google token yaroqsiz');

    const email = payload.email?.toLowerCase();
    let user = await this.prisma.user.findUnique({ where: { googleId: payload.sub } });
    if (!user && email) {
      // Merge with an existing email account
      user = await this.prisma.user.findUnique({ where: { email } });
      if (user) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: payload.sub, avatarUrl: user.avatarUrl ?? payload.picture },
        });
      }
    }
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          googleId: payload.sub,
          email,
          firstName: payload.given_name ?? payload.name ?? 'Foydalanuvchi',
          lastName: payload.family_name,
          avatarUrl: payload.picture,
        },
      });
    }
    return { user: toSafeUser(user), tokens: await this.tokenService.issuePair(user, userAgent, ip) };
  }

  async telegramLogin(dto: TelegramLoginDto, userAgent?: string, ip?: string): Promise<AuthResult> {
    const botToken = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) throw new BadRequestException('Telegram login sozlanmagan');
    if (!this.verifyTelegramHash(dto, botToken)) {
      throw new UnauthorizedException('Telegram ma‘lumotlari yaroqsiz');
    }
    // Reject logins older than 1 day (replay protection)
    if (Date.now() / 1000 - dto.auth_date > 86400) {
      throw new UnauthorizedException('Telegram sessiyasi eskirgan, qayta urinib ko‘ring');
    }

    const telegramId = BigInt(dto.id);
    let user = await this.prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          telegramId,
          firstName: dto.first_name,
          lastName: dto.last_name,
          avatarUrl: dto.photo_url,
        },
      });
    }
    // Private chat id equals the user id — lets the bot message them right away
    await this.prisma.telegramProfile.upsert({
      where: { telegramId },
      create: {
        userId: user.id,
        telegramId,
        chatId: telegramId,
        username: dto.username,
      },
      update: { username: dto.username },
    });

    return { user: toSafeUser(user), tokens: await this.tokenService.issuePair(user, userAgent, ip) };
  }

  private verifyTelegramHash(dto: TelegramLoginDto, botToken: string): boolean {
    const { hash, ...fields } = dto as unknown as Record<string, unknown>;
    const dataCheckString = Object.keys(fields)
      .filter((key) => fields[key] !== undefined && fields[key] !== null)
      .sort()
      .map((key) => `${key}=${fields[key]}`)
      .join('\n');
    const secretKey = createHash('sha256').update(botToken).digest();
    const computed = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    return computed === hash;
  }

  async refresh(refreshToken: string, userAgent?: string, ip?: string): Promise<TokenPair> {
    const { pair } = await this.tokenService.rotate(refreshToken, userAgent, ip);
    return pair;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokenService.revoke(refreshToken);
  }

  async me(userId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return toSafeUser(user);
  }

  // ---------- Email OTP (passwordless login / signup) ----------

  async requestEmailOtp(dto: EmailOtpRequestDto): Promise<OtpSentResponse> {
    const email = dto.email.toLowerCase().trim();
    const result = await this.otpService.issue({
      channel: OtpChannel.EMAIL,
      purpose: OtpPurpose.LOGIN,
      identifier: email,
    });
    return {
      sent: true,
      channel: result.channel,
      target: maskEmail(email),
      expiresInSeconds: result.expiresInSeconds,
      devCode: result.devCode,
    };
  }

  async verifyEmailOtp(
    dto: EmailOtpVerifyDto,
    userAgent?: string,
    ip?: string,
  ): Promise<AuthResult> {
    const email = dto.email.toLowerCase().trim();
    await this.otpService.consume({
      purpose: OtpPurpose.LOGIN,
      identifier: email,
      code: dto.code,
    });

    let user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      if (!user.emailVerifiedAt) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { emailVerifiedAt: new Date() },
        });
      }
    } else {
      // Passwordless signup — the verified code proves ownership of the address
      user = await this.prisma.user.create({
        data: {
          email,
          emailVerifiedAt: new Date(),
          firstName: dto.firstName?.trim() || email.split('@')[0],
        },
      });
      this.logger.log(`Email OTP orqali yangi hisob: ${user.id}`);
    }

    return {
      user: toSafeUser(user),
      tokens: await this.tokenService.issuePair(user, userAgent, ip),
    };
  }

  // ---------- Phone OTP delivered through the Telegram bot ----------

  private get botUrl(): string | null {
    const username = this.configService.get<string>('TELEGRAM_BOT_USERNAME');
    return username ? `https://t.me/${username}` : null;
  }

  private requirePhone(raw: string): string {
    const phone = normalizePhone(raw);
    if (!phone) throw new BadRequestException('Telefon raqam formati noto‘g‘ri');
    return phone;
  }

  private botContactResponse(): BotContactRequiredResponse {
    return {
      sent: false,
      needsBotContact: true,
      botUrl: this.botUrl,
      message:
        'Bu raqam Telegram botga ulanmagan. Botni oching va «📱 Telefon raqamni ulash» tugmasi ' +
        'orqali raqamingizni yuboring — shundan so‘ng kod shu yerga keladi.',
    };
  }

  async requestPhoneOtp(
    dto: PhoneOtpRequestDto,
  ): Promise<OtpSentResponse | BotContactRequiredResponse> {
    const phone = this.requirePhone(dto.phone);
    const target = await this.otpService.findTelegramTargetByPhone(phone);
    if (!target) return this.botContactResponse();

    const result = await this.otpService.issue({
      channel: OtpChannel.TELEGRAM,
      purpose: OtpPurpose.LOGIN,
      identifier: phone,
      userId: target.userId,
    });
    return {
      sent: true,
      channel: result.channel,
      target: maskPhone(phone),
      expiresInSeconds: result.expiresInSeconds,
      devCode: result.devCode,
    };
  }

  async verifyPhoneOtp(
    dto: PhoneOtpVerifyDto,
    userAgent?: string,
    ip?: string,
  ): Promise<AuthResult> {
    const phone = this.requirePhone(dto.phone);
    await this.otpService.consume({
      purpose: OtpPurpose.LOGIN,
      identifier: phone,
      code: dto.code,
    });

    // The account is whoever owns the number: an explicit User.phone wins,
    // otherwise the Telegram profile that shared this contact.
    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      const profile = await this.prisma.telegramProfile.findUnique({
        where: { phone },
        include: { user: true },
      });
      if (!profile) throw new NotFoundException('Bu raqamga bog‘langan hisob topilmadi');
      user = profile.user;
    }

    user = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        phone,
        phoneVerifiedAt: new Date(),
        ...(dto.firstName && user.firstName === 'Foydalanuvchi'
          ? { firstName: dto.firstName.trim() }
          : {}),
      },
    });

    return {
      user: toSafeUser(user),
      tokens: await this.tokenService.issuePair(user, userAgent, ip),
    };
  }

  // ---------- Password recovery ----------

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ sent: boolean; message: string; devCode?: string }> {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({ where: { email } });

    let devCode: string | undefined;
    if (user) {
      const result = await this.otpService.issue({
        channel: OtpChannel.EMAIL,
        purpose: OtpPurpose.PASSWORD_RESET,
        identifier: email,
        userId: user.id,
      });
      devCode = result.devCode;
    }

    // Same response either way — never reveal whether the account exists
    return {
      sent: true,
      message: 'Agar bu email ro‘yxatdan o‘tgan bo‘lsa, tiklash kodi yuborildi.',
      devCode,
    };
  }

  async resetPassword(
    dto: ResetPasswordDto,
    userAgent?: string,
    ip?: string,
  ): Promise<AuthResult> {
    const email = dto.email.toLowerCase().trim();
    await this.otpService.consume({
      purpose: OtpPurpose.PASSWORD_RESET,
      identifier: email,
      code: dto.code,
    });

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('Hisob topilmadi');

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(dto.newPassword, 10),
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
      },
    });

    // A reset invalidates every existing session
    await this.tokenService.revokeAllForUser(user.id);

    return {
      user: toSafeUser(updated),
      tokens: await this.tokenService.issuePair(updated, userAgent, ip),
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ success: true }> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    if (user.passwordHash) {
      if (!dto.currentPassword) {
        throw new BadRequestException('Joriy parolni kiriting');
      }
      const matches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
      if (!matches) throw new UnauthorizedException('Joriy parol noto‘g‘ri');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(dto.newPassword, 10) },
    });
    await this.tokenService.revokeAllForUser(userId);
    return { success: true };
  }

  // ---------- Attaching contacts to an existing account ----------

  async requestAttachEmail(userId: string, dto: AttachEmailRequestDto): Promise<OtpSentResponse> {
    const email = dto.email.toLowerCase().trim();
    const owner = await this.prisma.user.findUnique({ where: { email } });
    if (owner && owner.id !== userId) {
      throw new ConflictException('Bu email boshqa hisobga biriktirilgan');
    }

    const result = await this.otpService.issue({
      channel: OtpChannel.EMAIL,
      purpose: OtpPurpose.ATTACH_EMAIL,
      identifier: email,
      userId,
    });
    return {
      sent: true,
      channel: result.channel,
      target: maskEmail(email),
      expiresInSeconds: result.expiresInSeconds,
      devCode: result.devCode,
    };
  }

  async verifyAttachEmail(userId: string, dto: AttachEmailVerifyDto): Promise<SafeUser> {
    const email = dto.email.toLowerCase().trim();
    const record = await this.otpService.consume({
      purpose: OtpPurpose.ATTACH_EMAIL,
      identifier: email,
      code: dto.code,
    });
    if (record.userId !== userId) {
      throw new UnauthorizedException('Kod boshqa hisob uchun so‘ralgan');
    }

    const owner = await this.prisma.user.findUnique({ where: { email } });
    if (owner && owner.id !== userId) {
      throw new ConflictException('Bu email boshqa hisobga biriktirilgan');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { email, emailVerifiedAt: new Date() },
    });
    return toSafeUser(user);
  }

  async requestAttachPhone(
    userId: string,
    dto: AttachPhoneRequestDto,
  ): Promise<OtpSentResponse | BotContactRequiredResponse> {
    const phone = this.requirePhone(dto.phone);

    const owner = await this.prisma.user.findUnique({ where: { phone } });
    if (owner && owner.id !== userId) {
      throw new ConflictException('Bu raqam boshqa hisobga biriktirilgan');
    }

    const target = await this.otpService.findTelegramTargetByPhone(phone);
    if (!target) return this.botContactResponse();
    if (target.userId !== userId) {
      throw new ConflictException(
        'Bu raqam bot orqali boshqa hisobga bog‘langan. O‘sha hisobga telefon yoki Telegram ' +
          'orqali kiring, yoki bot sozlamalaridan hisobni ajrating.',
      );
    }

    const result = await this.otpService.issue({
      channel: OtpChannel.TELEGRAM,
      purpose: OtpPurpose.ATTACH_PHONE,
      identifier: phone,
      userId,
    });
    return {
      sent: true,
      channel: result.channel,
      target: maskPhone(phone),
      expiresInSeconds: result.expiresInSeconds,
      devCode: result.devCode,
    };
  }

  async verifyAttachPhone(userId: string, dto: AttachPhoneVerifyDto): Promise<SafeUser> {
    const phone = this.requirePhone(dto.phone);
    const record = await this.otpService.consume({
      purpose: OtpPurpose.ATTACH_PHONE,
      identifier: phone,
      code: dto.code,
    });
    if (record.userId !== userId) {
      throw new UnauthorizedException('Kod boshqa hisob uchun so‘ralgan');
    }

    const owner = await this.prisma.user.findUnique({ where: { phone } });
    if (owner && owner.id !== userId) {
      throw new ConflictException('Bu raqam boshqa hisobga biriktirilgan');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { phone, phoneVerifiedAt: new Date() },
    });
    return toSafeUser(user);
  }
}

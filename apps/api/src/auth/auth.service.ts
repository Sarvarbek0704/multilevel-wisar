import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, createHmac } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService, TokenPair } from './token.service';
import {
  GoogleLoginDto,
  LoginDto,
  RegisterDto,
  TelegramLoginDto,
} from './dto/auth.dto';

export type SafeUser = Omit<User, 'passwordHash'>;

export interface AuthResult {
  user: SafeUser;
  tokens: TokenPair;
}

function toSafeUser(user: User): SafeUser {
  const { passwordHash: _passwordHash, ...safe } = user;
  return safe;
}

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
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
}

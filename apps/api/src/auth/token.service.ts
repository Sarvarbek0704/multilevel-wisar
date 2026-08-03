import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Parse TTL strings like "900s", "15m", "12h", "30d" into milliseconds. */
export function parseTtlMs(ttl: string): number {
  const match = /^(\d+)([smhd])$/.exec(ttl.trim());
  if (!match) return 30 * 24 * 3600 * 1000;
  const value = Number(match[1]);
  const unit = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]]!;
  return value * unit;
}

function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async issuePair(user: User, userAgent?: string, ip?: string): Promise<TokenPair> {
    const accessTtlMs = parseTtlMs(this.configService.get<string>('JWT_ACCESS_TTL') ?? '900s');
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, role: user.role },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: Math.floor(accessTtlMs / 1000),
      },
    );

    const refreshToken = randomBytes(48).toString('hex');
    const refreshTtlMs = parseTtlMs(this.configService.get<string>('JWT_REFRESH_TTL') ?? '30d');
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(refreshToken),
        userAgent,
        ip,
        expiresAt: new Date(Date.now() + refreshTtlMs),
      },
    });

    return { accessToken, refreshToken };
  }

  async rotate(refreshToken: string, userAgent?: string, ip?: string): Promise<{ pair: TokenPair; userId: string }> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: sha256(refreshToken) },
      include: { user: true },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalid or expired');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const pair = await this.issuePair(stored.user, userAgent, ip);
    return { pair, userId: stored.userId };
  }

  async revoke(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: sha256(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

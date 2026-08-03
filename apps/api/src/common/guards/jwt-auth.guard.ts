import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (isPublic) {
      // Best-effort: attach the user when a valid token is present so public
      // endpoints can personalize (e.g. course progress), but never block
      if (token) {
        try {
          const payload = await this.jwtService.verifyAsync(token, {
            secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          });
          (request as Request & { user: unknown }).user = payload;
        } catch {
          // ignore invalid tokens on public routes
        }
      }
      return true;
    }

    if (!token) throw new UnauthorizedException('Access token required');

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      });
      (request as Request & { user: unknown }).user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

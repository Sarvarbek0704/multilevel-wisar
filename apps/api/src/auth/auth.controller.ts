import { Body, Controller, Get, Ip, Post, Headers, HttpCode } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import {
  GoogleLoginDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  TelegramLoginDto,
} from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register')
  @ApiOperation({ summary: 'Email + parol bilan ro‘yxatdan o‘tish' })
  register(
    @Body() dto: RegisterDto,
    @Headers('user-agent') userAgent?: string,
    @Ip() ip?: string,
  ) {
    return this.authService.register(dto, userAgent, ip);
  }

  @Public()
  @Throttle({ default: { limit: 15, ttl: 60_000 } })
  @HttpCode(200)
  @Post('login')
  @ApiOperation({ summary: 'Email + parol bilan kirish' })
  login(@Body() dto: LoginDto, @Headers('user-agent') userAgent?: string, @Ip() ip?: string) {
    return this.authService.login(dto, userAgent, ip);
  }

  @Public()
  @HttpCode(200)
  @Post('google')
  @ApiOperation({ summary: 'Google ID token bilan kirish' })
  google(@Body() dto: GoogleLoginDto, @Headers('user-agent') userAgent?: string, @Ip() ip?: string) {
    return this.authService.googleLogin(dto, userAgent, ip);
  }

  @Public()
  @HttpCode(200)
  @Post('telegram')
  @ApiOperation({ summary: 'Telegram Login Widget ma‘lumotlari bilan kirish' })
  telegram(
    @Body() dto: TelegramLoginDto,
    @Headers('user-agent') userAgent?: string,
    @Ip() ip?: string,
  ) {
    return this.authService.telegramLogin(dto, userAgent, ip);
  }

  @Public()
  @HttpCode(200)
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh token orqali yangi token olish (rotatsiya)' })
  refresh(@Body() dto: RefreshDto, @Headers('user-agent') userAgent?: string, @Ip() ip?: string) {
    return this.authService.refresh(dto.refreshToken, userAgent, ip);
  }

  @Public()
  @HttpCode(200)
  @Post('logout')
  @ApiOperation({ summary: 'Chiqish — refresh tokenni bekor qilish' })
  async logout(@Body() dto: RefreshDto) {
    await this.authService.logout(dto.refreshToken);
    return { success: true };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Joriy foydalanuvchi profili' })
  me(@CurrentUser('sub') userId: string) {
    return this.authService.me(userId);
  }
}

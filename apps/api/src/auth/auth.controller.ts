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

  // ---------- Email OTP: parolsiz kirish / ro‘yxatdan o‘tish ----------

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('otp/email/request')
  @ApiOperation({ summary: 'Email OTP so‘rash (kirish yoki ro‘yxatdan o‘tish)' })
  requestEmailOtp(@Body() dto: EmailOtpRequestDto) {
    return this.authService.requestEmailOtp(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('otp/email/verify')
  @ApiOperation({ summary: 'Email OTP tasdiqlash — hisob yo‘q bo‘lsa yaratiladi' })
  verifyEmailOtp(
    @Body() dto: EmailOtpVerifyDto,
    @Headers('user-agent') userAgent?: string,
    @Ip() ip?: string,
  ) {
    return this.authService.verifyEmailOtp(dto, userAgent, ip);
  }

  // ---------- Telefon OTP: kod Telegram bot orqali keladi ----------

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('otp/phone/request')
  @ApiOperation({
    summary: 'Telefon OTP so‘rash — kod Telegram botga yuboriladi',
    description:
      'Raqam botga ulanmagan bo‘lsa {needsBotContact: true, botUrl} qaytadi: foydalanuvchi botda kontaktini yuborishi kerak.',
  })
  requestPhoneOtp(@Body() dto: PhoneOtpRequestDto) {
    return this.authService.requestPhoneOtp(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('otp/phone/verify')
  @ApiOperation({ summary: 'Telefon OTP tasdiqlash va kirish' })
  verifyPhoneOtp(
    @Body() dto: PhoneOtpVerifyDto,
    @Headers('user-agent') userAgent?: string,
    @Ip() ip?: string,
  ) {
    return this.authService.verifyPhoneOtp(dto, userAgent, ip);
  }

  // ---------- Parolni unutdim / tiklash / almashtirish ----------

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('password/forgot')
  @ApiOperation({ summary: 'Parolni tiklash kodini emailga yuborish' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('password/reset')
  @ApiOperation({ summary: 'Kod bilan yangi parol o‘rnatish (barcha sessiyalar bekor qilinadi)' })
  resetPassword(
    @Body() dto: ResetPasswordDto,
    @Headers('user-agent') userAgent?: string,
    @Ip() ip?: string,
  ) {
    return this.authService.resetPassword(dto, userAgent, ip);
  }

  @ApiBearerAuth()
  @HttpCode(200)
  @Post('password/change')
  @ApiOperation({ summary: 'Parolni almashtirish (kirgan holatda)' })
  changePassword(@CurrentUser('sub') userId: string, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto);
  }

  // ---------- Hisobga email/telefon biriktirish ----------

  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('attach/email/request')
  @ApiOperation({ summary: 'Hisobga email biriktirish uchun kod so‘rash' })
  requestAttachEmail(@CurrentUser('sub') userId: string, @Body() dto: AttachEmailRequestDto) {
    return this.authService.requestAttachEmail(userId, dto);
  }

  @ApiBearerAuth()
  @HttpCode(200)
  @Post('attach/email/verify')
  @ApiOperation({ summary: 'Emailni kod bilan tasdiqlab biriktirish' })
  verifyAttachEmail(@CurrentUser('sub') userId: string, @Body() dto: AttachEmailVerifyDto) {
    return this.authService.verifyAttachEmail(userId, dto);
  }

  @ApiBearerAuth()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(200)
  @Post('attach/phone/request')
  @ApiOperation({ summary: 'Hisobga telefon biriktirish uchun kod so‘rash (bot orqali)' })
  requestAttachPhone(@CurrentUser('sub') userId: string, @Body() dto: AttachPhoneRequestDto) {
    return this.authService.requestAttachPhone(userId, dto);
  }

  @ApiBearerAuth()
  @HttpCode(200)
  @Post('attach/phone/verify')
  @ApiOperation({ summary: 'Telefonni kod bilan tasdiqlab biriktirish' })
  verifyAttachPhone(@CurrentUser('sub') userId: string, @Body() dto: AttachPhoneVerifyDto) {
    return this.authService.verifyAttachPhone(userId, dto);
  }
}

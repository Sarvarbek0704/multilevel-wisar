import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TelegramModule } from '../telegram/telegram.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { TokenService } from './token.service';

@Module({
  // Phone OTPs are delivered through the bot
  imports: [JwtModule.register({}), forwardRef(() => TelegramModule)],
  controllers: [AuthController],
  providers: [AuthService, TokenService, OtpService],
  exports: [TokenService, JwtModule],
})
export class AuthModule {}

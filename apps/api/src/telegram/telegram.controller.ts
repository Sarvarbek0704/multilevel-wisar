import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { TelegramService } from './telegram.service';

@ApiTags('telegram')
@Controller('telegram')
export class TelegramController {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @HttpCode(200)
  @Post('webhook/:secret')
  @ApiExcludeEndpoint()
  async webhook(@Param('secret') secret: string, @Body() update: unknown) {
    if (secret !== this.configService.get<string>('TELEGRAM_WEBHOOK_SECRET')) {
      throw new ForbiddenException();
    }
    await this.telegramService.handleWebhookUpdate(update);
    return { ok: true };
  }

  @Post('link')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Botga ulanish havolasini olish (t.me deep link)' })
  link(@CurrentUser('sub') userId: string) {
    return this.telegramService.createLinkToken(userId);
  }
}

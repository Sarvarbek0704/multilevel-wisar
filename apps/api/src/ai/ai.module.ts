import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MocksModule } from '../mocks/mocks.module';
import { TelegramModule } from '../telegram/telegram.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { MistakesService } from './mistakes.service';
import { AI_PROVIDER } from './providers/ai-provider.interface';
import { AnthropicProvider } from './providers/anthropic.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { MockAiProvider } from './providers/mock.provider';

@Module({
  imports: [MocksModule, forwardRef(() => TelegramModule)],
  controllers: [AiController],
  providers: [
    AiService,
    MistakesService,
    GeminiProvider,
    AnthropicProvider,
    MockAiProvider,
    {
      provide: AI_PROVIDER,
      inject: [ConfigService, GeminiProvider, AnthropicProvider, MockAiProvider],
      useFactory: (
        config: ConfigService,
        gemini: GeminiProvider,
        anthropic: AnthropicProvider,
        mock: MockAiProvider,
      ) => {
        switch (config.get<string>('AI_PROVIDER')) {
          case 'anthropic':
            return anthropic;
          case 'mock':
            return mock;
          default:
            return gemini;
        }
      },
    },
  ],
  exports: [AiService, MistakesService, AI_PROVIDER],
})
export class AiModule {}

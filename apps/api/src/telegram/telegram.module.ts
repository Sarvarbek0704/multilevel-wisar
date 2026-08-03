import { Module } from '@nestjs/common';
import { ProgressModule } from '../progress/progress.module';
import { StudyPlanModule } from '../study-plan/study-plan.module';
import { VocabularyModule } from '../vocabulary/vocabulary.module';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';

@Module({
  imports: [ProgressModule, StudyPlanModule, VocabularyModule],
  controllers: [TelegramController],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}

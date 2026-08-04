import { Module, forwardRef } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ExercisesModule } from '../exercises/exercises.module';
import { ProgressModule } from '../progress/progress.module';
import { StudyPlanModule } from '../study-plan/study-plan.module';
import { VocabularyModule } from '../vocabulary/vocabulary.module';
import { ContactHandler } from './handlers/contact.handler';
import { MenuHandler } from './handlers/menu.handler';
import { PlanHandler } from './handlers/plan.handler';
import { QuizHandler } from './handlers/quiz.handler';
import { SettingsHandler } from './handlers/settings.handler';
import { VocabularyHandler } from './handlers/vocabulary.handler';
import { WritingHandler } from './handlers/writing.handler';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { TelegramUserService } from './telegram-user.service';

@Module({
  imports: [
    ProgressModule,
    StudyPlanModule,
    VocabularyModule,
    ExercisesModule,
    // AiModule notifies users through TelegramService, so the two modules
    // reference each other.
    forwardRef(() => AiModule),
  ],
  controllers: [TelegramController],
  providers: [
    TelegramService,
    TelegramUserService,
    MenuHandler,
    ContactHandler,
    PlanHandler,
    VocabularyHandler,
    QuizHandler,
    WritingHandler,
    SettingsHandler,
  ],
  exports: [TelegramService],
})
export class TelegramModule {}

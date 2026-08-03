import { Module } from '@nestjs/common';
import { ProgressModule } from '../progress/progress.module';
import { VocabularyController } from './vocabulary.controller';
import { VocabularyService } from './vocabulary.service';

@Module({
  imports: [ProgressModule],
  controllers: [VocabularyController],
  providers: [VocabularyService],
  exports: [VocabularyService],
})
export class VocabularyModule {}

import { Module } from '@nestjs/common';
import { ProgressModule } from '../progress/progress.module';
import { StudyPlanController } from './study-plan.controller';
import { StudyPlanService } from './study-plan.service';

@Module({
  imports: [ProgressModule],
  controllers: [StudyPlanController],
  providers: [StudyPlanService],
  exports: [StudyPlanService],
})
export class StudyPlanModule {}

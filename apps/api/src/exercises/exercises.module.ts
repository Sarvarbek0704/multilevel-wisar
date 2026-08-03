import { Module } from '@nestjs/common';
import { ProgressModule } from '../progress/progress.module';
import { ExercisesController } from './exercises.controller';
import { ExercisesService } from './exercises.service';

@Module({
  imports: [ProgressModule],
  controllers: [ExercisesController],
  providers: [ExercisesService],
  exports: [ExercisesService],
})
export class ExercisesModule {}

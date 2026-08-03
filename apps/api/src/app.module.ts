import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { ExercisesModule } from './exercises/exercises.module';
import { VocabularyModule } from './vocabulary/vocabulary.module';
import { MocksModule } from './mocks/mocks.module';
import { AiModule } from './ai/ai.module';
import { StudyPlanModule } from './study-plan/study-plan.module';
import { ProgressModule } from './progress/progress.module';
import { TelegramModule } from './telegram/telegram.module';
import { FilesModule } from './files/files.module';
import { AdminModule } from './admin/admin.module';
import { HealthController } from './health/health.controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 120 }],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    ExercisesModule,
    VocabularyModule,
    MocksModule,
    AiModule,
    StudyPlanModule,
    ProgressModule,
    TelegramModule,
    FilesModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

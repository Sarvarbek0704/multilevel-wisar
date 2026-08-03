import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CefrLevel, Subject } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StudyPlanService } from './study-plan.service';

class GeneratePlanDto {
  @IsEnum(Subject)
  subject: Subject = Subject.ENGLISH;

  @IsEnum(CefrLevel)
  targetLevel: CefrLevel = CefrLevel.C1;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  examDate?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(480)
  dailyMinutes?: number;
}

@ApiTags('study-plan')
@ApiBearerAuth()
@Controller('study-plan')
export class StudyPlanController {
  constructor(private readonly studyPlanService: StudyPlanService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Shaxsiy o‘quv reja yaratish (darslar + mocklar + so‘zlar kalendari)' })
  generate(@CurrentUser('sub') userId: string, @Body() dto: GeneratePlanDto) {
    return this.studyPlanService.generate(userId, dto);
  }

  @Get('active')
  @ApiOperation({ summary: 'Faol reja: bugungi va shu haftadagi vazifalar' })
  @ApiQuery({ name: 'subject', enum: Subject, required: false })
  active(@CurrentUser('sub') userId: string, @Query('subject') subject?: Subject) {
    return this.studyPlanService.getActive(userId, subject);
  }

  @Post('tasks/:id/complete')
  @ApiOperation({ summary: 'Reja vazifasini bajarilgan deb belgilash' })
  complete(@CurrentUser('sub') userId: string, @Param('id') taskId: string) {
    return this.studyPlanService.completeTask(userId, taskId);
  }

  @Get('tasks')
  @ApiOperation({ summary: 'Vazifalar kalendari (sana oralig‘ida)' })
  @ApiQuery({ name: 'from', required: true, example: '2026-08-03' })
  @ApiQuery({ name: 'to', required: true, example: '2026-08-31' })
  tasks(
    @CurrentUser('sub') userId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.studyPlanService.tasksRange(userId, new Date(from), new Date(to));
  }
}

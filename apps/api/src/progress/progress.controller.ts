import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ProgressService } from './progress.service';

class CompleteLessonDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;
}

@ApiTags('progress')
@ApiBearerAuth()
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Bosh sahifa statistikasi: streak, XP, bugungi maqsad, oxirgi mock' })
  dashboard(@CurrentUser('sub') userId: string) {
    return this.progressService.dashboard(userId);
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Faollik xaritasi (oxirgi N kun)' })
  @ApiQuery({ name: 'days', required: false })
  heatmap(@CurrentUser('sub') userId: string, @Query('days') days?: string) {
    return this.progressService.heatmap(userId, days ? Number(days) : 180);
  }

  @Post('lessons/:id/complete')
  @ApiOperation({ summary: 'Darsni tugatilgan deb belgilash' })
  completeLesson(
    @CurrentUser('sub') userId: string,
    @Param('id') lessonId: string,
    @Body() dto: CompleteLessonDto,
  ) {
    return this.progressService.completeLesson(userId, lessonId, dto.score);
  }
}

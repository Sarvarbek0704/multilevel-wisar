import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Subject } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AiService } from './ai.service';

class PracticeWritingDto {
  @IsEnum(Subject)
  subject: Subject = Subject.ENGLISH;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  taskPrompt!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10_000)
  text!: string;
}

class PracticeSpeakingDto {
  @IsEnum(Subject)
  subject: Subject = Subject.ENGLISH;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  taskPrompt!: string;

  @IsString()
  @IsNotEmpty()
  audioUrl!: string;
}

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  @Post('writing/practice')
  @ApiOperation({ summary: 'Writing matnini AI bilan baholash (amaliyot rejimi, sinxron)' })
  practiceWriting(@CurrentUser('sub') userId: string, @Body() dto: PracticeWritingDto) {
    return this.aiService.practiceWriting(userId, dto);
  }

  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  @Post('speaking/practice')
  @ApiOperation({ summary: 'Speaking audiosini AI bilan baholash (amaliyot rejimi, sinxron)' })
  practiceSpeaking(@CurrentUser('sub') userId: string, @Body() dto: PracticeSpeakingDto) {
    return this.aiService.practiceSpeaking(userId, dto);
  }

  @Get('evaluations/my')
  @ApiOperation({ summary: 'Mening AI baholashlarim tarixi' })
  @ApiQuery({ name: 'limit', required: false })
  myEvaluations(@CurrentUser('sub') userId: string, @Query('limit') limit?: string) {
    return this.aiService.myEvaluations(userId, limit ? Number(limit) : 20);
  }

  @Get('evaluations/:id')
  @ApiOperation({ summary: 'Bitta baholash holati/natijasi' })
  getEvaluation(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.aiService.getEvaluation(userId, id);
  }
}

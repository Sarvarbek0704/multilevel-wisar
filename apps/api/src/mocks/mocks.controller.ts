import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { MockKind, Subject } from '@prisma/client';
import { IsObject, IsOptional, IsString } from 'class-validator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { MocksService } from './mocks.service';

class SaveAnswerDto {
  @IsOptional()
  @IsObject()
  answer?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  audioUrl?: string;
}

@ApiTags('mocks')
@Controller('mocks')
export class MocksController {
  constructor(private readonly mocksService: MocksService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Mock imtihonlar ro‘yxati' })
  @ApiQuery({ name: 'subject', enum: Subject, required: false })
  @ApiQuery({ name: 'kind', enum: MockKind, required: false })
  list(@Query('subject') subject?: Subject, @Query('kind') kind?: MockKind) {
    return this.mocksService.listExams(subject, kind);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Imtihon tuzilishi (savollarsiz)' })
  get(@Param('slug') slug: string) {
    return this.mocksService.getExam(slug);
  }

  @Post(':slug/start')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Imtihonni boshlash (yoki davom ettirish) — savollar javobsiz qaytadi' })
  start(@CurrentUser('sub') userId: string, @Param('slug') slug: string) {
    return this.mocksService.startAttempt(userId, slug);
  }

  @Get('attempts/my')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mening urinishlarim' })
  myAttempts(@CurrentUser('sub') userId: string) {
    return this.mocksService.myAttempts(userId);
  }

  @Get('attempts/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Faol urinish (davom ettirish uchun)' })
  attempt(@CurrentUser('sub') userId: string, @Param('id') attemptId: string) {
    return this.mocksService.getAttemptForTaking(userId, attemptId);
  }

  @Post('attempts/:id/answers/:questionId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Javobni saqlash (autosave)' })
  saveAnswer(
    @CurrentUser('sub') userId: string,
    @Param('id') attemptId: string,
    @Param('questionId') questionId: string,
    @Body() dto: SaveAnswerDto,
  ) {
    return this.mocksService.saveAnswer(userId, attemptId, questionId, dto);
  }

  @Post('attempts/:id/submit')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Imtihonni topshirish — L/R darhol, W/S AI navbatga qo‘yiladi' })
  submit(@CurrentUser('sub') userId: string, @Param('id') attemptId: string) {
    return this.mocksService.submitAttempt(userId, attemptId);
  }

  @Get('attempts/:id/result')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Natija: ballar, to‘g‘ri javoblar, AI tahlili' })
  result(@CurrentUser('sub') userId: string, @Param('id') attemptId: string) {
    return this.mocksService.getResult(userId, attemptId);
  }
}

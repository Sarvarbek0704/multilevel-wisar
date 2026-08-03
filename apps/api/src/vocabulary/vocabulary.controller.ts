import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CefrLevel, Subject } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { VocabularyService } from './vocabulary.service';

class ListWordsQueryDto {
  @IsEnum(Subject)
  subject: Subject = Subject.ENGLISH;

  @IsOptional()
  @IsEnum(CefrLevel)
  level?: CefrLevel;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 50;
}

class StartLearningDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  wordIds?: string[];

  @IsOptional()
  @IsEnum(Subject)
  subject?: Subject;

  @IsOptional()
  @IsEnum(CefrLevel)
  level?: CefrLevel;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  count?: number;
}

class ReviewDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(5)
  grade!: number;
}

@ApiTags('vocabulary')
@Controller('vocabulary')
export class VocabularyController {
  constructor(private readonly vocabularyService: VocabularyService) {}

  @Public()
  @Get('topics')
  @ApiOperation({ summary: 'Mavzular ro‘yxati (so‘zlar soni bilan)' })
  @ApiQuery({ name: 'subject', enum: Subject, required: false })
  @ApiQuery({ name: 'level', enum: CefrLevel, required: false })
  topics(@Query('subject') subject: Subject = Subject.ENGLISH, @Query('level') level?: CefrLevel) {
    return this.vocabularyService.topics(subject, level);
  }

  @Public()
  @Get('words')
  @ApiOperation({ summary: 'So‘zlar ro‘yxati (daraja/mavzu bo‘yicha)' })
  listWords(@Query() query: ListWordsQueryDto) {
    return this.vocabularyService.listWords(query);
  }

  @Post('learn')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'So‘zlarni o‘rganish ro‘yxatiga qo‘shish' })
  startLearning(@CurrentUser('sub') userId: string, @Body() dto: StartLearningDto) {
    return this.vocabularyService.startLearning(userId, dto);
  }

  @Get('due')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Takrorlash vaqti kelgan kartochkalar' })
  @ApiQuery({ name: 'limit', required: false })
  due(@CurrentUser('sub') userId: string, @Query('limit') limit?: string) {
    return this.vocabularyService.dueCards(userId, limit ? Number(limit) : 20);
  }

  @Post('cards/:id/review')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Kartochkani baholash (0=bilmadim, 3=qiyin, 4=yaxshi, 5=oson)' })
  review(
    @CurrentUser('sub') userId: string,
    @Param('id') cardId: string,
    @Body() dto: ReviewDto,
  ) {
    return this.vocabularyService.review(userId, cardId, dto.grade);
  }

  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lug‘at statistikasi' })
  stats(@CurrentUser('sub') userId: string) {
    return this.vocabularyService.stats(userId);
  }
}

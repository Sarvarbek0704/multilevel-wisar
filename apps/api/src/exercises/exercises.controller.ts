import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CefrLevel, Skill, Subject } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { ExercisesService } from './exercises.service';

class PracticeQueryDto {
  @IsEnum(Subject)
  subject: Subject = Subject.ENGLISH;

  @IsOptional()
  @IsEnum(Skill)
  skill?: Skill;

  @IsOptional()
  @IsEnum(CefrLevel)
  level?: CefrLevel;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  count = 10;
}

@ApiTags('exercises')
@ApiBearerAuth()
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @Get('practice')
  @ApiOperation({ summary: 'Tasodifiy mashqlar to‘plami (skill/daraja bo‘yicha)' })
  @ApiQuery({ name: 'subject', enum: Subject, required: false })
  @ApiQuery({ name: 'skill', enum: Skill, required: false })
  @ApiQuery({ name: 'level', enum: CefrLevel, required: false })
  @ApiQuery({ name: 'count', required: false })
  practice(@Query() query: PracticeQueryDto) {
    return this.exercisesService.practiceSet(query);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Mashq javobini yuborish — natija + izoh qaytadi' })
  submit(
    @CurrentUser('sub') userId: string,
    @Param('id') exerciseId: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.exercisesService.submitAnswer(userId, exerciseId, dto.answer);
  }
}

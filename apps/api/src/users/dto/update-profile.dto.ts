import { ApiPropertyOptional } from '@nestjs/swagger';
import { CefrLevel } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  lastName?: string;

  @ApiPropertyOptional({ enum: ['uz', 'en'] })
  @IsOptional()
  @IsIn(['uz', 'en'])
  uiLanguage?: string;

  @ApiPropertyOptional({ enum: CefrLevel })
  @IsOptional()
  @IsEnum(CefrLevel)
  targetLevel?: CefrLevel;

  @ApiPropertyOptional({ enum: CefrLevel })
  @IsOptional()
  @IsEnum(CefrLevel)
  currentLevel?: CefrLevel;

  @ApiPropertyOptional({ description: 'Rejalashtirilgan imtihon sanasi (ISO)' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  examDate?: Date;

  @ApiPropertyOptional({ minimum: 10, maximum: 480 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(480)
  dailyGoalMinutes?: number;
}

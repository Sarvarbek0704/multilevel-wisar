import { ApiProperty } from '@nestjs/swagger';
import { IsDefined } from 'class-validator';

export class SubmitAnswerDto {
  @ApiProperty({
    description:
      'Javob: {value} (MCQ/gap), {values: []} (multi), {pairs: {}} (matching), {order: []} (ordering), {text} (writing)',
  })
  @IsDefined()
  answer!: Record<string, unknown>;
}

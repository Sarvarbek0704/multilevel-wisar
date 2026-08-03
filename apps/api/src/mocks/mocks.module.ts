import { Module } from '@nestjs/common';
import { MocksController } from './mocks.controller';
import { MocksService } from './mocks.service';
import { ScoringService } from './scoring.service';

@Module({
  controllers: [MocksController],
  providers: [MocksService, ScoringService],
  exports: [MocksService, ScoringService],
})
export class MocksModule {}

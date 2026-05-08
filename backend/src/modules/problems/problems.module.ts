import { Module } from '@nestjs/common';
import { ProblemsController } from './problems.controller';
import { ProblemsService } from './problems.service';
import { ProblemsRepository } from './problems.repository';

@Module({
  controllers: [ProblemsController],
  providers: [ProblemsService, ProblemsRepository],
  exports: [ProblemsService],
})
export class ProblemsModule {}

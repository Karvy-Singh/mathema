import { Module } from '@nestjs/common';
import { MockExamsController } from './mock-exams.controller';
import { MockExamsService } from './mock-exams.service';
import { MockExamsRepository } from './mock-exams.repository';
import { GradingService } from './services/grading.service';
import { AiRecommendExamService } from './services/ai-recommend-exam.service';
import { WrongNotesModule } from '../wrong-notes/wrong-notes.module';
import { AttemptsModule } from '../attempts/attempts.module';

@Module({
  imports: [WrongNotesModule, AttemptsModule],
  controllers: [MockExamsController],
  providers: [MockExamsService, MockExamsRepository, GradingService, AiRecommendExamService],
  exports: [MockExamsService],
})
export class MockExamsModule {}

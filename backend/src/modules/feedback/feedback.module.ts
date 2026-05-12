import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
import { TeacherOverrideService } from './teacher-override.service';

@Module({
  controllers: [FeedbackController],
  providers: [FeedbackService, TeacherOverrideService],
  exports: [FeedbackService, TeacherOverrideService],
})
export class FeedbackModule {}

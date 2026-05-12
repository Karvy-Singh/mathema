import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { FeedbackRaterType, FeedbackTargetType, TeacherOverrideTargetType } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FeedbackService } from './feedback.service';
import { TeacherOverrideService } from './teacher-override.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class FeedbackController {
  constructor(
    private readonly feedback: FeedbackService,
    private readonly override: TeacherOverrideService,
  ) {}

  /** 명세서 §5 — POST /feedback. */
  @Post('feedback')
  create(
    @CurrentUser('id') raterId: string,
    @Body() body: {
      raterType: FeedbackRaterType;
      targetType: FeedbackTargetType;
      targetId: string;
      aiInsightRating: number;
      comment?: string;
    },
  ) {
    return this.feedback.create({ ...body, raterId });
  }

  @Get('feedback/by-target/:type/:id')
  list(
    @Param('type') type: FeedbackTargetType,
    @Param('id') id: string,
  ) {
    return this.feedback.listForTarget(type, id);
  }

  @Get('feedback/by-target/:type/:id/average')
  avg(@Param('type') type: FeedbackTargetType, @Param('id') id: string) {
    return this.feedback.averageByRater(type, id);
  }

  /** 명세서 §5 — POST /teacher-overrides. teacher 역할 검증은 다른 Guard 도입 시 추가. */
  @Post('teacher-overrides')
  applyOverride(
    @CurrentUser('id') teacherId: string,
    @Body() body: {
      studentUserId: string;
      targetType: TeacherOverrideTargetType;
      targetId: string;
      afterValue: Record<string, unknown>;
      reason: string;
    },
  ) {
    return this.override.apply({ ...body, teacherId });
  }

  /** 명세서 §5 — GET /students/:id/teacher-overrides. */
  @Get('students/:userId/teacher-overrides')
  listForStudent(@Param('userId') userId: string) {
    return this.override.listForStudent(userId);
  }
}

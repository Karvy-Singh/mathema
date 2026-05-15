import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GenerateChapterTestDto } from './dto/generate-chapter-test.dto';
import { GenerateWeeklyAssessmentDto } from './dto/generate-weekly-assessment.dto';
import { SolveMathHelperDto } from './dto/solve-math-helper.dto';
import { MathHelperService } from './math-helper.service';

@UseGuards(JwtAuthGuard)
@Controller('math-helper')
export class MathHelperController {
  constructor(private readonly service: MathHelperService) {}

  @Post('solve')
  solve(@CurrentUser('id') userId: string, @Body() dto: SolveMathHelperDto) {
    return this.service.solve(userId, dto);
  }

  @Post('assessments/chapter-test')
  generateChapterTest(@CurrentUser('id') userId: string, @Body() dto: GenerateChapterTestDto) {
    return this.service.generateChapterTest(userId, dto);
  }

  @Post('assessments/weekly')
  generateWeeklyAssessment(@CurrentUser('id') userId: string, @Body() dto: GenerateWeeklyAssessmentDto) {
    return this.service.generateWeeklyAssessment(userId, dto);
  }
}

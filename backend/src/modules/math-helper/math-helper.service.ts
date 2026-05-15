import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateChapterTestDto } from './dto/generate-chapter-test.dto';
import { GenerateWeeklyAssessmentDto } from './dto/generate-weekly-assessment.dto';
import { SolveMathHelperDto } from './dto/solve-math-helper.dto';

@Injectable()
export class MathHelperService {
  private readonly serviceUrl: string;

  constructor(config: ConfigService) {
    this.serviceUrl = config.get<string>('MATH_HELPER_SERVICE_URL') ?? 'http://localhost:8001';
  }

  async solve(userId: string, dto: SolveMathHelperDto) {
    return this.post('/solve', { ...dto, userId });
  }

  async generateChapterTest(userId: string, dto: GenerateChapterTestDto) {
    return this.post('/assessments/chapter-test', { ...dto, userId });
  }

  async generateWeeklyAssessment(userId: string, dto: GenerateWeeklyAssessmentDto) {
    return this.post('/assessments/weekly', { ...dto, userId });
  }

  private async post(path: string, body: unknown) {
    const response = await fetch(`${this.serviceUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).catch((error: unknown) => {
      throw new BadGatewayException(`Math helper service unavailable: ${String(error)}`);
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new BadGatewayException(`Math helper service failed with ${response.status}: ${body}`);
    }

    return response.json();
  }
}

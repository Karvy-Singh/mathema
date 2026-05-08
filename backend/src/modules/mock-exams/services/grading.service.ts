import { Injectable } from '@nestjs/common';
import { calcGrade, calcPercentile } from '../../../common/utils/grade-calculator.util';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

/**
 * 모의고사 채점.
 *   1) 이 시험에 속한 attempts(.isCorrect) 비율로 score 산출 (0~100)
 *   2) 등급/백분위 lookup
 *   3) durationMin 합산
 *
 * 등급컷은 시험별로 다르므로 grade-calculator 가 표 lookup 한다.
 */
@Injectable()
export class GradingService {
  constructor(private readonly prisma: PrismaService) {}

  async grade(_userId: string, resultId: string, dto: any) {
    const attempts = await this.prisma.attempt.findMany({
      where: { mockExamResultId: resultId },
    });

    let score = 0;
    let durationMin = 0;
    if (attempts.length > 0) {
      const correct = attempts.filter((a) => a.isCorrect).length;
      score = Math.round((correct / attempts.length) * 100);
      durationMin = Math.round(attempts.reduce((s, a) => s + a.durationSec, 0) / 60);
    } else if (typeof dto?.totalScore === 'number') {
      // 호환성: attempts가 없으면 dto.totalScore 사용
      score = dto.totalScore;
    }

    return {
      score,
      grade: calcGrade(score),
      percentile: calcPercentile(score),
      durationMin,
    };
  }
}

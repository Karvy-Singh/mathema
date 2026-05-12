import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

/**
 * ReviewScheduleService — 명세서 §4 Flow 6 (SM-2 기반 복습 타이밍).
 *
 *   역할 분리:
 *     - SM-2          = 복습 타이밍 결정 (forgettingRisk)
 *     - Mastery Model = 숙련도 판단
 *     - ErrorPattern  = 오답 원인 판단
 *     - Adaptive Engine = 다음 문제 선택 (forgettingRisk 도 입력으로 사용)
 *
 *   forgettingRisk 계산:
 *     1) MasteryTrajectory.lastAttemptAt → days_since_last
 *     2) Ebbinghaus 망각 곡선:  R(t) = exp(-t / S)
 *        S(strength) = max(1, masteryScore/10)   ← mastery 높으면 잊는 속도 ↓
 *     3) forgettingRisk = 1 - R(t)
 *     4) 0~1 사이 값. 0.7+ = 복습 우선 후보.
 *
 *   호출 흐름:
 *     - /students/:id/review-schedule → 상위 N concept 반환
 *     - AdaptiveNextProblemService 가 후보 점수에 추가 가중치로 사용 (Phase 후속)
 */

@Injectable()
export class ReviewScheduleService {
  private readonly logger = new Logger(ReviewScheduleService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 학생의 모든 concept 의 forgettingRisk 를 계산. 높은 순 정렬.
   */
  async getForUser(userId: string, take = 10): Promise<Array<{
    conceptId: string;
    conceptName: string;
    masteryScore: number;
    daysSinceLast: number | null;
    forgettingRisk: number;       // 0~1
    priority: 'high' | 'medium' | 'low';
  }>> {
    const trajectories = await this.prisma.masteryTrajectory.findMany({
      where: { userId },
      include: { concept: { select: { id: true, name: true } } },
    });

    const now = Date.now();
    const result = trajectories.map((t) => {
      const lastMs = t.lastAttemptAt ? new Date(t.lastAttemptAt).getTime() : null;
      const daysSinceLast = lastMs ? Math.max(0, (now - lastMs) / (24 * 60 * 60 * 1000)) : null;
      const forgettingRisk = this.computeForgettingRisk(t.masteryScore, daysSinceLast);
      const priority: 'high' | 'medium' | 'low' =
        forgettingRisk >= 0.7 ? 'high' : forgettingRisk >= 0.4 ? 'medium' : 'low';
      return {
        conceptId: t.conceptId,
        conceptName: t.concept.name,
        masteryScore: Math.round(t.masteryScore),
        daysSinceLast: daysSinceLast === null ? null : Math.round(daysSinceLast * 10) / 10,
        forgettingRisk: Math.round(forgettingRisk * 100) / 100,
        priority,
      };
    });

    result.sort((a, b) => b.forgettingRisk - a.forgettingRisk);
    return result.slice(0, take);
  }

  /**
   * Ebbinghaus 변형:
   *   R = exp(-t / S),  t = days_since_last,  S = max(1, mastery/10)
   *   풀이 기록 없으면 forgettingRisk = 1 (최우선 복습 후보).
   *   mastery 0 점이면 S=1 → 빠르게 잊음.
   *   mastery 100 점이면 S=10 → 10일까지 거의 안 잊음.
   */
  private computeForgettingRisk(masteryScore: number, daysSinceLast: number | null): number {
    if (daysSinceLast === null) return 1;
    const strength = Math.max(1, masteryScore / 10);
    const retention = Math.exp(-daysSinceLast / strength);
    return Math.max(0, Math.min(1, 1 - retention));
  }
}

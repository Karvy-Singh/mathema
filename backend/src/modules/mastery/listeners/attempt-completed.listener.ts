import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import {
  BKT_BY_DIFFICULTY, bktUpdate, timeAdjustedParams,
  probToScore, scoreToProb,
} from '../../../common/utils/bkt.util';
import { Difficulty } from '../../../common/enums/difficulty.enum';

/**
 * Mastery 자동 갱신 — Bayesian Knowledge Tracing (BKT).
 *
 * 각 attempt를 베이지안 관측으로 처리해 P(L)을 단계적으로 갱신.
 * 난이도별 4파라미터로 추측·실수·학습 확률을 차등 적용.
 *
 * 표준 BKT 갱신:
 *   1) 관측 likelihood로 사후확률 P(L|obs) 계산
 *   2) 학습 전이 P(L_t+1) = P(L|obs) + (1 - P(L|obs))·T
 *
 * mastery.score(0~100) = P(L)·100으로 호환 유지.
 *
 * 추가 이벤트: wrong-note.mastered → BKT의 마스터 상태로 부분 점프 (P(L)을 0.85까지)
 */
@Injectable()
export class MasteryAttemptListener {
  private readonly logger = new Logger(MasteryAttemptListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('attempt.completed')
  async onAttemptCompleted(attempt: {
    userId: string; problemId: string; isCorrect: boolean; durationSec: number; isRetry?: boolean;
  }) {
    // 재시도는 BKT 갱신 skip — 학생이 마스터 학습 흐름에서 부담 없이 시도하도록
    if (attempt.isRetry) return;

    const problem = await this.prisma.problem.findUnique({
      where: { id: attempt.problemId },
      select: { unitId: true, difficulty: true },
    });
    if (!problem) return;

    const baseParams = BKT_BY_DIFFICULTY[problem.difficulty as Difficulty]
      ?? BKT_BY_DIFFICULTY[Difficulty.UPPER_MIDDLE];
    const params = timeAdjustedParams(baseParams, attempt.durationSec);

    const existing = await this.prisma.masterySnapshot.findUnique({
      where: { userId_unitId: { userId: attempt.userId, unitId: problem.unitId } },
    });

    const prev = existing ? scoreToProb(existing.score) : params.pInit;
    const next = bktUpdate(prev, attempt.isCorrect, params);

    await this.prisma.masterySnapshot.upsert({
      where: { userId_unitId: { userId: attempt.userId, unitId: problem.unitId } },
      update: { score: probToScore(next) },
      create: { userId: attempt.userId, unitId: problem.unitId, score: probToScore(next) },
    });
  }

  /** 오답 마스터 시 — 마스터 상태로 부분 점프 (현재 P(L)과 0.85의 가중평균, 70/30) */
  @OnEvent('wrong-note.mastered')
  async onWrongNoteMastered(payload: { userId: string; problemId: string }) {
    const problem = await this.prisma.problem.findUnique({
      where: { id: payload.problemId }, select: { unitId: true },
    });
    if (!problem) return;

    const existing = await this.prisma.masterySnapshot.findUnique({
      where: { userId_unitId: { userId: payload.userId, unitId: problem.unitId } },
    });
    const prev = existing ? scoreToProb(existing.score) : 0.5;
    const next = 0.7 * prev + 0.3 * 0.85;

    await this.prisma.masterySnapshot.upsert({
      where: { userId_unitId: { userId: payload.userId, unitId: problem.unitId } },
      update: { score: probToScore(next) },
      create: { userId: payload.userId, unitId: problem.unitId, score: probToScore(next) },
    });
  }
}

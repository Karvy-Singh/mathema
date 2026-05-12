import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { LLMJobStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  LLM_ANALYSIS_QUEUE,
  ANALYZE_ATTEMPT_JOB,
  AnalyzeAttemptPayload,
} from './llm-analysis.queue';

/**
 * LLM 분석 작업의 enqueue · 상태 조회 · 수동 재처리.
 *
 *   특징:
 *     - 같은 attemptId 는 LLMAnalysisJob.attemptId @unique 로 중복 enqueue 차단.
 *     - DB 의 LLMAnalysisJob 과 BullMQ 큐 양쪽 모두 유지 — 큐는 작업 실행 메커니즘,
 *       DB 는 영구 감사 + 통계 + 수동 재처리.
 *     - 실패 시 exponential backoff (attempts=3, delay=2s base, factor=3).
 *     - dead-letter: 실패 후 maxRetries 도달 시 LLMAnalysisJob.status=FAILED 영구 보관.
 */
@Injectable()
export class LLMAnalysisQueueService {
  private readonly logger = new Logger(LLMAnalysisQueueService.name);

  constructor(
    @InjectQueue(LLM_ANALYSIS_QUEUE) private readonly queue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Attempt 1 건 분석 enqueue. 이미 작업 row 있으면 status 별 분기:
   *   - PENDING/PROCESSING/RETRYING → 중복 enqueue X (idempotent)
   *   - COMPLETED → 다시 enqueue X (재분석은 admin retry 로 명시 호출)
   *   - FAILED/NEEDS_REVIEW → 새 작업으로 enqueue (retryCount 유지)
   */
  async enqueueAttemptAnalysis(input: {
    attemptId: string;
    userId: string;
    problemId: string;
    tenantId: string | null;
  }): Promise<{ jobRowId: string; bullJobId: string; reused: boolean }> {
    const existing = await this.prisma.lLMAnalysisJob.findUnique({
      where: { attemptId: input.attemptId },
    });

    // 진행 중이거나 완료된 작업은 중복 X.
    if (existing && ['PENDING', 'PROCESSING', 'RETRYING', 'COMPLETED'].includes(existing.status)) {
      return { jobRowId: existing.id, bullJobId: existing.bullJobId ?? '', reused: true };
    }

    // 새 row 또는 FAILED/NEEDS_REVIEW row 재사용.
    const jobRow = existing
      ? await this.prisma.lLMAnalysisJob.update({
          where: { id: existing.id },
          data: { status: LLMJobStatus.PENDING, lastError: null, startedAt: null, lastChangedAt: new Date() },
        })
      : await this.prisma.lLMAnalysisJob.create({
          data: {
            attemptId: input.attemptId,
            userId: input.userId,
            problemId: input.problemId,
            tenantId: input.tenantId,
            status: LLMJobStatus.PENDING,
          },
        });

    const bullJob = await this.queue.add(
      ANALYZE_ATTEMPT_JOB,
      { attemptId: input.attemptId, jobRowId: jobRow.id } as AnalyzeAttemptPayload,
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    );

    await this.prisma.lLMAnalysisJob.update({
      where: { id: jobRow.id },
      data: { bullJobId: String(bullJob.id), lastChangedAt: new Date() },
    });

    return { jobRowId: jobRow.id, bullJobId: String(bullJob.id), reused: false };
  }

  /** 큐 상태 요약 — admin 운영 모니터링. */
  async getQueueStats() {
    const counts = await this.queue.getJobCounts(
      'waiting', 'active', 'completed', 'failed', 'delayed', 'paused',
    );
    return counts;
  }

  /** DB 상태 별 카운트 — BullMQ 와 별개로 영구 row 기준. */
  async getDbStats() {
    const grouped = await this.prisma.lLMAnalysisJob.groupBy({
      by: ['status'],
      _count: true,
    });
    const out: Record<string, number> = { PENDING: 0, PROCESSING: 0, COMPLETED: 0, FAILED: 0, NEEDS_REVIEW: 0, RETRYING: 0 };
    for (const g of grouped) out[g.status] = (g as any)._count;
    return out;
  }

  /** Dead-letter (FAILED) 목록. */
  listFailed(limit = 50) {
    return this.prisma.lLMAnalysisJob.findMany({
      where: { status: LLMJobStatus.FAILED },
      orderBy: { lastChangedAt: 'desc' },
      take: limit,
    });
  }

  /** 수동 재처리 — admin endpoint 용. */
  async retry(jobRowId: string) {
    const row = await this.prisma.lLMAnalysisJob.findUnique({ where: { id: jobRowId } });
    if (!row) throw new Error('LLMAnalysisJob not found');
    if (['PENDING', 'PROCESSING', 'RETRYING'].includes(row.status)) {
      throw new Error(`Cannot retry — current status=${row.status}`);
    }
    // retryCount 유지 — admin 재처리는 별개 회수.
    await this.prisma.lLMAnalysisJob.update({
      where: { id: jobRowId },
      data: { status: LLMJobStatus.PENDING, lastError: null, lastChangedAt: new Date() },
    });
    const bullJob = await this.queue.add(
      ANALYZE_ATTEMPT_JOB,
      { attemptId: row.attemptId, jobRowId: row.id } as AnalyzeAttemptPayload,
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 100, removeOnFail: 1000 },
    );
    await this.prisma.lLMAnalysisJob.update({
      where: { id: row.id }, data: { bullJobId: String(bullJob.id) },
    });
    return { ok: true, bullJobId: String(bullJob.id) };
  }
}

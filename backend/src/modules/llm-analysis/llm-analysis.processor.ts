import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { LLMJobStatus } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { LLMAnalysisService } from './llm-analysis.service';
import { LLM_ANALYSIS_QUEUE, ANALYZE_ATTEMPT_JOB, AnalyzeAttemptPayload } from './llm-analysis.queue';

/**
 * BullMQ worker — `llm-analysis` 큐의 `analyze-attempt` job 처리.
 *
 *   process() 흐름:
 *     1. LLMAnalysisJob row status = PROCESSING, startedAt = now
 *     2. LLMAnalysisService.analyzeAttempt(attemptId) 호출 (실 OpenAI call)
 *        - 내부에서 LLMAnalysisLog 1 row 항상 생성 (VALIDATED/NEEDS_REVIEW/REJECTED)
 *     3. 성공 → status=COMPLETED, resultLogId 저장
 *
 *   에러 → BullMQ 가 자동 retry (backoff exponential, max 3).
 *     attemptsMade < 3      → status=RETRYING (next attempt 예약됨)
 *     attemptsMade == 3 + 실패 → status=FAILED (dead-letter)
 *   onCompleted / onFailed 이벤트 핸들러가 DB 상태 동기화.
 */
@Processor(LLM_ANALYSIS_QUEUE, { concurrency: Number(process.env.LLM_QUEUE_CONCURRENCY ?? 2) })
export class LLMAnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(LLMAnalysisProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LLMAnalysisService,
  ) {
    super();
  }

  async process(job: Job<AnalyzeAttemptPayload>): Promise<{ logId?: string }> {
    if (job.name !== ANALYZE_ATTEMPT_JOB) {
      throw new Error(`Unknown job: ${job.name}`);
    }
    const { attemptId, jobRowId } = job.data;
    await this.prisma.lLMAnalysisJob.update({
      where: { id: jobRowId },
      data: {
        status: LLMJobStatus.PROCESSING,
        startedAt: new Date(),
        lastChangedAt: new Date(),
        retryCount: job.attemptsMade,
      },
    });

    await this.llm.analyzeAttempt(attemptId);

    // 가장 최근 LLMAnalysisLog 가 결과.
    const log = await this.prisma.lLMAnalysisLog.findFirst({
      where: { attemptId }, orderBy: { createdAt: 'desc' }, select: { id: true, validationStatus: true },
    });
    return { logId: log?.id };
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<AnalyzeAttemptPayload>, result: { logId?: string }) {
    const log = result?.logId
      ? await this.prisma.lLMAnalysisLog.findUnique({ where: { id: result.logId }, select: { validationStatus: true } })
      : null;
    // VALIDATED/REJECTED 는 COMPLETED, NEEDS_REVIEW 는 동일 상태 유지 (수동 검수 대기).
    const next: LLMJobStatus = log?.validationStatus === 'NEEDS_REVIEW'
      ? LLMJobStatus.NEEDS_REVIEW
      : LLMJobStatus.COMPLETED;

    await this.prisma.lLMAnalysisJob.update({
      where: { id: job.data.jobRowId },
      data: { status: next, resultLogId: result?.logId ?? null, lastChangedAt: new Date(), lastError: null },
    });
    this.logger.log(`Job ${job.id} attempt=${job.data.attemptId} → ${next}`);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<AnalyzeAttemptPayload> | undefined, err: Error) {
    if (!job) return;
    const exhausted = job.attemptsMade >= (job.opts.attempts ?? 3);
    const next: LLMJobStatus = exhausted ? LLMJobStatus.FAILED : LLMJobStatus.RETRYING;
    await this.prisma.lLMAnalysisJob.update({
      where: { id: job.data.jobRowId },
      data: {
        status: next,
        retryCount: job.attemptsMade,
        lastError: (err.message ?? '').slice(0, 1000),
        lastChangedAt: new Date(),
      },
    });
    this.logger.warn(`Job ${job.id} attempt=${job.data.attemptId} failed (${job.attemptsMade}/${job.opts.attempts}) → ${next}: ${err.message}`);
  }
}

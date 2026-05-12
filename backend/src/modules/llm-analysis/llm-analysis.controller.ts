import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { LLMAnalysisQueueService } from './llm-analysis-queue.service';

/**
 * 운영자 — LLM 분석 큐 모니터링 + 수동 재처리.
 *   ADMIN 권한 필요 (학원 운영자/시스템 운영자).
 */
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/llm-jobs')
export class LLMAnalysisAdminController {
  constructor(private readonly queue: LLMAnalysisQueueService) {}

  /** BullMQ + DB 양쪽 status 카운트. */
  @Get('stats')
  async stats() {
    const [queue, db] = await Promise.all([
      this.queue.getQueueStats(),
      this.queue.getDbStats(),
    ]);
    return { queue, db };
  }

  /** Dead-letter (FAILED) 목록. */
  @Get('failed')
  failed(@Query('limit') limit?: string) {
    return this.queue.listFailed(limit ? Math.min(200, parseInt(limit, 10)) : 50);
  }

  /** 실패 작업 수동 재처리 — body 없이도 작동. */
  @Post(':id/retry')
  retry(@Param('id') id: string, @Body() _body: unknown) {
    return this.queue.retry(id);
  }
}

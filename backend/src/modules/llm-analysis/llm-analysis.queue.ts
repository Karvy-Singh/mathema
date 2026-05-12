/**
 * BullMQ 큐 상수 — 1000명 PoC LLM 분석 파이프라인.
 *   Queue 이름 'llm-analysis'.
 *   Job 이름 'analyze-attempt' — payload: { attemptId, jobRowId }.
 */
export const LLM_ANALYSIS_QUEUE = 'llm-analysis';
export const ANALYZE_ATTEMPT_JOB = 'analyze-attempt';

export interface AnalyzeAttemptPayload {
  attemptId: string;
  /** LLMAnalysisJob.id — worker 가 상태 갱신 시 사용. */
  jobRowId: string;
}

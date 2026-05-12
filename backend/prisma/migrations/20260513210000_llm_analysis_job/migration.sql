-- BullMQ LLM 분석 작업 추적 — 문제 2 (1000명 PoC)
CREATE TYPE "LLMJobStatus" AS ENUM (
  'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'NEEDS_REVIEW', 'RETRYING'
);

CREATE TABLE "LLMAnalysisJob" (
  "id"            TEXT NOT NULL,
  "attemptId"     TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "problemId"     TEXT NOT NULL,
  "tenantId"      TEXT,
  "status"        "LLMJobStatus" NOT NULL DEFAULT 'PENDING',
  "retryCount"    INTEGER NOT NULL DEFAULT 0,
  "maxRetries"    INTEGER NOT NULL DEFAULT 3,
  "bullJobId"     TEXT,
  "lastError"     TEXT,
  "startedAt"     TIMESTAMP(3),
  "lastChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resultLogId"   TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LLMAnalysisJob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LLMAnalysisJob_attemptId_key" ON "LLMAnalysisJob"("attemptId");
CREATE INDEX "LLMAnalysisJob_status_lastChangedAt_idx" ON "LLMAnalysisJob"("status", "lastChangedAt");
CREATE INDEX "LLMAnalysisJob_userId_status_idx"        ON "LLMAnalysisJob"("userId", "status");
CREATE INDEX "LLMAnalysisJob_tenantId_status_idx"      ON "LLMAnalysisJob"("tenantId", "status");

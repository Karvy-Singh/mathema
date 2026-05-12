-- Phase 1: 학습 텔레메트리 + 구조화 인사이트 확장
--   Attempt:        responseTimeMs / hintUsed / deviceType / timeOfDay
--   StudySession:   context / deviceType
--   WrongNote:      insightJson (LLM 구조화 산출)
--   MasterySnapshot: samples / studyTimeMin / lastErrorTypes / lastAttemptAt

-- Attempt
ALTER TABLE "Attempt"
  ADD COLUMN "responseTimeMs" INTEGER,
  ADD COLUMN "hintUsed"       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "deviceType"     TEXT,
  ADD COLUMN "timeOfDay"      INTEGER;

-- StudySession
ALTER TABLE "StudySession"
  ADD COLUMN "context"    "SessionContext" NOT NULL DEFAULT 'STUDY',
  ADD COLUMN "deviceType" TEXT;

-- WrongNote
ALTER TABLE "WrongNote"
  ADD COLUMN "insightJson" JSONB;

-- MasterySnapshot
ALTER TABLE "MasterySnapshot"
  ADD COLUMN "samples"        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "studyTimeMin"   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastErrorTypes" JSONB,
  ADD COLUMN "lastAttemptAt"  TIMESTAMP(3);

-- 단원별 공부 시간 균형 분석 대시보드 쿼리용 인덱스
CREATE INDEX "MasterySnapshot_userId_studyTimeMin_idx"
  ON "MasterySnapshot"("userId", "studyTimeMin");

-- 시간대별 학습 효율 분석용
CREATE INDEX "Attempt_userId_timeOfDay_idx"
  ON "Attempt"("userId", "timeOfDay");

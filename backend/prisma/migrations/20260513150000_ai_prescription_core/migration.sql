-- =============================================================
-- AI 처방 시스템 — Phase 1.1 + 1.2 통합 마이그레이션
--   신규: Tenant / Concept / ProblemConcept / MasteryTrajectory /
--         MasteryEvent / ErrorPatternProfile / LLMAnalysisLog /
--         RecommendationLog / TeacherOverride / Feedback
--   확장: User / Problem / Attempt / StudySession / WeeklyReport
-- =============================================================

-- ---------- ENUM 생성 ----------
CREATE TYPE "SchoolLevel" AS ENUM ('ELEMENTARY', 'MIDDLE', 'HIGH');
CREATE TYPE "ErrorCode"   AS ENUM ('SIGN', 'ALG', 'CON', 'FORMULA', 'GRAPH', 'UNIT', 'CALC', 'LOGIC');
CREATE TYPE "ErrorPatternStatus"   AS ENUM ('ACTIVE', 'IMPROVING', 'RESOLVED');
CREATE TYPE "LLMValidationStatus"  AS ENUM ('PENDING', 'VALIDATED', 'REJECTED', 'NEEDS_REVIEW');
CREATE TYPE "RecommendationType"   AS ENUM ('ADAPTIVE_NEXT', 'SIMILAR_PROBLEM', 'REVIEW_PROBLEM');
CREATE TYPE "RecommendationResult" AS ENUM ('CORRECT', 'INCORRECT', 'SKIPPED');
CREATE TYPE "MasteryTrend"         AS ENUM ('UP', 'DOWN', 'STABLE');
CREATE TYPE "MasteryUpdateSource"  AS ENUM ('RULE_BASED', 'LLM', 'HYBRID', 'TEACHER_OVERRIDE');
CREATE TYPE "FeedbackTargetType"   AS ENUM ('AI_INSIGHT', 'WEEKLY_REPORT', 'NEXT_PROBLEM', 'EXPLANATION');
CREATE TYPE "FeedbackRaterType"    AS ENUM ('STUDENT', 'TEACHER', 'PARENT', 'ADMIN');
CREATE TYPE "TeacherOverrideTargetType" AS ENUM ('MASTERY', 'ERROR_PATTERN', 'RECOMMENDATION');

-- ---------- 기존 모델 확장 ----------

ALTER TABLE "User"
  ADD COLUMN "schoolLevel" "SchoolLevel",
  ADD COLUMN "tenantId"    TEXT;

ALTER TABLE "Problem"
  ADD COLUMN "difficultyLevel"       INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN "requiredSkills"        TEXT[]  NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "expectedSolutionSteps" JSONB,
  ADD COLUMN "commonErrorCodes"      "ErrorCode"[] NOT NULL DEFAULT ARRAY[]::"ErrorCode"[],
  ADD COLUMN "expectedTimeSec"       INTEGER,
  ADD COLUMN "updatedAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "Problem_difficultyLevel_idx" ON "Problem"("difficultyLevel");

ALTER TABLE "Attempt"
  ADD COLUMN "tenantId"            TEXT,
  ADD COLUMN "selfConfidenceScore" INTEGER,
  ADD COLUMN "hintCount"           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "stepByStepInput"     JSONB,
  ADD COLUMN "errorCodes"          "ErrorCode"[] NOT NULL DEFAULT ARRAY[]::"ErrorCode"[];

CREATE INDEX "Attempt_tenantId_createdAt_idx" ON "Attempt"("tenantId", "createdAt");

ALTER TABLE "StudySession"
  ADD COLUMN "tenantId"               TEXT,
  ADD COLUMN "focusScore"             DOUBLE PRECISION,
  ADD COLUMN "fatigueSignal"          TEXT,
  ADD COLUMN "problemCount"           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "correctCount"           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "averageResponseTimeSec" INTEGER;

ALTER TABLE "WeeklyReport"
  ADD COLUMN "tenantId"              TEXT,
  ADD COLUMN "weekEnd"               DATE,
  ADD COLUMN "studentSummary"        TEXT,
  ADD COLUMN "parentSummary"         TEXT,
  ADD COLUMN "teacherSummary"        TEXT,
  ADD COLUMN "topImprovedConcepts"   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "weakConcepts"          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "repeatedErrorPatterns" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "totalSessions"         INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "totalAttempts"         INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "averageStudyDurationSec" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "recommendedNextGoals"  TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE INDEX "WeeklyReport_tenantId_weekStart_idx" ON "WeeklyReport"("tenantId", "weekStart");

-- ---------- Tenant ----------
CREATE TABLE "Tenant" (
  "id"            TEXT NOT NULL,
  "name"          TEXT NOT NULL,
  "code"          TEXT NOT NULL,
  "contactEmail"  TEXT,
  "status"        TEXT NOT NULL DEFAULT 'active',
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Tenant_code_key" ON "Tenant"("code");

ALTER TABLE "User"
  ADD CONSTRAINT "User_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- ---------- Concept ----------
CREATE TABLE "Concept" (
  "id"                    TEXT NOT NULL,
  "code"                  TEXT NOT NULL,
  "name"                  TEXT NOT NULL,
  "subject"               TEXT NOT NULL DEFAULT 'math',
  "gradeLevel"            "GradeLevel",
  "parentConceptId"       TEXT,
  "prerequisiteConceptIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "relatedConceptIds"     TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "unitId"                TEXT,
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Concept_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Concept_code_key" ON "Concept"("code");
CREATE INDEX "Concept_subject_gradeLevel_idx" ON "Concept"("subject", "gradeLevel");
CREATE INDEX "Concept_parentConceptId_idx"   ON "Concept"("parentConceptId");

ALTER TABLE "Concept"
  ADD CONSTRAINT "Concept_parentConceptId_fkey"
  FOREIGN KEY ("parentConceptId") REFERENCES "Concept"("id") ON DELETE SET NULL,
  ADD CONSTRAINT "Concept_unitId_fkey"
  FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL;

-- ---------- ProblemConcept (N:M Join) ----------
CREATE TABLE "ProblemConcept" (
  "problemId" TEXT NOT NULL,
  "conceptId" TEXT NOT NULL,
  "weight"    DOUBLE PRECISION NOT NULL DEFAULT 1.0,
  CONSTRAINT "ProblemConcept_pkey" PRIMARY KEY ("problemId", "conceptId")
);
CREATE INDEX "ProblemConcept_conceptId_idx" ON "ProblemConcept"("conceptId");

ALTER TABLE "ProblemConcept"
  ADD CONSTRAINT "ProblemConcept_problemId_fkey"
  FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "ProblemConcept_conceptId_fkey"
  FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE;

-- ---------- MasteryTrajectory ----------
CREATE TABLE "MasteryTrajectory" (
  "id"                    TEXT NOT NULL,
  "userId"                TEXT NOT NULL,
  "conceptId"             TEXT NOT NULL,
  "tenantId"              TEXT,
  "masteryScore"          DOUBLE PRECISION NOT NULL DEFAULT 0,
  "confidenceInterval"    DOUBLE PRECISION,
  "trend"                 "MasteryTrend" NOT NULL DEFAULT 'STABLE',
  "evidenceCount"         INTEGER NOT NULL DEFAULT 0,
  "recentAccuracy"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  "averageResponseTimeSec" INTEGER NOT NULL DEFAULT 0,
  "hintUsageRate"         DOUBLE PRECISION NOT NULL DEFAULT 0,
  "confidenceGap"         DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lastAttemptAt"         TIMESTAMP(3),
  "updatedBy"             "MasteryUpdateSource" NOT NULL DEFAULT 'RULE_BASED',
  "createdAt"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"             TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MasteryTrajectory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MasteryTrajectory_userId_conceptId_key" ON "MasteryTrajectory"("userId", "conceptId");
CREATE INDEX "MasteryTrajectory_tenantId_masteryScore_idx"   ON "MasteryTrajectory"("tenantId", "masteryScore");
CREATE INDEX "MasteryTrajectory_userId_lastAttemptAt_idx"    ON "MasteryTrajectory"("userId", "lastAttemptAt");

ALTER TABLE "MasteryTrajectory"
  ADD CONSTRAINT "MasteryTrajectory_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "MasteryTrajectory_conceptId_fkey"
  FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE;

-- ---------- MasteryEvent (시계열 이력) ----------
CREATE TABLE "MasteryEvent" (
  "id"            TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "conceptId"     TEXT NOT NULL,
  "tenantId"      TEXT,
  "attemptId"     TEXT,
  "masteryScore"  DOUBLE PRECISION NOT NULL,
  "delta"         DOUBLE PRECISION NOT NULL,
  "evidenceCount" INTEGER NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MasteryEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MasteryEvent_userId_conceptId_createdAt_idx" ON "MasteryEvent"("userId", "conceptId", "createdAt");

ALTER TABLE "MasteryEvent"
  ADD CONSTRAINT "MasteryEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "MasteryEvent_conceptId_fkey"
  FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE;

-- ---------- ErrorPatternProfile ----------
CREATE TABLE "ErrorPatternProfile" (
  "id"               TEXT NOT NULL,
  "userId"           TEXT NOT NULL,
  "conceptId"        TEXT NOT NULL,
  "tenantId"         TEXT,
  "errorCode"        "ErrorCode" NOT NULL,
  "frequency"        INTEGER NOT NULL DEFAULT 0,
  "recentFrequency"  INTEGER NOT NULL DEFAULT 0,
  "severity"         TEXT NOT NULL DEFAULT 'low',
  "firstDetectedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastDetectedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "llmSummary"       TEXT,
  "evidenceAttemptIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status"           "ErrorPatternStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ErrorPatternProfile_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ErrorPatternProfile_userId_conceptId_errorCode_key"
  ON "ErrorPatternProfile"("userId", "conceptId", "errorCode");
CREATE INDEX "ErrorPatternProfile_tenantId_status_idx" ON "ErrorPatternProfile"("tenantId", "status");
CREATE INDEX "ErrorPatternProfile_userId_status_idx"   ON "ErrorPatternProfile"("userId",   "status");

ALTER TABLE "ErrorPatternProfile"
  ADD CONSTRAINT "ErrorPatternProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "ErrorPatternProfile_conceptId_fkey"
  FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE CASCADE;

-- ---------- LLMAnalysisLog ----------
CREATE TABLE "LLMAnalysisLog" (
  "id"               TEXT NOT NULL,
  "userId"           TEXT NOT NULL,
  "attemptId"        TEXT NOT NULL,
  "problemId"        TEXT NOT NULL,
  "tenantId"         TEXT,
  "modelName"        TEXT NOT NULL,
  "promptVersion"    TEXT NOT NULL,
  "inputHash"        TEXT NOT NULL,
  "rawOutput"        JSONB NOT NULL,
  "parsedOutput"     JSONB NOT NULL,
  "confidenceScore"  DOUBLE PRECISION NOT NULL,
  "validationStatus" "LLMValidationStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LLMAnalysisLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LLMAnalysisLog_userId_createdAt_idx"             ON "LLMAnalysisLog"("userId", "createdAt");
CREATE INDEX "LLMAnalysisLog_attemptId_idx"                    ON "LLMAnalysisLog"("attemptId");
CREATE INDEX "LLMAnalysisLog_promptVersion_modelName_idx"      ON "LLMAnalysisLog"("promptVersion", "modelName");

ALTER TABLE "LLMAnalysisLog"
  ADD CONSTRAINT "LLMAnalysisLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "LLMAnalysisLog_attemptId_fkey"
  FOREIGN KEY ("attemptId") REFERENCES "Attempt"("id") ON DELETE CASCADE;

-- ---------- RecommendationLog ----------
CREATE TABLE "RecommendationLog" (
  "id"                  TEXT NOT NULL,
  "userId"              TEXT NOT NULL,
  "sessionId"           TEXT,
  "tenantId"            TEXT,
  "recommendedProblemId" TEXT NOT NULL,
  "recommendationType"  "RecommendationType" NOT NULL,
  "reason"              TEXT NOT NULL,
  "targetConceptId"     TEXT,
  "targetErrorCode"     "ErrorCode",
  "expectedDifficulty"  INTEGER NOT NULL DEFAULT 3,
  "accepted"            BOOLEAN NOT NULL DEFAULT false,
  "solved"              BOOLEAN NOT NULL DEFAULT false,
  "result"              "RecommendationResult",
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RecommendationLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "RecommendationLog_userId_createdAt_idx"              ON "RecommendationLog"("userId", "createdAt");
CREATE INDEX "RecommendationLog_tenantId_createdAt_idx"            ON "RecommendationLog"("tenantId", "createdAt");
CREATE INDEX "RecommendationLog_userId_accepted_solved_idx"        ON "RecommendationLog"("userId", "accepted", "solved");

ALTER TABLE "RecommendationLog"
  ADD CONSTRAINT "RecommendationLog_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "RecommendationLog_recommendedProblemId_fkey"
  FOREIGN KEY ("recommendedProblemId") REFERENCES "Problem"("id");

-- ---------- TeacherOverride ----------
CREATE TABLE "TeacherOverride" (
  "id"          TEXT NOT NULL,
  "teacherId"   TEXT NOT NULL,
  "userId"      TEXT NOT NULL,
  "tenantId"    TEXT,
  "targetType"  "TeacherOverrideTargetType" NOT NULL,
  "targetId"    TEXT NOT NULL,
  "beforeValue" JSONB NOT NULL,
  "afterValue"  JSONB NOT NULL,
  "reason"      TEXT NOT NULL,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TeacherOverride_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TeacherOverride_userId_createdAt_idx"   ON "TeacherOverride"("userId", "createdAt");
CREATE INDEX "TeacherOverride_teacherId_createdAt_idx" ON "TeacherOverride"("teacherId", "createdAt");
CREATE INDEX "TeacherOverride_tenantId_createdAt_idx" ON "TeacherOverride"("tenantId", "createdAt");

ALTER TABLE "TeacherOverride"
  ADD CONSTRAINT "TeacherOverride_teacherId_fkey"
  FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE,
  ADD CONSTRAINT "TeacherOverride_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE;

-- ---------- Feedback ----------
CREATE TABLE "Feedback" (
  "id"              TEXT NOT NULL,
  "targetType"      "FeedbackTargetType" NOT NULL,
  "targetId"        TEXT NOT NULL,
  "raterType"       "FeedbackRaterType" NOT NULL,
  "raterId"         TEXT NOT NULL,
  "aiInsightRating" INTEGER NOT NULL,
  "comment"         TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Feedback_targetType_targetId_idx" ON "Feedback"("targetType", "targetId");
CREATE INDEX "Feedback_raterId_createdAt_idx"   ON "Feedback"("raterId", "createdAt");

ALTER TABLE "Feedback"
  ADD CONSTRAINT "Feedback_raterId_fkey"
  FOREIGN KEY ("raterId") REFERENCES "User"("id") ON DELETE CASCADE;

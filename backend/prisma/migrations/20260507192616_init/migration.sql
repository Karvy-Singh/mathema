-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('MIDDLE', 'UPPER_MIDDLE', 'SEMI_KILLER', 'KILLER');

-- CreateEnum
CREATE TYPE "ErrorType" AS ENUM ('CONCEPT_MISUNDERSTANDING', 'CALCULATION_MISTAKE', 'TIME_SHORTAGE', 'OTHER');

-- CreateEnum
CREATE TYPE "NoteStatus" AS ENUM ('PENDING', 'ANALYZING', 'MASTERED');

-- CreateEnum
CREATE TYPE "SessionContext" AS ENUM ('STUDY', 'EXAM', 'PRACTICE', 'DIAGNOSTIC');

-- CreateEnum
CREATE TYPE "MockExamType" AS ENUM ('HAKPYEONG', 'MOPYEONG', 'SUNEUNG', 'RECOMMENDED', 'MINI', 'WRONG_REDO', 'REAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL,
    "targetGrade" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubUnit" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "SubUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Problem" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "subUnitId" TEXT,
    "difficulty" "Difficulty" NOT NULL,
    "body" TEXT NOT NULL,
    "formula" TEXT,
    "answer" TEXT NOT NULL,
    "imageUrl" TEXT,
    "hint" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "context" "SessionContext" NOT NULL,
    "answer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "durationSec" INTEGER NOT NULL,
    "studySessionId" TEXT,
    "mockExamResultId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WrongNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "errorType" "ErrorType" NOT NULL,
    "insight" TEXT NOT NULL,
    "status" "NoteStatus" NOT NULL DEFAULT 'PENDING',
    "similarCount" INTEGER NOT NULL DEFAULT 0,
    "occurrences" INTEGER NOT NULL DEFAULT 1,
    "masteredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WrongNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudySession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "sessionNumber" INTEGER NOT NULL,
    "totalSessions" INTEGER NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSec" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StudySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockExam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MockExamType" NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "totalProblems" INTEGER NOT NULL DEFAULT 30,
    "totalMinutes" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MockExamResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mockExamId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "grade" INTEGER NOT NULL,
    "percentile" INTEGER NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MockExamResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 0,
    "problemsSolved" INTEGER NOT NULL DEFAULT 0,
    "accuracyPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "intensity" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterySnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasterySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isoWeek" TEXT NOT NULL,
    "weekStart" DATE NOT NULL,
    "totalHours" DOUBLE PRECISION NOT NULL,
    "problemsSolved" INTEGER NOT NULL,
    "accuracyPct" DOUBLE PRECISION NOT NULL,
    "aiScore" DOUBLE PRECISION NOT NULL,
    "mentorMessage" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_examDate_idx" ON "User"("examDate");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_name_key" ON "Unit"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SubUnit_unitId_name_key" ON "SubUnit"("unitId", "name");

-- CreateIndex
CREATE INDEX "Problem_unitId_difficulty_idx" ON "Problem"("unitId", "difficulty");

-- CreateIndex
CREATE INDEX "Attempt_userId_createdAt_idx" ON "Attempt"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Attempt_userId_problemId_idx" ON "Attempt"("userId", "problemId");

-- CreateIndex
CREATE INDEX "WrongNote_userId_status_idx" ON "WrongNote"("userId", "status");

-- CreateIndex
CREATE INDEX "WrongNote_userId_errorType_idx" ON "WrongNote"("userId", "errorType");

-- CreateIndex
CREATE UNIQUE INDEX "WrongNote_userId_problemId_key" ON "WrongNote"("userId", "problemId");

-- CreateIndex
CREATE INDEX "StudySession_userId_endedAt_idx" ON "StudySession"("userId", "endedAt");

-- CreateIndex
CREATE INDEX "MockExamResult_userId_takenAt_idx" ON "MockExamResult"("userId", "takenAt");

-- CreateIndex
CREATE INDEX "DailyActivity_userId_date_idx" ON "DailyActivity"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyActivity_userId_date_key" ON "DailyActivity"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MasterySnapshot_userId_unitId_key" ON "MasterySnapshot"("userId", "unitId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReport_userId_isoWeek_key" ON "WeeklyReport"("userId", "isoWeek");

-- AddForeignKey
ALTER TABLE "SubUnit" ADD CONSTRAINT "SubUnit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Problem" ADD CONSTRAINT "Problem_subUnitId_fkey" FOREIGN KEY ("subUnitId") REFERENCES "SubUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_studySessionId_fkey" FOREIGN KEY ("studySessionId") REFERENCES "StudySession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_mockExamResultId_fkey" FOREIGN KEY ("mockExamResultId") REFERENCES "MockExamResult"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WrongNote" ADD CONSTRAINT "WrongNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WrongNote" ADD CONSTRAINT "WrongNote_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudySession" ADD CONSTRAINT "StudySession_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockExamResult" ADD CONSTRAINT "MockExamResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MockExamResult" ADD CONSTRAINT "MockExamResult_mockExamId_fkey" FOREIGN KEY ("mockExamId") REFERENCES "MockExam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyActivity" ADD CONSTRAINT "DailyActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterySnapshot" ADD CONSTRAINT "MasterySnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterySnapshot" ADD CONSTRAINT "MasterySnapshot_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyReport" ADD CONSTRAINT "WeeklyReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

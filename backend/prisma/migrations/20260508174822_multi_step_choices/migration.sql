-- CreateEnum
CREATE TYPE "StepType" AS ENUM ('CONCEPT', 'PROCESS', 'ANSWER');

-- CreateEnum
CREATE TYPE "DistractorType" AS ENUM ('CONCEPT_CONFUSION', 'CALC_ERROR', 'PROCESS_SKIP', 'TIME_PRESSURE_GUESS');

-- AlterTable
ALTER TABLE "Attempt" ADD COLUMN     "choiceId" TEXT,
ADD COLUMN     "stepIndex" INTEGER;

-- CreateTable
CREATE TABLE "ProblemStep" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "stepType" "StepType" NOT NULL,
    "prompt" TEXT NOT NULL,

    CONSTRAINT "ProblemStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProblemChoice" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "choiceIndex" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "distractorType" "DistractorType",
    "rationale" TEXT,

    CONSTRAINT "ProblemChoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProblemStep_problemId_idx" ON "ProblemStep"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemStep_problemId_stepIndex_key" ON "ProblemStep"("problemId", "stepIndex");

-- CreateIndex
CREATE INDEX "ProblemChoice_stepId_idx" ON "ProblemChoice"("stepId");

-- CreateIndex
CREATE UNIQUE INDEX "ProblemChoice_stepId_choiceIndex_key" ON "ProblemChoice"("stepId", "choiceIndex");

-- CreateIndex
CREATE INDEX "Attempt_choiceId_idx" ON "Attempt"("choiceId");

-- AddForeignKey
ALTER TABLE "ProblemStep" ADD CONSTRAINT "ProblemStep_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "Problem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProblemChoice" ADD CONSTRAINT "ProblemChoice_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "ProblemStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attempt" ADD CONSTRAINT "Attempt_choiceId_fkey" FOREIGN KEY ("choiceId") REFERENCES "ProblemChoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

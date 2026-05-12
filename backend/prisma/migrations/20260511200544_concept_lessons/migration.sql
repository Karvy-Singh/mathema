-- CreateEnum
CREATE TYPE "NcertClass" AS ENUM ('CLASS_7', 'CLASS_8', 'CLASS_9', 'CLASS_10', 'CLASS_11', 'CLASS_12');

-- CreateEnum
CREATE TYPE "ConceptStepKind" AS ENUM ('HOOK', 'CONCRETE', 'PICTORIAL', 'ABSTRACT', 'WORKED_EXAMPLE', 'GUIDED_PRACTICE', 'RETRIEVAL', 'MISCONCEPTION', 'REFLECT');

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "requestIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAccessLog" (
    "id" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "query" TEXT,
    "body" TEXT,
    "statusCode" INTEGER NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptLesson" (
    "id" TEXT NOT NULL,
    "ncertClass" "NcertClass" NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "chapterCode" TEXT NOT NULL,
    "titleKo" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "bigIdeaKo" TEXT NOT NULL,
    "bigIdeaEn" TEXT NOT NULL,
    "estimatedMin" INTEGER NOT NULL DEFAULT 15,
    "cognitiveLoad" INTEGER NOT NULL DEFAULT 1,
    "prerequisiteCodes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "unitId" TEXT,
    "subUnitId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConceptLesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptStep" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "stepIndex" INTEGER NOT NULL,
    "kind" "ConceptStepKind" NOT NULL,
    "titleKo" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "bodyKo" TEXT NOT NULL,
    "bodyEn" TEXT NOT NULL,
    "visualType" TEXT,
    "visualUrl" TEXT,
    "misconception" JSONB,
    "workedSteps" JSONB,
    "retrievalCheck" JSONB,
    "reflectPrompts" JSONB,

    CONSTRAINT "ConceptStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "completedSteps" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "masteredAt" TIMESTAMP(3),
    "retrievalScore" DOUBLE PRECISION,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConceptProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailVerificationToken_userId_expiresAt_idx" ON "EmailVerificationToken"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "AdminAccessLog_adminEmail_createdAt_idx" ON "AdminAccessLog"("adminEmail", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAccessLog_path_createdAt_idx" ON "AdminAccessLog"("path", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConceptLesson_chapterCode_key" ON "ConceptLesson"("chapterCode");

-- CreateIndex
CREATE INDEX "ConceptLesson_ncertClass_chapterNumber_idx" ON "ConceptLesson"("ncertClass", "chapterNumber");

-- CreateIndex
CREATE INDEX "ConceptLesson_unitId_idx" ON "ConceptLesson"("unitId");

-- CreateIndex
CREATE INDEX "ConceptStep_lessonId_idx" ON "ConceptStep"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "ConceptStep_lessonId_stepIndex_key" ON "ConceptStep"("lessonId", "stepIndex");

-- CreateIndex
CREATE INDEX "ConceptProgress_userId_masteredAt_idx" ON "ConceptProgress"("userId", "masteredAt");

-- CreateIndex
CREATE UNIQUE INDEX "ConceptProgress_userId_lessonId_key" ON "ConceptProgress"("userId", "lessonId");

-- AddForeignKey
ALTER TABLE "ConceptLesson" ADD CONSTRAINT "ConceptLesson_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptLesson" ADD CONSTRAINT "ConceptLesson_subUnitId_fkey" FOREIGN KEY ("subUnitId") REFERENCES "SubUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptStep" ADD CONSTRAINT "ConceptStep_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "ConceptLesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptProgress" ADD CONSTRAINT "ConceptProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptProgress" ADD CONSTRAINT "ConceptProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "ConceptLesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "WrongNote" ADD COLUMN     "easinessFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
ADD COLUMN     "intervalDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lapseCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastReviewedAt" TIMESTAMP(3),
ADD COLUMN     "nextReviewAt" TIMESTAMP(3),
ADD COLUMN     "repetitionCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "WrongNote_userId_nextReviewAt_idx" ON "WrongNote"("userId", "nextReviewAt");

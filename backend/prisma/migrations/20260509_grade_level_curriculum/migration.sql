-- CreateEnum
CREATE TYPE "GradeLevel" AS ENUM (
  'G_MIDDLE_1',
  'G_MIDDLE_2',
  'G_MIDDLE_3',
  'G_HIGH_1',
  'G_HIGH_2',
  'G_HIGH_3'
);

-- AlterTable
ALTER TABLE "User" ADD COLUMN "gradeLevel" "GradeLevel" DEFAULT 'G_HIGH_3';

-- AlterTable
ALTER TABLE "Unit" ADD COLUMN "gradeLevels" "GradeLevel"[] DEFAULT ARRAY[]::"GradeLevel"[];

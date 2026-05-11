-- CreateEnum
CREATE TYPE "CountryCode" AS ENUM ('IN', 'KR', 'US', 'UK', 'AU', 'SG', 'GLOBAL');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "country" "CountryCode" NOT NULL DEFAULT 'IN';

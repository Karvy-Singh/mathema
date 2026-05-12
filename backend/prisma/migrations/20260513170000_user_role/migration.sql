-- User.role + childOfUserId — 명세서 §1 학생/학부모/강사 분리 권한
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'PARENT', 'TEACHER', 'ADMIN');

ALTER TABLE "User"
  ADD COLUMN "role"          "UserRole" NOT NULL DEFAULT 'STUDENT',
  ADD COLUMN "childOfUserId" TEXT;

CREATE INDEX "User_role_tenantId_idx" ON "User"("role", "tenantId");

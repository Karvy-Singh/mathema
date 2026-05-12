-- Phase 5: DPDP (India) + GDPR 동의 시스템

CREATE TYPE "ConsentKind" AS ENUM ('DATA_PROCESSING', 'ANALYTICS', 'MARKETING', 'AI_TRAINING');

CREATE TABLE "Consent" (
  "id"            TEXT NOT NULL,
  "userId"        TEXT NOT NULL,
  "kind"          "ConsentKind" NOT NULL,
  "policyVersion" TEXT NOT NULL DEFAULT '1.0',
  "grantedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt"     TIMESTAMP(3),
  "ipAddress"     TEXT,
  "userAgent"     TEXT,

  CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Consent_userId_kind_revokedAt_idx" ON "Consent"("userId", "kind", "revokedAt");
CREATE INDEX "Consent_userId_grantedAt_idx"      ON "Consent"("userId", "grantedAt");

ALTER TABLE "Consent"
  ADD CONSTRAINT "Consent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

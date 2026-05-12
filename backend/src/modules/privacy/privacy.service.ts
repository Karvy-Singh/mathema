import { Injectable, BadRequestException } from '@nestjs/common';
import { ConsentKind, Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/**
 * DPDP (India Digital Personal Data Protection Act 2023) + GDPR 동의 관리.
 *
 * - 동의는 append-only: grant/revoke 마다 새 row 가 쌓여 이력 보존.
 * - 현재 상태는 (userId, kind) 별 가장 최근 row 의 revokedAt 으로 판정.
 * - DATA_PROCESSING 은 필수 — 가입 시 자동 부여, 철회 시 계정 비활성으로 안내.
 */

export const CURRENT_POLICY_VERSION = '2026-05-13';

export interface ConsentStatus {
  kind: ConsentKind;
  active: boolean;
  grantedAt: Date | null;
  revokedAt: Date | null;
  policyVersion: string | null;
}

@Injectable()
export class PrivacyService {
  constructor(private readonly prisma: PrismaService) {}

  /** 가입 시 호출 — 필수 동의(DATA_PROCESSING) 부여 + 선택 동의 부여. */
  async grantInitial(userId: string, opts: {
    analytics?: boolean;
    marketing?: boolean;
    aiTraining?: boolean;
    ipAddress?: string;
    userAgent?: string;
  } = {}) {
    const rows: Prisma.ConsentCreateManyInput[] = [
      { userId, kind: ConsentKind.DATA_PROCESSING, policyVersion: CURRENT_POLICY_VERSION, ipAddress: opts.ipAddress, userAgent: opts.userAgent },
    ];
    if (opts.analytics)  rows.push({ userId, kind: ConsentKind.ANALYTICS,   policyVersion: CURRENT_POLICY_VERSION, ipAddress: opts.ipAddress, userAgent: opts.userAgent });
    if (opts.marketing)  rows.push({ userId, kind: ConsentKind.MARKETING,   policyVersion: CURRENT_POLICY_VERSION, ipAddress: opts.ipAddress, userAgent: opts.userAgent });
    if (opts.aiTraining) rows.push({ userId, kind: ConsentKind.AI_TRAINING, policyVersion: CURRENT_POLICY_VERSION, ipAddress: opts.ipAddress, userAgent: opts.userAgent });
    await this.prisma.consent.createMany({ data: rows });
  }

  /** 동의 부여 (이미 활성이면 idempotent — 새 row 생성 X). */
  async grant(userId: string, kind: ConsentKind, ctx: { ip?: string; ua?: string } = {}) {
    const current = await this.currentRow(userId, kind);
    if (current && current.revokedAt === null && current.policyVersion === CURRENT_POLICY_VERSION) {
      return current;  // 이미 활성, 같은 정책 — 변경 없음
    }
    return this.prisma.consent.create({
      data: {
        userId, kind,
        policyVersion: CURRENT_POLICY_VERSION,
        ipAddress: ctx.ip, userAgent: ctx.ua,
      },
    });
  }

  /** 동의 철회. DATA_PROCESSING 은 계정 삭제 흐름으로 분기되어야 하므로 거부. */
  async revoke(userId: string, kind: ConsentKind) {
    if (kind === ConsentKind.DATA_PROCESSING) {
      throw new BadRequestException(
        'DATA_PROCESSING consent cannot be revoked directly. Use DELETE /users/me to request account deletion.',
      );
    }
    const current = await this.currentRow(userId, kind);
    if (!current || current.revokedAt !== null) return null;  // 이미 비활성 — no-op
    return this.prisma.consent.update({
      where: { id: current.id },
      data: { revokedAt: new Date() },
    });
  }

  /** 사용자의 현재 모든 kind 상태 (UI 표시용). */
  async status(userId: string): Promise<ConsentStatus[]> {
    const all: ConsentStatus[] = [];
    for (const k of Object.values(ConsentKind)) {
      const r = await this.currentRow(userId, k);
      all.push({
        kind: k,
        active: !!r && r.revokedAt === null,
        grantedAt: r?.grantedAt ?? null,
        revokedAt: r?.revokedAt ?? null,
        policyVersion: r?.policyVersion ?? null,
      });
    }
    return all;
  }

  /** 동의 이력 전체 (DPDP 'fiduciary 책무' 증빙 + GDPR Art.15 access right). */
  async history(userId: string) {
    return this.prisma.consent.findMany({
      where: { userId },
      orderBy: { grantedAt: 'desc' },
    });
  }

  /** 특정 kind 가 현재 활성인지 — 다른 모듈이 게이팅에 사용. */
  async isActive(userId: string, kind: ConsentKind): Promise<boolean> {
    const r = await this.currentRow(userId, kind);
    return !!r && r.revokedAt === null;
  }

  private currentRow(userId: string, kind: ConsentKind) {
    return this.prisma.consent.findFirst({
      where: { userId, kind },
      orderBy: { grantedAt: 'desc' },
    });
  }
}

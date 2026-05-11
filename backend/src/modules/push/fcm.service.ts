import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/**
 * Firebase Cloud Messaging — Android push notifications.
 * 학습 streak / SM-2 due / 주간 mentor message 트리거.
 *
 * 환경 변수:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY  (newline 은 \\n 으로 escape)
 *
 * 셋 다 미설정이면 모든 send() 호출은 no-op (로그만).
 */
@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);
  private app: admin.app.App | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKeyRaw = this.config.get<string>('FIREBASE_PRIVATE_KEY');
    if (projectId && clientEmail && privateKeyRaw) {
      const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
      this.app = admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      }, 'matheo');
      this.logger.log('FCM initialized');
    } else {
      this.logger.warn('FCM credentials not set — push notifications disabled');
    }
  }

  /**
   * Streak 리마인더 — 오늘 학습 안 한 사용자(streak ≥ 3일) 에게 푸시.
   * 매일 저녁 19:00 cron 또는 수동 호출.
   */
  async triggerStreakReminders() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    // 어제 활동했지만 오늘은 아직 활동 0 인 사용자들
    const candidates = await this.prisma.dailyActivity.findMany({
      where: { date: yesterday, intensity: { gt: 0 } },
      select: { userId: true },
    });
    const todayDone = await this.prisma.dailyActivity.findMany({
      where: { date: today, intensity: { gt: 0 } },
      select: { userId: true },
    });
    const todaySet = new Set(todayDone.map((a) => a.userId));
    const targetUserIds = candidates.map((c) => c.userId).filter((id) => !todaySet.has(id));

    let total = 0;
    for (const userId of targetUserIds) {
      const r = await this.sendToUser(userId, {
        title: 'Keep your streak alive 🔥',
        body: "Just one problem today keeps your learning streak going.",
        data: { type: 'streak.reminder' },
      });
      total += r.sent;
    }
    this.logger.log(`triggerStreakReminders: ${targetUserIds.length} users, ${total} sent`);
    return { targets: targetUserIds.length, sent: total };
  }

  /**
   * SM-2 due reminder — 복습 만기 오답이 있는 사용자에게 푸시.
   */
  async triggerDueWrongNotes() {
    const now = new Date();
    const due = await this.prisma.wrongNote.groupBy({
      by: ['userId'],
      where: { status: { not: 'MASTERED' }, nextReviewAt: { lte: now } },
      _count: true,
    });
    let total = 0;
    for (const d of due) {
      const r = await this.sendToUser(d.userId, {
        title: 'Time to revise',
        body: `${d._count} wrong note${d._count > 1 ? 's are' : ' is'} due for review.`,
        data: { type: 'wrongnote.due', count: String(d._count) },
      });
      total += r.sent;
    }
    this.logger.log(`triggerDueWrongNotes: ${due.length} users, ${total} sent`);
    return { targets: due.length, sent: total };
  }

  /** 단일 사용자의 모든 활성 토큰에 송신. 토큰별 결과 반환. */
  async sendToUser(userId: string, payload: { title: string; body: string; data?: Record<string, string> }) {
    if (!this.app) {
      this.logger.debug(`[noop] sendToUser ${userId}: ${payload.title}`);
      return { sent: 0, failed: 0, disabled: 0 };
    }
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId, disabledAt: null },
      select: { id: true, token: true },
    });
    if (tokens.length === 0) return { sent: 0, failed: 0, disabled: 0 };

    let sent = 0, failed = 0, disabled = 0;
    for (const t of tokens) {
      try {
        await this.app.messaging().send({
          token: t.token,
          notification: { title: payload.title, body: payload.body },
          data: payload.data,
        });
        sent++;
        await this.prisma.deviceToken.update({
          where: { id: t.id }, data: { lastSentAt: new Date() },
        });
      } catch (e: any) {
        failed++;
        const code = e?.errorInfo?.code ?? '';
        // 영구 무효 토큰은 비활성화
        if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
          await this.prisma.deviceToken.update({
            where: { id: t.id }, data: { disabledAt: new Date() },
          });
          disabled++;
        }
        this.logger.warn(`fcm send failed ${t.token.slice(0, 12)}…: ${code}`);
      }
    }
    return { sent, failed, disabled };
  }
}

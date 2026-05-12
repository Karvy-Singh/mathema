import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/**
 * 과거 시드(seed.ts)가 만들어둔 가짜 사용자 누적 데이터를 자동 청소.
 *
 * 배경:
 *   초기 PoC 단계에서 시드 사용자(polopot123@gmail.com)의 attempts 250건,
 *   wrongNote 6건, MasterySnapshot 5단원, DailyActivity 84일, MockExamResult
 *   6건, WeeklyReport 8주를 미리 만들어 두었었다. 시드를 지금 빈 사용자로
 *   바꿨지만 기존 dev DB에는 가짜 누적 데이터가 그대로 남아 있어 사용자가
 *   화면에서 환각 데이터를 본다.
 *
 * 정책:
 *   - production 에서는 절대 실행 X (NODE_ENV === 'production' → skip).
 *   - 시드 이메일 (`SEED_USER_EMAIL`, 기본 polopot123@gmail.com) 의 누적
 *     데이터만 청소. 다른 사용자에게 영향 없음.
 *   - 1회용 마커 (`SeedCleanup_v1` 키) 를 두어 한 번만 실행. 그 후엔 no-op.
 *   - 시스템 콘텐츠 (Unit / Problem / MockExam 정의) 는 절대 건드리지 않는다.
 *
 * Opt-out:
 *   환경 변수 `SKIP_LEGACY_CLEANUP=1` 이면 실행하지 않는다.
 */
@Injectable()
export class LegacySeedCleanupBootstrap implements OnModuleInit {
  private readonly logger = new Logger(LegacySeedCleanupBootstrap.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'production') return;
    if (process.env.SKIP_LEGACY_CLEANUP === '1') return;

    // 비동기 — 부팅 차단 X.
    setImmediate(() => {
      this.cleanup().catch((err) => {
        this.logger.warn(`Legacy seed cleanup failed: ${(err as Error).message}`);
      });
    });
  }

  private async cleanup(): Promise<void> {
    const seedEmail = process.env.SEED_USER_EMAIL ?? 'polopot123@gmail.com';
    const user = await this.prisma.user.findUnique({ where: { email: seedEmail } });
    if (!user) return;   // 시드 사용자 없으면 청소할 것 없음

    // 1회 실행 가드 — User 의 createdAt 을 기준으로 marker 키 저장. 가장 단순:
    // AnalyticsEvent 에 한 row 를 marker 로 사용.
    const marker = await this.prisma.analyticsEvent.findFirst({
      where: { userId: user.id, eventType: 'legacy_seed_cleanup_v1' },
    });
    if (marker) return;

    // 청소 — 사용자 누적 데이터만. 콘텐츠는 건드리지 않는다.
    const [a, w, d, m, mr, wr, cp] = await this.prisma.$transaction([
      this.prisma.attempt.deleteMany({ where: { userId: user.id } }),
      this.prisma.wrongNote.deleteMany({ where: { userId: user.id } }),
      this.prisma.dailyActivity.deleteMany({ where: { userId: user.id } }),
      this.prisma.masterySnapshot.deleteMany({ where: { userId: user.id } }),
      this.prisma.mockExamResult.deleteMany({ where: { userId: user.id } }),
      this.prisma.weeklyReport.deleteMany({ where: { userId: user.id } }),
      this.prisma.conceptProgress.deleteMany({ where: { userId: user.id } }),
    ]);

    // marker 기록 — 같은 user 에 두 번 실행 안 됨.
    await this.prisma.analyticsEvent.create({
      data: {
        userId: user.id,
        eventType: 'legacy_seed_cleanup_v1',
        payload: { attempts: a.count, wrongNotes: w.count, activities: d.count, masteries: m.count, mockResults: mr.count, weeklyReports: wr.count, conceptProgress: cp.count },
        source: 'backend',
      },
    });

    this.logger.log(
      `Legacy seed cleanup for ${seedEmail}: ` +
      `${a.count} attempts, ${w.count} wrong-notes, ${d.count} activities, ` +
      `${m.count} masteries, ${mr.count} mock-results, ${wr.count} weekly-reports, ${cp.count} concept-progress.`,
    );
  }
}

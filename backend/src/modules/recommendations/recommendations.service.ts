import { Injectable, Logger } from '@nestjs/common';
import { FocusOnMistakesStrategy } from './strategies/focus-on-mistakes.strategy';
import { ReinforceWeaknessStrategy } from './strategies/reinforce-weakness.strategy';
import { MaintainStrengthStrategy } from './strategies/maintain-strength.strategy';
import { Lang } from '../../common/i18n/current-lang.decorator';
import { StudyBalanceService } from './services/study-balance.service';
import { generateAdaptivePlan, AdaptivePlan } from '../../infrastructure/ai/langchain/chains/adaptive-recommendation.chain';

/**
 * 대시보드 "오늘의 맞춤 학습" 카드 — 데이터가 있을 때만 실제 카드 반환.
 *
 * 전략 (순서대로 실행하며 중복 단원 회피):
 *   1) focus-on-mistakes  — 누적 오답 최다 단원
 *   2) reinforce-weakness — 숙련도 최저 단원 (1번 단원 제외)
 *   3) maintain-strength  — 숙련도 최상위 단원 (1·2번 단원 제외)
 *
 * 어떤 전략이 null 을 반환하면 그 카드는 생략된다 (가짜 카드로 채우지 않음).
 * 빈 배열을 받으면 frontend 가 empty state 를 노출.
 */
@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private readonly focus: FocusOnMistakesStrategy,
    private readonly reinforce: ReinforceWeaknessStrategy,
    private readonly maintain: MaintainStrengthStrategy,
    private readonly balance: StudyBalanceService,
  ) {}

  /** 단원별 공부 시간 균형 분석 — Weakness Dashboard 의 데이터 원천. */
  balanceAnalysis(userId: string, lang: Lang = 'en') {
    return this.balance.analyze(userId, lang);
  }

  /**
   * LangChain adaptive plan — weakness + 시간균형 동시 고려한 오늘 학습 플랜.
   * LLM 호출 → 2~5초 소요. 실패 시 휴리스틱 fallback (`today()` 결과 변환).
   */
  async adaptivePlan(userId: string, lang: Lang = 'en', availableMinutes = 45): Promise<AdaptivePlan | { fallback: true; cards: any[] }> {
    const balance = await this.balance.analyze(userId, lang);
    const weakUnits = balance.perUnit
      .filter((u) => u.samples >= 3)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map((u) => ({ name: u.unitName, score: u.score, studyTimeMin: u.studyTimeMin }));

    if (weakUnits.length === 0) {
      // 데이터 부족 — 휴리스틱 카드(실데이터 only) 반환. 빈 배열이면 empty state.
      const cards = await this.today(userId, lang);
      return { fallback: true, cards };
    }

    try {
      return await generateAdaptivePlan({
        lang,
        weakUnits,
        balance: {
          gini: balance.gini,
          underStudied: balance.underStudied.map((u) => ({ unitName: u.unitName, score: u.score, studyTimeMin: u.studyTimeMin })),
          lowEfficiency: balance.lowEfficiency.map((u) => ({ unitName: u.unitName, score: u.score, studyTimeMin: u.studyTimeMin })),
        },
        availableMinutes,
      });
    } catch (err) {
      this.logger.warn(`adaptive chain failed → fallback: ${(err as Error).message}`);
      const cards = await this.today(userId, lang);
      return { fallback: true, cards };
    }
  }

  /**
   * 오늘의 추천 카드 — 데이터 있는 만큼만 반환 (최대 3, 최소 0).
   * frontend 는 length 로 empty state 분기.
   */
  async today(userId: string, lang: Lang = 'ko') {
    const exclude: string[] = [];
    const cards: any[] = [];

    const c1 = await this.focus.recommend(userId, lang);
    if (c1) { cards.push(c1); if (c1.unitId) exclude.push(c1.unitId); }

    const c2 = await this.reinforce.recommend(userId, exclude, lang);
    if (c2) { cards.push(c2); if (c2.unitId) exclude.push(c2.unitId); }

    const c3 = await this.maintain.recommend(userId, exclude, lang);
    if (c3) cards.push(c3);

    return cards;
  }
}

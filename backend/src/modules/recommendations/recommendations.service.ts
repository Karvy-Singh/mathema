import { Injectable, Logger } from '@nestjs/common';
import { FocusOnMistakesStrategy } from './strategies/focus-on-mistakes.strategy';
import { ReinforceWeaknessStrategy } from './strategies/reinforce-weakness.strategy';
import { MaintainStrengthStrategy } from './strategies/maintain-strength.strategy';
import { Lang } from '../../common/i18n/current-lang.decorator';
import { RECOMMENDATION_EN } from '../../common/i18n/content-en';
import { RECOMMENDATION_HI } from '../../common/i18n/content-hi';
import { StudyBalanceService } from './services/study-balance.service';
import { generateAdaptivePlan, AdaptivePlan } from '../../infrastructure/ai/langchain/chains/adaptive-recommendation.chain';

/**
 * 대시보드 "오늘의 맞춤 학습" 카드 3장 동적 구성.
 *
 * 전략 (순서대로 실행하며 중복 단원 회피):
 *   1) focus-on-mistakes  — 누적 오답 최다 단원
 *   2) reinforce-weakness — 숙련도 최저 단원 (1번 단원 제외)
 *   3) maintain-strength  — 숙련도 최상위 단원 (1·2번 단원 제외)
 *
 * 어떤 전략이 null을 반환하면 (데이터 부족) 대체 카드로 채움.
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
      // 데이터 부족 — 기존 휴리스틱 카드 fallback
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

  async today(userId: string, lang: Lang = 'ko') {
    const exclude: string[] = [];
    const cards: any[] = [];

    const c1 = await this.focus.recommend(userId, lang);
    if (c1) { cards.push(c1); if (c1.unitId) exclude.push(c1.unitId); }

    const c2 = await this.reinforce.recommend(userId, exclude, lang);
    if (c2) { cards.push(c2); if (c2.unitId) exclude.push(c2.unitId); }

    const c3 = await this.maintain.recommend(userId, exclude, lang);
    if (c3) cards.push(c3);

    while (cards.length < 3) cards.push(this.fallbackCard(cards.length, lang));
    return cards;
  }

  private fallbackCard(idx: number, lang: Lang = 'ko') {
    if (lang !== 'ko') {
      const D = lang === 'hi' ? RECOMMENDATION_HI : RECOMMENDATION_EN;
      const cards = [
        { tag: D.tagFocus, tagColor: '#8B3A1F', unitId: null, unit: D.fbFocusUnit, title: D.fbFocusTitle, reason: D.fbFocusReason, time: '—', type: lang === 'hi' ? 'इंटरैक्टिव अभ्यास' : 'Interactive practice', icon: 'Layers' },
        { tag: D.tagWeak, tagColor: '#B45309', unitId: null, unit: D.fbWeakUnit, title: D.fbWeakTitle, reason: D.fbWeakReason, time: lang === 'hi' ? '20 मिनट' : '20 min', type: lang === 'hi' ? 'दृश्यांकन' : 'Visualization', icon: 'Eye' },
        { tag: D.tagStrong, tagColor: '#4A5D3A', unitId: null, unit: D.fbStrongUnit, title: D.fbStrongTitle, reason: D.fbStrongReason, time: '—', type: lang === 'hi' ? 'अभ्यास' : 'Practice', icon: 'Zap' },
      ];
      return cards[idx];
    }
    const ko = [
      { tag: '오답 집중', tagColor: '#8B3A1F', unitId: null, unit: '데이터 누적 중 · —', title: '문제를 풀어 오답을 모아주세요', reason: 'AI가 약점을 찾으려면 5문제 이상 필요', time: '—', type: '인터랙티브 학습', icon: 'Layers' },
      { tag: '약점 보강', tagColor: '#B45309', unitId: null, unit: '데이터 누적 중 · —', title: '단원별 진단 모의고사 응시', reason: '숙련도 측정을 위해 진단 시험 권장', time: '20분', type: '시각화 영상', icon: 'Eye' },
      { tag: '강점 유지', tagColor: '#4A5D3A', unitId: null, unit: '데이터 누적 중 · —', title: '강점 단원을 발견해보세요', reason: '70% 이상 숙련도 단원이 생기면 노출', time: '—', type: '실전 문제', icon: 'Zap' },
    ];
    return ko[idx];
  }
}

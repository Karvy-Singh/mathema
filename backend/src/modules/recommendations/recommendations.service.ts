import { Injectable } from '@nestjs/common';
import { FocusOnMistakesStrategy } from './strategies/focus-on-mistakes.strategy';
import { ReinforceWeaknessStrategy } from './strategies/reinforce-weakness.strategy';
import { MaintainStrengthStrategy } from './strategies/maintain-strength.strategy';

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
  constructor(
    private readonly focus: FocusOnMistakesStrategy,
    private readonly reinforce: ReinforceWeaknessStrategy,
    private readonly maintain: MaintainStrengthStrategy,
  ) {}

  async today(userId: string) {
    const exclude: string[] = [];
    const cards: any[] = [];

    const c1 = await this.focus.recommend(userId);
    if (c1) { cards.push(c1); if (c1.unitId) exclude.push(c1.unitId); }

    const c2 = await this.reinforce.recommend(userId, exclude);
    if (c2) { cards.push(c2); if (c2.unitId) exclude.push(c2.unitId); }

    const c3 = await this.maintain.recommend(userId, exclude);
    if (c3) cards.push(c3);

    // 데이터 부족 시 친절한 fallback (사용자가 빈 화면을 보지 않도록)
    while (cards.length < 3) cards.push(this.fallbackCard(cards.length));

    return cards;
  }

  private fallbackCard(idx: number) {
    const presets = [
      { tag: '오답 집중', tagColor: '#8B3A1F', unitId: null, unit: '데이터 누적 중 · —', title: '문제를 풀어 오답을 모아주세요', reason: 'AI가 약점을 찾으려면 5문제 이상 필요', time: '—', type: '인터랙티브 학습', icon: 'Layers' },
      { tag: '약점 보강', tagColor: '#B45309', unitId: null, unit: '데이터 누적 중 · —', title: '단원별 진단 모의고사 응시', reason: '숙련도 측정을 위해 진단 시험 권장', time: '20분', type: '시각화 영상', icon: 'Eye' },
      { tag: '강점 유지', tagColor: '#4A5D3A', unitId: null, unit: '데이터 누적 중 · —', title: '강점 단원을 발견해보세요', reason: '70% 이상 숙련도 단원이 생기면 노출', time: '—', type: '실전 문제', icon: 'Zap' },
    ];
    return presets[idx];
  }
}

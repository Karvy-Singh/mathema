import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ERROR_TYPE_LABEL_KO } from '../../common/enums/error-type.enum';
import { Lang } from '../../common/i18n/current-lang.decorator';
import { AI_COACH_EN, ERROR_TYPE_EN, UNIT_NAME_EN, SUB_UNIT_NAME_EN } from '../../common/i18n/content-en';

/**
 * AI 코치 — 사용자 데이터 기반 결정론적 텍스트 생성. KO/EN 분기.
 */
@Injectable()
export class AiCoachService {
  constructor(private readonly prisma: PrismaService) {}

  async diagnosis(userId: string, lang: Lang = 'ko') {
    const weakest = await this.prisma.masterySnapshot.findFirst({
      where: { userId }, orderBy: { score: 'asc' }, include: { unit: true },
    });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayAct = await this.prisma.dailyActivity.findUnique({
      where: { userId_date: { userId, date: today } },
    });
    const remainingMin = Math.max(0, 180 - (todayAct?.durationMin ?? 0));

    const weakScore = Math.round(weakest?.score ?? 0);
    const recoverable = Math.min(12, Math.max(2, Math.round((100 - weakScore) / 6)));
    const weakUnitDisplay = weakest
      ? (lang === 'en' ? (UNIT_NAME_EN[weakest.unit.name] ?? weakest.unit.name) : weakest.unit.name)
      : null;

    let headline: string;
    if (lang === 'en') {
      if (!weakest) headline = AI_COACH_EN.diagnosis.headlineNoData;
      else if (remainingMin === 0) headline = AI_COACH_EN.diagnosis.headlineGoalDone(weakUnitDisplay!, recoverable);
      else headline = AI_COACH_EN.diagnosis.headlineActive(remainingMin, weakUnitDisplay!, recoverable);
    } else {
      if (!weakest) headline = `학습 데이터를 모으는 중이에요. 첫 학습 세션을 시작해보세요`;
      else if (remainingMin === 0) headline = `오늘 목표를 달성했어요. ${weakest.unit.name} 약점 보강으로 +${recoverable}점 추가 가능`;
      else headline = `오늘 ${remainingMin}분만 더 투자하면 ${weakest.unit.name}에서 ${recoverable}점을 회복할 수 있어요`;
    }

    return {
      headline,
      weakUnit: weakUnitDisplay,
      weakScore,
      version: 'v2.4.1',
      updatedAgo: weakest ? this.formatAgo(weakest.updatedAt, lang) : (lang === 'en' ? 'just now' : '방금'),
    };
  }

  async errorDna(userId: string, lang: Lang = 'ko') {
    const since = new Date(); since.setDate(since.getDate() - 30);
    const rows = await this.prisma.wrongNote.groupBy({
      by: ['errorType'],
      where: { userId, createdAt: { gte: since } },
      _count: true,
    });
    const total = rows.reduce((s, r) => s + r._count, 0) || 1;
    const COLORS: Record<string, string> = {
      CONCEPT_MISUNDERSTANDING: '#8B3A1F',
      CALCULATION_MISTAKE: '#B5552B',
      TIME_SHORTAGE: '#C97B4A',
      OTHER: '#A89684',
    };
    const distribution = (['CONCEPT_MISUNDERSTANDING', 'CALCULATION_MISTAKE', 'TIME_SHORTAGE', 'OTHER'] as const).map((k) => {
      const found = rows.find((r) => r.errorType === k);
      return {
        key: k,
        name: lang === 'en' ? ERROR_TYPE_EN[k] : ERROR_TYPE_LABEL_KO[k as keyof typeof ERROR_TYPE_LABEL_KO],
        value: Math.round(((found?._count ?? 0) / total) * 100),
        color: COLORS[k],
      };
    });
    const top = [...distribution].sort((a, b) => b.value - a.value)[0];

    return {
      distribution,
      insight: this.buildErrorDnaInsight(top, total, lang),
    };
  }

  private buildErrorDnaInsight(top: { key: string; name: string; value: number }, total: number, lang: Lang): string {
    if (lang === 'en') {
      if (total < 3) return AI_COACH_EN.errorDna.insufficient;
      const r = AI_COACH_EN.errorDna.advice[top.key as keyof typeof AI_COACH_EN.errorDna.advice]
        ?? AI_COACH_EN.errorDna.advice.OTHER;
      return AI_COACH_EN.errorDna.insightTpl(top.name, top.value, r.advice, r.expected);
    }
    if (total < 3) return '아직 분석할 오답 데이터가 부족합니다. 5문제 이상 풀고 다시 확인해주세요.';
    const RX: Record<string, { advice: string; expected: string }> = {
      CONCEPT_MISUNDERSTANDING: {
        advice: '개념 재구조화 — 정의·정리를 직접 종이에 다시 쓰고, 비슷한 유형 5문제를 풀어 적용 영역을 확장',
        expected: '2주 안에 정답률 +12%',
      },
      CALCULATION_MISTAKE: {
        advice: '단계별 풀이 검증 — 풀이 중간에 부호/지수/대입을 한 번씩 체크하는 습관 + 시간 압박 없는 환경에서 정확도 훈련',
        expected: '1주 안에 계산 오답 -40%',
      },
      TIME_SHORTAGE: {
        advice: '표준 풀이 패턴 암기 + 실전 타이머 훈련 — 30번 류 문제의 standard approach를 5개 정착시킨 후 기출 응용',
        expected: '3주 안에 30번 풀이시간 -25%',
      },
      OTHER: { advice: '오답 5건 이상 누적 시 카테고리 분석 권장', expected: '체크리스트 기반 디버깅' },
    };
    const r = RX[top.key] ?? RX.OTHER;
    return `${top.name}가 ${top.value}%로 가장 높아요. 추천 처방: ${r.advice}. 예상 효과: ${r.expected}.`;
  }

  async patterns(userId: string, lang: Lang = 'ko') {
    const since = new Date(); since.setDate(since.getDate() - 30);

    const wrongChoiceAttempts = await this.prisma.attempt.findMany({
      where: { userId, isCorrect: false, choiceId: { not: null }, createdAt: { gte: since } },
      include: {
        choice: { include: { step: true } },
        problem: { include: { unit: true, subUnit: true } },
      },
    });

    if (wrongChoiceAttempts.length >= 3) {
      type DBucket = {
        count: number; distractorType: string; stepType: string;
        unitName: string; subUnitNames: Set<string>;
      };
      const dBuckets = new Map<string, DBucket>();
      for (const a of wrongChoiceAttempts) {
        if (!a.choice?.distractorType || !a.choice.step) continue;
        const key = a.choice.distractorType + '::' + a.choice.step.stepType + '::' + a.problem.unit.name;
        const cur = dBuckets.get(key);
        if (cur) {
          cur.count += 1;
          if (a.problem.subUnit?.name) cur.subUnitNames.add(a.problem.subUnit.name);
        } else {
          dBuckets.set(key, {
            count: 1,
            distractorType: a.choice.distractorType,
            stepType: a.choice.step.stepType,
            unitName: a.problem.unit.name,
            subUnitNames: new Set<string>(a.problem.subUnit?.name ? [a.problem.subUnit.name] : []),
          });
        }
      }
      const top3 = [...dBuckets.values()].sort((a, b) => b.count - a.count).slice(0, 3);
      if (top3.length > 0) {
        return top3.map((b, i) => ({
          num: String(i + 1).padStart(2, '0'),
          title: this.distractorTitle(b, lang),
          desc: this.distractorDesc(b, lang),
          count: b.count,
        }));
      }
    }

    const notes = await this.prisma.wrongNote.findMany({
      where: { userId },
      include: { problem: { include: { unit: true, subUnit: true } } },
    });

    if (notes.length === 0) {
      return [{
        num: '01',
        title: lang === 'en' ? AI_COACH_EN.patterns.emptyTitle : '데이터 누적 중',
        desc: lang === 'en' ? AI_COACH_EN.patterns.emptyDesc : '오답이 누적되면 AI가 패턴을 자동 분석합니다 (5건 이상 권장).',
        count: 0,
      }];
    }

    type Bucket = { count: number; errorType: string; unitName: string; subUnitNames: Set<string> };
    const buckets = new Map<string, Bucket>();
    for (const n of notes) {
      const key = n.errorType + '::' + n.problem.unit.name;
      const cur = buckets.get(key);
      if (cur) {
        cur.count += n.occurrences;
        if (n.problem.subUnit?.name) cur.subUnitNames.add(n.problem.subUnit.name);
      } else {
        buckets.set(key, {
          count: n.occurrences,
          errorType: n.errorType,
          unitName: n.problem.unit.name,
          subUnitNames: new Set<string>(n.problem.subUnit?.name ? [n.problem.subUnit.name] : []),
        });
      }
    }

    const top3 = [...buckets.values()].sort((a, b) => b.count - a.count).slice(0, 3);
    return top3.map((b, i) => ({
      num: String(i + 1).padStart(2, '0'),
      title: this.patternTitle(b, lang),
      desc: this.patternDesc(b, lang),
      count: b.count,
    }));
  }

  private localUnit(name: string, lang: Lang) {
    return lang === 'en' ? (UNIT_NAME_EN[name] ?? name) : name;
  }
  private localSub(name: string, lang: Lang) {
    return lang === 'en' ? (SUB_UNIT_NAME_EN[name] ?? name) : name;
  }

  private distractorTitle(b: { distractorType: string; stepType: string; unitName: string; subUnitNames: Set<string> }, lang: Lang): string {
    const subs = [...b.subUnitNames].map((s) => this.localSub(s, lang));
    const subLabel = subs.length === 1 ? ` · ${subs[0]}` : subs.length > 1
      ? (lang === 'en' ? ` (${subs.length} areas)` : ` (${subs.length}개 영역)`)
      : '';
    const unit = this.localUnit(b.unitName, lang);
    if (lang === 'en') {
      const stepLabel = AI_COACH_EN.patterns.stepLabel[b.stepType as keyof typeof AI_COACH_EN.patterns.stepLabel] ?? 'solving';
      const dtTitle = AI_COACH_EN.patterns.distractorTitle[b.distractorType as keyof typeof AI_COACH_EN.patterns.distractorTitle] ?? 'wrong choice';
      return `${unit}${subLabel} — "${dtTitle}" at ${stepLabel}`;
    }
    const STEP_LABEL: Record<string, string> = { CONCEPT: '개념 선택', PROCESS: '풀이 과정', ANSWER: '최종 답' };
    const DT_TITLE: Record<string, string> = {
      CONCEPT_CONFUSION: '다른 개념과 혼동',
      CALC_ERROR: '계산 단계 실수',
      PROCESS_SKIP: '풀이 단계 누락',
      TIME_PRESSURE_GUESS: '시간 압박 추측',
    };
    return `${unit}${subLabel} — ${STEP_LABEL[b.stepType] ?? '풀이'} 단계의 「${DT_TITLE[b.distractorType] ?? '오선택'}」`;
  }

  private distractorDesc(b: { count: number; distractorType: string; stepType: string; unitName: string; subUnitNames: Set<string> }, lang: Lang): string {
    const unit = this.localUnit(b.unitName, lang);
    if (lang === 'en') {
      const sl = AI_COACH_EN.patterns.stepLabelLong[b.stepType as keyof typeof AI_COACH_EN.patterns.stepLabelLong] ?? 'solving';
      const dd = AI_COACH_EN.patterns.distractorDesc[b.distractorType as keyof typeof AI_COACH_EN.patterns.distractorDesc] ?? 'review your approach.';
      return `${b.count}× in ${unit} at ${sl} — ${dd}`;
    }
    const STEP_LABEL: Record<string, string> = { CONCEPT: '1단계(개념 선택)', PROCESS: '2단계(풀이 과정)', ANSWER: '3단계(최종 답)' };
    const DT_DESC: Record<string, string> = {
      CONCEPT_CONFUSION: '인접 개념과 자주 혼동합니다 — 두 개념의 적용 조건을 비교 표로 정리하면 효과적입니다.',
      CALC_ERROR: '풀이 방향은 맞지만 부호/지수/대입에서 실수합니다 — 풀이 직후 즉시 한 번 검산하는 습관이 필요합니다.',
      PROCESS_SKIP: '핵심 풀이 단계를 빠뜨립니다 — 표준 풀이 템플릿을 외워 누락 단계를 체크리스트로 점검하세요.',
      TIME_PRESSURE_GUESS: '시간 압박 시 다른 문제 답이나 직관에 의지합니다 — 풀이 시간 분배 훈련과 표준 패턴 정착이 필요합니다.',
    };
    return `${unit} 단원의 ${STEP_LABEL[b.stepType] ?? '풀이'}에서 ${b.count}회 — ${DT_DESC[b.distractorType] ?? '풀이 점검 필요'}`;
  }

  private patternTitle(b: { errorType: string; unitName: string; subUnitNames: Set<string> }, lang: Lang): string {
    const subs = [...b.subUnitNames].map((s) => this.localSub(s, lang));
    const subLabel = subs.length === 1 ? ` · ${subs[0]}` : subs.length > 1
      ? (lang === 'en' ? ` (${subs.length} areas)` : ` (${subs.length}개 영역)`)
      : '';
    const unit = this.localUnit(b.unitName, lang);
    if (lang === 'en') {
      const t = AI_COACH_EN.patterns.etypeTitle[b.errorType as keyof typeof AI_COACH_EN.patterns.etypeTitle] ?? 'review needed';
      return `${unit}${subLabel} — ${t}`;
    }
    const ETYPE_TITLE: Record<string, string> = {
      CONCEPT_MISUNDERSTANDING: '개념 적용 단계 누락',
      CALCULATION_MISTAKE: '계산 오류 누적',
      TIME_SHORTAGE: '시간 압박 시 풀이 붕괴',
      OTHER: '풀이 흐름 점검 필요',
    };
    return `${unit}${subLabel} — ${ETYPE_TITLE[b.errorType] ?? '풀이 점검'}`;
  }

  private patternDesc(b: { count: number; errorType: string; unitName: string; subUnitNames: Set<string> }, lang: Lang): string {
    const unit = this.localUnit(b.unitName, lang);
    if (lang === 'en') {
      const d = AI_COACH_EN.patterns.etypeDesc[b.errorType as keyof typeof AI_COACH_EN.patterns.etypeDesc]
        ?? AI_COACH_EN.patterns.etypeDesc.OTHER;
      return `${b.count}× in ${unit} — ${d}`;
    }
    const ETYPE_DESC: Record<string, string> = {
      CONCEPT_MISUNDERSTANDING: '핵심 정의·정리 적용 단계에서 빈번히 누락하거나 잘못 적용합니다. 단원 기본 개념의 재정착이 필요합니다.',
      CALCULATION_MISTAKE: '풀이 흐름은 맞지만 부호·지수·대입 등 계산 단계에서 오류가 반복됩니다. 단계별 검증 습관이 필요합니다.',
      TIME_SHORTAGE: '난이도 높은 문항에서 시간이 부족해 풀이를 완성하지 못합니다. 표준 풀이 패턴을 정착해 처리 속도를 높여야 합니다.',
      OTHER: '복합 요인이 작용하는 패턴입니다. 풀이 과정을 처음부터 다시 점검하는 것을 권장합니다.',
    };
    return `${unit} 단원에서 ${b.count}회 누적 — ${ETYPE_DESC[b.errorType] ?? ETYPE_DESC.OTHER}`;
  }

  async mentorMessage(userId: string, week: string, lang: Lang = 'ko') {
    const r = await this.prisma.weeklyReport.findFirst({
      where: { userId }, orderBy: { weekStart: 'desc' },
    });

    if (r?.mentorMessage) {
      return {
        week: r.isoWeek,
        generatedAt: r.generatedAt,
        message: r.mentorMessage,
        strength: lang === 'en' ? AI_COACH_EN.mentor.fallbackStrength : '꾸준한 학습 패턴과 오답 복기',
        nextGoal: lang === 'en' ? AI_COACH_EN.mentor.fallbackNextGoal : '준킬러 문제의 시간 단축 훈련',
      };
    }

    const since = new Date(); since.setDate(since.getDate() - 7);
    const [attempts, masteries, weakest, strongest] = await Promise.all([
      this.prisma.attempt.findMany({ where: { userId, createdAt: { gte: since } } }),
      this.prisma.masterySnapshot.findMany({ where: { userId }, include: { unit: true } }),
      this.prisma.masterySnapshot.findFirst({ where: { userId }, orderBy: { score: 'asc' }, include: { unit: true } }),
      this.prisma.masterySnapshot.findFirst({ where: { userId }, orderBy: { score: 'desc' }, include: { unit: true } }),
    ]);

    const correctCount = attempts.filter((a) => a.isCorrect).length;
    const acc = attempts.length > 0 ? Math.round((correctCount / attempts.length) * 100) : 0;
    const avgMastery = masteries.length > 0
      ? Math.round(masteries.reduce((s, m) => s + m.score, 0) / masteries.length)
      : 0;
    const weakUnit = weakest ? this.localUnit(weakest.unit.name, lang) : (lang === 'en' ? 'your weak unit' : '약점 단원');
    const strongUnit = strongest ? this.localUnit(strongest.unit.name, lang) : (lang === 'en' ? 'your strong unit' : '강점 단원');

    let message: string;
    if (lang === 'en') {
      if (attempts.length === 0) message = AI_COACH_EN.mentor.nothingThisWeek;
      else if (acc >= 80) message = AI_COACH_EN.mentor.high(attempts.length, acc, weakUnit);
      else if (acc >= 60) message = AI_COACH_EN.mentor.mid(attempts.length, acc, strongUnit, weakUnit);
      else message = AI_COACH_EN.mentor.low(acc, weakUnit);
    } else {
      if (attempts.length === 0) message = '이번 주 학습 데이터가 비어있어요. 작은 한 걸음부터 다시 시작해봐요.';
      else if (acc >= 80) message = `이번 주 ${attempts.length}문제를 풀고 정답률 ${acc}%를 유지했어요. 정확도가 안정 구간에 들어섰으니, ${weakUnit} 보강에 시간을 더 투자하면 등급 상승 폭이 커집니다.`;
      else if (acc >= 60) message = `이번 주 ${attempts.length}문제 풀이, 정답률 ${acc}%. ${strongUnit}의 안정성을 유지하면서 ${weakUnit}의 풀이 패턴을 정착시키면 다음 주 정답률이 +5%p 가능합니다.`;
      else message = `이번 주 정답률 ${acc}% — 양보다 질이 필요한 시점이에요. ${weakUnit} 한 단원에 집중하고, 풀이 직후 즉시 복기하는 습관을 만들면 다음 주에 의미 있는 변화를 만들 수 있어요.`;
    }

    const strength = strongest
      ? (lang === 'en'
          ? AI_COACH_EN.mentor.strengthTpl(strongUnit, Math.round(strongest.score))
          : `${strongest.unit.name} 안정 (숙련도 ${Math.round(strongest.score)}%)`)
      : (lang === 'en' ? AI_COACH_EN.mentor.dataAccumulating : '데이터 누적 중');
    const nextGoal = weakest
      ? (lang === 'en'
          ? AI_COACH_EN.mentor.nextGoalTpl(weakUnit, Math.round(weakest.score), Math.min(95, Math.round(weakest.score) + 10))
          : `${weakest.unit.name} 숙련도 ${Math.round(weakest.score)}% → ${Math.min(95, Math.round(weakest.score) + 10)}% 도달`)
      : (lang === 'en' ? AI_COACH_EN.mentor.nextGoalNoMastery(avgMastery) : `평균 숙련도 ${avgMastery}% 유지`);

    return {
      week: r?.isoWeek ?? week,
      generatedAt: r?.generatedAt ?? new Date(),
      message,
      strength,
      nextGoal,
    };
  }

  private formatAgo(d: Date, lang: Lang): string {
    const diffMs = Date.now() - new Date(d).getTime();
    const m = Math.floor(diffMs / 60000);
    if (lang === 'en') {
      if (m < 1) return 'just now';
      if (m < 60) return `${m} min ago`;
      const h = Math.floor(m / 60);
      if (h < 24) return `${h} h ago`;
      return `${Math.floor(h / 24)} d ago`;
    }
    if (m < 1) return '방금';
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    return `${Math.floor(h / 24)}일 전`;
  }
}

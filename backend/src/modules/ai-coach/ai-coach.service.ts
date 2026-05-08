import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { ERROR_TYPE_LABEL_KO } from '../../common/enums/error-type.enum';

/**
 * AI 코치 — 사용자 데이터 기반 결정론적 텍스트 생성.
 *
 * LLM 키 미설정 상태에서도 의미 있는 개인화된 메시지 출력.
 * 키 설정 시 동일 함수 시그니처 유지하며 LLM 호출로 교체 가능.
 */
@Injectable()
export class AiCoachService {
  constructor(private readonly prisma: PrismaService) {}

  /** 대시보드 상단 진단 메시지 — 사용자 데이터 기반 */
  async diagnosis(userId: string) {
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

    let headline: string;
    if (!weakest) {
      headline = `학습 데이터를 모으는 중이에요. 첫 학습 세션을 시작해보세요`;
    } else if (remainingMin === 0) {
      headline = `오늘 목표를 달성했어요. ${weakest.unit.name} 약점 보강으로 +${recoverable}점 추가 가능`;
    } else {
      headline = `오늘 ${remainingMin}분만 더 투자하면 ${weakest.unit.name}에서 ${recoverable}점을 회복할 수 있어요`;
    }

    return {
      headline,
      weakUnit: weakest?.unit.name ?? null,
      weakScore,
      version: 'v2.4.1',
      updatedAgo: weakest ? this.formatAgo(weakest.updatedAt) : '방금',
    };
  }

  /** Error DNA — 최근 30일 오답 유형 분포 + 유형별 맞춤 처방 */
  async errorDna(userId: string) {
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
        name: ERROR_TYPE_LABEL_KO[k as keyof typeof ERROR_TYPE_LABEL_KO],
        value: Math.round(((found?._count ?? 0) / total) * 100),
        color: COLORS[k],
      };
    });
    const top = [...distribution].sort((a, b) => b.value - a.value)[0];

    return {
      distribution,
      insight: this.buildErrorDnaInsight(top, total),
    };
  }

  private buildErrorDnaInsight(top: { key: string; name: string; value: number }, total: number): string {
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
      OTHER: {
        advice: '오답 5건 이상 누적 시 카테고리 분석 권장',
        expected: '체크리스트 기반 디버깅',
      },
    };
    const r = RX[top.key] ?? RX.OTHER;
    return `${top.name}가 ${top.value}%로 가장 높아요. 추천 처방: ${r.advice}. 예상 효과: ${r.expected}.`;
  }

  /**
   * 오답 패턴 — distractor(매력적 오답) 데이터 기반 상위 3개 패턴.
   *
   * 우선순위 1: 최근 30일의 객관식 오답 attempts에서 (distractorType × stepType × 단원) 그룹
   *   → "어떤 단계에서 어떤 종류의 오답을 가장 많이 골랐는가" 추적
   * 우선순위 2 (fallback): 객관식 데이터가 부족하면 기존 WrongNote 기반 (errorType × 단원)
   */
  async patterns(userId: string) {
    const since = new Date(); since.setDate(since.getDate() - 30);

    // 객관식 매력적 오답 분석
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
          title: this.distractorTitle(b),
          desc: this.distractorDesc(b),
          count: b.count,
        }));
      }
    }

    // Fallback: WrongNote 기반
    const notes = await this.prisma.wrongNote.findMany({
      where: { userId },
      include: { problem: { include: { unit: true, subUnit: true } } },
    });

    if (notes.length === 0) {
      return [
        { num: '01', title: '데이터 누적 중', desc: '오답이 누적되면 AI가 패턴을 자동 분석합니다 (5건 이상 권장).', count: 0 },
      ];
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
      title: this.patternTitle(b),
      desc: this.patternDesc(b),
      count: b.count,
    }));
  }

  private distractorTitle(b: { distractorType: string; stepType: string; unitName: string; subUnitNames: Set<string> }): string {
    const subs = [...b.subUnitNames];
    const subLabel = subs.length === 1 ? ` · ${subs[0]}` : subs.length > 1 ? ` (${subs.length}개 영역)` : '';
    const STEP_LABEL: Record<string, string> = {
      CONCEPT: '개념 선택', PROCESS: '풀이 과정', ANSWER: '최종 답',
    };
    const DT_TITLE: Record<string, string> = {
      CONCEPT_CONFUSION: '다른 개념과 혼동',
      CALC_ERROR: '계산 단계 실수',
      PROCESS_SKIP: '풀이 단계 누락',
      TIME_PRESSURE_GUESS: '시간 압박 추측',
    };
    return `${b.unitName}${subLabel} — ${STEP_LABEL[b.stepType] ?? '풀이'} 단계의 「${DT_TITLE[b.distractorType] ?? '오선택'}」`;
  }

  private distractorDesc(b: { count: number; distractorType: string; stepType: string; unitName: string; subUnitNames: Set<string> }): string {
    const STEP_LABEL: Record<string, string> = {
      CONCEPT: '1단계(개념 선택)', PROCESS: '2단계(풀이 과정)', ANSWER: '3단계(최종 답)',
    };
    const DT_DESC: Record<string, string> = {
      CONCEPT_CONFUSION: '인접 개념과 자주 혼동합니다 — 두 개념의 적용 조건을 비교 표로 정리하면 효과적입니다.',
      CALC_ERROR: '풀이 방향은 맞지만 부호/지수/대입에서 실수합니다 — 풀이 직후 즉시 한 번 검산하는 습관이 필요합니다.',
      PROCESS_SKIP: '핵심 풀이 단계를 빠뜨립니다 — 표준 풀이 템플릿을 외워 누락 단계를 체크리스트로 점검하세요.',
      TIME_PRESSURE_GUESS: '시간 압박 시 다른 문제 답이나 직관에 의지합니다 — 풀이 시간 분배 훈련과 표준 패턴 정착이 필요합니다.',
    };
    return `${b.unitName} 단원의 ${STEP_LABEL[b.stepType] ?? '풀이'}에서 ${b.count}회 — ${DT_DESC[b.distractorType] ?? '풀이 점검 필요'}`;
  }

  private patternTitle(b: { errorType: string; unitName: string; subUnitNames: Set<string> }): string {
    const subs = [...b.subUnitNames];
    const subLabel = subs.length === 1 ? ` · ${subs[0]}` : subs.length > 1 ? ` (${subs.length}개 영역)` : '';
    const ETYPE_TITLE: Record<string, string> = {
      CONCEPT_MISUNDERSTANDING: '개념 적용 단계 누락',
      CALCULATION_MISTAKE: '계산 오류 누적',
      TIME_SHORTAGE: '시간 압박 시 풀이 붕괴',
      OTHER: '풀이 흐름 점검 필요',
    };
    return `${b.unitName}${subLabel} — ${ETYPE_TITLE[b.errorType] ?? '풀이 점검'}`;
  }

  private patternDesc(b: { count: number; errorType: string; unitName: string; subUnitNames: Set<string> }): string {
    const ETYPE_DESC: Record<string, string> = {
      CONCEPT_MISUNDERSTANDING: '핵심 정의·정리 적용 단계에서 빈번히 누락하거나 잘못 적용합니다. 단원 기본 개념의 재정착이 필요합니다.',
      CALCULATION_MISTAKE: '풀이 흐름은 맞지만 부호·지수·대입 등 계산 단계에서 오류가 반복됩니다. 단계별 검증 습관이 필요합니다.',
      TIME_SHORTAGE: '난이도 높은 문항에서 시간이 부족해 풀이를 완성하지 못합니다. 표준 풀이 패턴을 정착해 처리 속도를 높여야 합니다.',
      OTHER: '복합 요인이 작용하는 패턴입니다. 풀이 과정을 처음부터 다시 점검하는 것을 권장합니다.',
    };
    return `${b.unitName} 단원에서 ${b.count}회 누적 — ${ETYPE_DESC[b.errorType] ?? ETYPE_DESC.OTHER}`;
  }

  /** 주간 멘토 메시지 — WeeklyReport 우선, 없으면 데이터 기반 동적 생성 */
  async mentorMessage(userId: string, week: string) {
    const r = await this.prisma.weeklyReport.findFirst({
      where: { userId }, orderBy: { weekStart: 'desc' },
    });

    if (r?.mentorMessage) {
      return {
        week: r.isoWeek,
        generatedAt: r.generatedAt,
        message: r.mentorMessage,
        strength: '꾸준한 학습 패턴과 오답 복기',
        nextGoal: '준킬러 문제의 시간 단축 훈련',
      };
    }

    // Fallback: 최근 7일 데이터 기반 동적 메시지
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

    let message: string;
    if (attempts.length === 0) {
      message = '이번 주 학습 데이터가 비어있어요. 작은 한 걸음부터 다시 시작해봐요.';
    } else if (acc >= 80) {
      message = `이번 주 ${attempts.length}문제를 풀고 정답률 ${acc}%를 유지했어요. 정확도가 안정 구간에 들어섰으니, ${weakest?.unit.name ?? '약점 단원'} 보강에 시간을 더 투자하면 등급 상승 폭이 커집니다.`;
    } else if (acc >= 60) {
      message = `이번 주 ${attempts.length}문제 풀이, 정답률 ${acc}%. ${strongest?.unit.name ?? '강점 단원'}의 안정성을 유지하면서 ${weakest?.unit.name ?? '약점 단원'}의 풀이 패턴을 정착시키면 다음 주 정답률이 +5%p 가능합니다.`;
    } else {
      message = `이번 주 정답률 ${acc}% — 양보다 질이 필요한 시점이에요. ${weakest?.unit.name ?? '약점 단원'} 한 단원에 집중하고, 풀이 직후 즉시 복기하는 습관을 만들면 다음 주에 의미 있는 변화를 만들 수 있어요.`;
    }

    return {
      week: r?.isoWeek ?? week,
      generatedAt: r?.generatedAt ?? new Date(),
      message,
      strength: strongest ? `${strongest.unit.name} 안정 (숙련도 ${Math.round(strongest.score)}%)` : '데이터 누적 중',
      nextGoal: weakest ? `${weakest.unit.name} 숙련도 ${Math.round(weakest.score)}% → ${Math.min(95, Math.round(weakest.score) + 10)}% 도달` : `평균 숙련도 ${avgMastery}% 유지`,
    };
  }

  private formatAgo(d: Date): string {
    const diffMs = Date.now() - new Date(d).getTime();
    const m = Math.floor(diffMs / 60000);
    if (m < 1) return '방금';
    if (m < 60) return `${m}분 전`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}시간 전`;
    return `${Math.floor(h / 24)}일 전`;
  }
}

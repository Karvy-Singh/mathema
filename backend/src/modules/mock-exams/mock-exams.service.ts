import { Injectable } from '@nestjs/common';
import { MockExamsRepository } from './mock-exams.repository';
import { GradingService } from './services/grading.service';
import { AiRecommendExamService } from './services/ai-recommend-exam.service';
import { SubmitExamDto } from './dto/submit-exam.dto';
import { pointsToNextGrade } from '../../common/utils/grade-calculator.util';
import { AttemptsService } from '../attempts/attempts.service';
import { SessionContext } from '../../common/enums/session-context.enum';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { Lang } from '../../common/i18n/current-lang.decorator';
import { PROBLEM_EN, STEP_PROMPT_EN, CHOICE_EN, SOURCE_EN, HINT_EN, CONCEPT_EN, FORMULA_EN } from '../../common/i18n/content-en';

/**
 * MockExam name → English short label.
 * 예: "2024 9월 모의평가" → "2024 Sep Mock", "6월 모의평가" → "Jun Mock"
 */
function translateExamName(name: string): string {
  if (!name) return name;
  let s = name;
  const monthMap: Record<string, string> = {
    '1월': 'Jan', '2월': 'Feb', '3월': 'Mar', '4월': 'Apr', '5월': 'May', '6월': 'Jun',
    '7월': 'Jul', '8월': 'Aug', '9월': 'Sep', '10월': 'Oct', '11월': 'Nov', '12월': 'Dec',
  };
  for (const [k, v] of Object.entries(monthMap)) s = s.replace(k, v);
  s = s.replace('모의평가', 'Mock').replace('학력평가', 'Practice')
       .replace('수능', 'SAT').replace('교육청', 'Edu')
       .replace(/\s+/g, ' ').trim();
  return s;
}

/**
 * 응시용 sanitize — answer/isCorrect/distractorType/rationale 제거 + lang 번역 + 보기 셔플.
 * 매 요청마다 보기 순서를 무작위로 섞어 "정답은 항상 1번" 패턴 차단.
 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function sanitizeForExam(p: any, lang: Lang = 'ko'): any {
  if (!p) return p;
  const { answer, ...rest } = p;
  if (lang !== 'ko') {
    const en = PROBLEM_EN[p.source];
    if (en) rest.body = en.body;
    if (SOURCE_EN[p.source]) rest.source = SOURCE_EN[p.source];
    if (rest.hint && HINT_EN[rest.hint]) rest.hint = HINT_EN[rest.hint];
    if (CONCEPT_EN[p.source]) rest.concept = CONCEPT_EN[p.source];
    if (FORMULA_EN[p.source]) rest.formula = FORMULA_EN[p.source];
  }
  if (Array.isArray(rest.steps)) {
    rest.steps = rest.steps.map((s: any) => {
      const promptEn = STEP_PROMPT_EN[`${p.source}:${s.stepIndex}`];
      const choices = (s.choices ?? []).map((c: any) => {
        const choiceEn = CHOICE_EN[`${p.source}:${s.stepIndex}:${c.choiceIndex}`];
        return {
          id: c.id, choiceIndex: c.choiceIndex,
          text: lang !== 'ko' && choiceEn ? choiceEn.text : c.text,
        };
      });
      return {
        id: s.id, stepIndex: s.stepIndex, stepType: s.stepType,
        prompt: lang !== 'ko' && promptEn ? promptEn : s.prompt,
        choices: shuffle(choices),
      };
    });
  }
  return rest;
}

@Injectable()
export class MockExamsService {
  constructor(
    private readonly repo: MockExamsRepository,
    private readonly grading: GradingService,
    private readonly aiRec: AiRecommendExamService,
    private readonly attempts: AttemptsService,
    private readonly prisma: PrismaService,
  ) {}

  async trajectory(userId: string, count: number, lang: Lang = 'ko') {
    const rows = await this.repo.findTrajectory(userId, count);
    // 목표선 — 사용자 targetGrade 기반 동적 환산. 가짜 고정값 80 제거.
    // 등급당 ~8점 (1등급=96, 2등급=88, 3등급=80, 4등급=72 ...)
    const user = await this.prisma.user.findUnique({
      where: { id: userId }, select: { targetGrade: true },
    });
    const target = user?.targetGrade ? Math.max(40, 100 - (user.targetGrade - 1) * 8) : null;
    return rows.map((r: any) => ({
      name: lang !== 'ko'
        ? translateExamName(r.mockExam.name)
        : r.mockExam.name.replace(/^2024\s+/, '').replace('학력평가', '학평').replace('모의평가', '모평'),
      score: r.score, grade: r.grade, target,
    }));
  }

  async recentResults(userId: string, count: number, lang: Lang = 'ko') {
    const rows = await this.repo.findRecent(userId, count);
    return rows.map((r: any) => {
      const iso = r.takenAt.toISOString().slice(0, 10);
      const dateKo = iso.replace(/-/g, '년 ').replace(/년 (\d+)$/, '년 $1월') + '일';
      return {
        id: r.id,
        name: lang !== 'ko' ? translateExamName(r.mockExam.name) : r.mockExam.name,
        date: lang !== 'ko' ? iso : dateKo,
        score: r.score, grade: r.grade, percentile: r.percentile,
        time: lang !== 'ko'
          ? `${r.durationMin}min / ${r.mockExam.totalMinutes}min`
          : `${r.durationMin}분/${r.mockExam.totalMinutes}분`,
      };
    });
  }

  async summary(userId: string) {
    // 최근 N회로 신뢰도(reliability) 계산:
    //   응시 횟수가 많을수록 ↑, 점수 표준편차가 작을수록 ↑
    //   N=0 → 0, N=1 → 60, N=4 → ~80, N=9+ → 95
    //   variance penalty: σ ≥ 10 이면 -10
    const recent = await this.repo.findRecent(userId, 10);
    const last = recent[0];
    const N = recent.length;

    let reliability = 0;
    if (N > 0) {
      const scores = recent.map((r: any) => r.score);
      const mean = scores.reduce((s: number, x: number) => s + x, 0) / N;
      const variance = scores.reduce((s: number, x: number) => s + (x - mean) ** 2, 0) / N;
      const sigma = Math.sqrt(variance);
      const base = Math.min(95, Math.round(50 + 7 * Math.sqrt(N) + (N >= 3 ? 10 : 0)));
      const penalty = sigma >= 10 ? 10 : sigma >= 5 ? 5 : 0;
      reliability = Math.max(0, base - penalty);
    }

    // 응시 0회 → 모두 null. frontend 는 null 이면 '—' 표시 (가짜 0 / 가짜 reliability 안 보임).
    return {
      lastScore:         last?.score ?? null,
      expectedGrade:     last?.grade ?? null,
      reliability:       N > 0 ? reliability : null,
      pointsToNextGrade: last ? pointsToNextGrade(last.score) : null,
      percentile:        last?.percentile ?? null,
    };
  }

  async startRecommended(userId: string, lang: Lang = 'ko') {
    const { problems } = await this.aiRec.compose(userId);
    const name = lang !== 'ko' ? 'AI-tailored Mock' : 'AI 맞춤 진단 모의고사';
    return this.beginSession(userId, { name, type: 'RECOMMENDED' as any, totalMinutes: 50, problems }, lang);
  }

  async startTyped(userId: string, kind: 'mini' | 'wrong-redo' | 'real', lang: Lang = 'ko') {
    const { problems } = await this.aiRec.composeTyped(userId, kind);
    const metaKo: Record<string, { name: string; type: any; totalMinutes: number }> = {
      mini:        { name: '단원별 미니 테스트',  type: 'MINI',       totalMinutes: 15 },
      'wrong-redo':{ name: '오답 재출제 시험',    type: 'WRONG_REDO', totalMinutes: 30 },
      real:        { name: '실전 모의고사',       type: 'REAL',       totalMinutes: 60 },
    };
    const metaEn: Record<string, { name: string; type: any; totalMinutes: number }> = {
      mini:        { name: 'Unit Mini Test',     type: 'MINI',       totalMinutes: 15 },
      'wrong-redo':{ name: 'Wrong-Redo Exam',    type: 'WRONG_REDO', totalMinutes: 30 },
      real:        { name: 'Full Mock Exam',     type: 'REAL',       totalMinutes: 60 },
    };
    const m = (lang !== 'ko' ? metaEn : metaKo)[kind];
    return this.beginSession(userId, { ...m, problems }, lang);
  }

  private async beginSession(userId: string, p: {
    name: string; type: any; totalMinutes: number;
    problems: Array<{ id: string; source: string; difficulty: string }>;
  }, lang: Lang = 'ko') {
    if (!p.problems || p.problems.length === 0) {
      return { resultId: null, name: p.name, totalMinutes: p.totalMinutes, problems: [] };
    }
    const { result } = await this.repo.createSession(userId, {
      name: p.name, type: p.type, totalProblems: p.problems.length, totalMinutes: p.totalMinutes,
    });
    const fullProblems = await this.fetchFullProblems(p.problems.map((x) => x.id), lang);
    return {
      resultId: result.id,
      name: p.name,
      totalMinutes: p.totalMinutes,
      problems: fullProblems,
    };
  }

  private async fetchFullProblems(ids: string[], lang: Lang = 'ko') {
    if (ids.length === 0) return [];
    const ps = await this.prisma.problem.findMany({
      where: { id: { in: ids } },
      include: {
        steps: {
          orderBy: { stepIndex: 'asc' },
          include: { choices: { orderBy: { choiceIndex: 'asc' } } },
        },
      },
    });
    const byId = new Map(ps.map((p) => [p.id, p]));
    return ids
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((p: any) => sanitizeForExam(p, lang));
  }

  /**
   * 모의고사 — 학습과 같은 방식으로 per-step 제출.
   * choice를 선택하면 attempt 생성 + isCorrect/distractorType/rationale 즉시 반환.
   * 학습페이지의 study-sessions/:id/answer 와 동일한 흐름.
   */
  async submitStepAnswer(userId: string, resultId: string, dto: {
    problemId: string; choiceId: string;
    stepIndex: number; durationSec: number; confidence?: number;
  }, lang: Lang = 'ko') {
    const attempt = await this.attempts.create(userId, {
      problemId: dto.problemId,
      answer: '',
      durationSec: dto.durationSec,
      confidence: dto.confidence,
      stepIndex: dto.stepIndex,
      choiceId: dto.choiceId,
      context: SessionContext.EXAM,
      mockExamResultId: resultId,
    });
    const choice = await this.prisma.problemChoice.findUnique({
      where: { id: dto.choiceId },
      select: {
        id: true, choiceIndex: true, text: true, isCorrect: true, distractorType: true, rationale: true,
        step: { select: { stepIndex: true, problem: { select: { source: true } } } },
      },
    });
    if (choice && lang !== 'ko' && choice.step) {
      const key = `${choice.step.problem.source}:${choice.step.stepIndex}:${choice.choiceIndex}`;
      const en = CHOICE_EN[key];
      if (en) return { ...attempt, choice: { ...choice, text: en.text, rationale: en.rationale ?? null } };
    }
    return { ...attempt, choice };
  }

  /**
   * 모의고사 종료 — 저장된 attempt 들로부터 점수 산출.
   * (학습형 per-step 흐름에서 모든 문제 완료 시 호출)
   */
  async finalize(userId: string, resultId: string) {
    const result = await this.prisma.mockExamResult.findFirstOrThrow({
      where: { id: resultId, userId },
      include: { attempts: { include: { choice: true } } },
    });
    // 한 문제당 모든 단계가 정답이면 정답으로 카운트 (study mastery 와 동일 기준)
    const byProblem = new Map<string, { correctSteps: Set<number>; totalSteps: Set<number> }>();
    for (const a of result.attempts) {
      if (!a.stepIndex || !a.choice) continue;
      const cur = byProblem.get(a.problemId) ?? { correctSteps: new Set(), totalSteps: new Set() };
      cur.totalSteps.add(a.stepIndex);
      if (a.choice.isCorrect) cur.correctSteps.add(a.stepIndex);
      byProblem.set(a.problemId, cur);
    }
    let correctCount = 0;
    for (const [, v] of byProblem) {
      if (v.totalSteps.size > 0 && v.correctSteps.size === v.totalSteps.size) correctCount += 1;
    }
    const totalProblems = byProblem.size || 1;
    const score = Math.round((correctCount / totalProblems) * 100);
    const grade = score >= 96 ? 1 : score >= 88 ? 2 : score >= 78 ? 3 : score >= 65 ? 4 : score >= 50 ? 5 : 6;
    const percentile = Math.min(99, Math.max(1, score));
    const durationMin = Math.max(1, Math.round(
      result.attempts.reduce((s, a) => s + (a.durationSec ?? 0), 0) / 60,
    ));
    return this.repo.saveResult(resultId, { score, grade, percentile, durationMin });
  }

  /**
   * 모의고사 제출 (레거시 — 한 번에 모든 답안 제출).
   *   1) 각 답안을 Attempt로 저장 (context: EXAM, mockExamResultId 연결)
   *      → attempt.completed 이벤트가 mastery·activity·wrong-note 자동 갱신
   *   2) totalScore 기반 등급/백분위 계산 후 MockExamResult 업데이트
   *
   * 결과로 mastery score는 단원별로 PFA에 따라 변동, DailyActivity는 풀이수·시간 누적.
   */
  async submit(userId: string, resultId: string, dto: SubmitExamDto) {
    // 각 답안 → Attempt 생성 (이벤트 발행 → 리스너 연쇄 갱신)
    // 객관식 모드: 한 문제당 3개 choiceId → 3개 Attempt(stepIndex 1/2/3)
    // 단일 답안 모드: 1개 Attempt
    for (const a of dto.answers) {
      if (a.choiceIds && a.choiceIds.length > 0) {
        const perStepDuration = Math.max(1, Math.round(a.durationSec / a.choiceIds.length));
        for (let i = 0; i < a.choiceIds.length; i++) {
          await this.attempts.create(userId, {
            problemId: a.problemId,
            answer: '',
            durationSec: perStepDuration,
            confidence: a.confidence,
            stepIndex: i + 1,
            choiceId: a.choiceIds[i],
            context: SessionContext.EXAM,
            mockExamResultId: resultId,
          });
        }
      } else {
        await this.attempts.create(userId, {
          problemId: a.problemId,
          answer: a.answer,
          durationSec: a.durationSec,
          confidence: a.confidence,
          context: SessionContext.EXAM,
          mockExamResultId: resultId,
        });
      }
    }
    const graded = await this.grading.grade(userId, resultId, dto);
    return this.repo.saveResult(resultId, graded);
  }
}

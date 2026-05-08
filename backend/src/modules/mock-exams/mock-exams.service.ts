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
import { PROBLEM_EN, STEP_PROMPT_EN, CHOICE_EN } from '../../common/i18n/content-en';

/**
 * 응시용 sanitize — answer/isCorrect/distractorType/rationale 제거 + lang 번역.
 */
function sanitizeForExam(p: any, lang: Lang = 'ko'): any {
  if (!p) return p;
  const { answer, ...rest } = p;
  if (lang === 'en') {
    const en = PROBLEM_EN[p.source];
    if (en) rest.body = en.body;
  }
  if (Array.isArray(rest.steps)) {
    rest.steps = rest.steps.map((s: any) => {
      const promptEn = STEP_PROMPT_EN[`${p.source}:${s.stepIndex}`];
      return {
        id: s.id, stepIndex: s.stepIndex, stepType: s.stepType,
        prompt: lang === 'en' && promptEn ? promptEn : s.prompt,
        choices: (s.choices ?? []).map((c: any) => {
          const choiceEn = CHOICE_EN[`${p.source}:${s.stepIndex}:${c.choiceIndex}`];
          return {
            id: c.id, choiceIndex: c.choiceIndex,
            text: lang === 'en' && choiceEn ? choiceEn.text : c.text,
          };
        }),
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

  async trajectory(userId: string, count: number) {
    const rows = await this.repo.findTrajectory(userId, count);
    return rows.map((r: any) => ({
      name: r.mockExam.name.replace(/^2024\s+/, '').replace('학력평가', '학평').replace('모의평가', '모평'),
      score: r.score, grade: r.grade, target: 80,
    }));
  }

  async recentResults(userId: string, count: number) {
    const rows = await this.repo.findRecent(userId, count);
    return rows.map((r: any) => ({
      id: r.id,
      name: r.mockExam.name,
      date: r.takenAt.toISOString().slice(0, 10).replace(/-/g, '년 ').replace(/년 (\d+)$/, '년 $1월') + '일',
      score: r.score, grade: r.grade, percentile: r.percentile,
      time: `${r.durationMin}분/${r.mockExam.totalMinutes}분`,
    }));
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

    return {
      lastScore: last?.score ?? 0,
      expectedGrade: last?.grade ?? 0,
      reliability,
      pointsToNextGrade: pointsToNextGrade(last?.score ?? 0),
      percentile: last?.percentile ?? 0,
    };
  }

  async startRecommended(userId: string, lang: Lang = 'ko') {
    const { problems } = await this.aiRec.compose(userId);
    const name = lang === 'en' ? 'AI-tailored Mock' : 'AI 맞춤 진단 모의고사';
    return this.beginSession(userId, { name, type: 'RECOMMENDED' as any, totalMinutes: 60, problems }, lang);
  }

  async startTyped(userId: string, kind: 'mini' | 'wrong-redo' | 'real', lang: Lang = 'ko') {
    const { problems } = await this.aiRec.composeTyped(userId, kind);
    const metaKo: Record<string, { name: string; type: any; totalMinutes: number }> = {
      mini:        { name: '단원별 미니 테스트',  type: 'MINI',       totalMinutes: 20 },
      'wrong-redo':{ name: '오답 재출제 시험',    type: 'WRONG_REDO', totalMinutes: 30 },
      real:        { name: '실전 모의고사',       type: 'REAL',       totalMinutes: 100 },
    };
    const metaEn: Record<string, { name: string; type: any; totalMinutes: number }> = {
      mini:        { name: 'Unit Mini Test',     type: 'MINI',       totalMinutes: 20 },
      'wrong-redo':{ name: 'Wrong-Redo Exam',    type: 'WRONG_REDO', totalMinutes: 30 },
      real:        { name: 'Full Mock Exam',     type: 'REAL',       totalMinutes: 100 },
    };
    const m = (lang === 'en' ? metaEn : metaKo)[kind];
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
   * 모의고사 제출.
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

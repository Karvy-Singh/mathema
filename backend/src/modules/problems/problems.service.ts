import { Injectable, NotFoundException } from '@nestjs/common';
import { ProblemsRepository, sanitizeForClient } from './problems.repository';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { recommendedDifficulties } from '../../common/utils/difficulty-matcher.util';
import { Lang } from '../../common/i18n/current-lang.decorator';
import {
  PROBLEM_EN, SOURCE_EN, CONCEPT_EN, FORMULA_EN, STEP_PROMPT_EN, CHOICE_EN,
} from '../../common/i18n/content-en';

@Injectable()
export class ProblemsService {
  constructor(
    private readonly repo: ProblemsRepository,
    private readonly prisma: PrismaService,
  ) {}
  list(q: any, lang: Lang = 'ko') { return this.repo.list(q, lang); }
  one(id: string, lang: Lang = 'ko') { return this.repo.findById(id, lang); }
  hint(id: string) { return this.repo.findHint(id); }

  /**
   * 풀이 공개 — 오답노트·복습 등 이미 풀어본 문제에 대해 정답까지 포함한 전체 풀이를 반환.
   * sanitizeForClient 가 숨기는 answer / isCorrect / rationale 도 포함.
   */
  async solution(id: string, lang: Lang = 'ko') {
    const p = await this.prisma.problem.findUnique({
      where: { id },
      include: {
        unit: true, subUnit: true,
        steps: {
          orderBy: { stepIndex: 'asc' },
          include: { choices: { orderBy: { choiceIndex: 'asc' } } },
        },
      },
    });
    if (!p) throw new NotFoundException('problem not found');
    const en = PROBLEM_EN[p.source];
    const body = lang === 'en' && en?.body ? en.body : p.body;
    const answer = lang === 'en' && en?.answer ? en.answer : p.answer;
    const concept = lang === 'en' && CONCEPT_EN[p.source] ? CONCEPT_EN[p.source] : p.concept;
    const formula = lang === 'en' && FORMULA_EN[p.source] ? FORMULA_EN[p.source] : p.formula;
    const sourceDisp = lang === 'en' && SOURCE_EN[p.source] ? SOURCE_EN[p.source] : p.source;
    const steps = p.steps.map((s: any) => {
      const correct = s.choices.find((c: any) => c.isCorrect);
      const promptKey = `${p.source}:${s.stepIndex}`;
      const choiceKey = correct ? `${p.source}:${s.stepIndex}:${correct.choiceIndex}` : '';
      const promptEn = STEP_PROMPT_EN[promptKey];
      const choiceEn = correct ? CHOICE_EN[choiceKey] : null;
      return {
        stepIndex: s.stepIndex,
        stepType: s.stepType,
        prompt: lang === 'en' && promptEn ? promptEn : s.prompt,
        correctChoice: correct ? {
          choiceIndex: correct.choiceIndex,
          text: lang === 'en' && choiceEn ? choiceEn.text : correct.text,
        } : null,
      };
    });
    return {
      id: p.id, source: sourceDisp,
      unit: p.unit?.name ?? null, subUnit: p.subUnit?.name ?? null,
      difficulty: p.difficulty,
      body, concept, formula, answer, steps,
    };
  }

  async recommendedFor(userId: string, unitId: string, lang: Lang = 'ko') {
    const mastery = await this.prisma.masterySnapshot.findUnique({
      where: { userId_unitId: { userId, unitId } },
    });
    const score = mastery?.score ?? 50;
    const difficulties = recommendedDifficulties(score);
    const include = {
      steps: { orderBy: { stepIndex: 'asc' as const }, include: { choices: { orderBy: { choiceIndex: 'asc' as const } } } },
    };
    const problems = await this.prisma.problem.findMany({
      where: { unitId, difficulty: { in: difficulties as any } },
      include, orderBy: { createdAt: 'asc' },
    });
    const fallback = problems.length === 0
      ? await this.prisma.problem.findMany({ where: { unitId }, include, orderBy: { createdAt: 'asc' } })
      : problems;
    return fallback.map((p: any) => sanitizeForClient(p, lang));
  }
}

import { Injectable } from '@nestjs/common';
import { CurriculumRepository } from './curriculum.repository';
import { Lang } from '../../common/i18n/current-lang.decorator';
import { UNIT_NAME_EN, SUB_UNIT_NAME_EN } from '../../common/i18n/content-en';
import { GradeLevel, GRADE_LEVELS } from '../../common/enums/unit.enum';

@Injectable()
export class CurriculumService {
  constructor(private readonly repo: CurriculumRepository) {}

  async tree(lang: Lang = 'ko', grade?: string) {
    const g = this.normalizeGrade(grade);
    const units = await this.repo.findUnitsWithSubUnits(g);
    return units.map((u: any) => this.shape(u, lang));
  }

  async unitsForUser(userId: string, lang: Lang = 'ko', queryGrade?: string) {
    // "__all__" → 학년 필터 해제 (전체 단원)
    let g: GradeLevel | null = null;
    if (queryGrade !== '__all__') {
      g = this.normalizeGrade(queryGrade);
      if (!g) {
        const user = await this.repo.findUserGrade(userId);
        g = (user?.gradeLevel ?? null) as GradeLevel | null;
      }
    }
    const units = await this.repo.findUnitsWithSubUnits(g);
    return units.map((u: any) => this.shape(u, lang));
  }

  private shape(u: any, lang: Lang) {
    return {
      id: u.id,
      name: u.name,
      displayName: lang === 'en' ? (UNIT_NAME_EN[u.name] ?? u.name) : u.name,
      order: u.order,
      gradeLevels: u.gradeLevels ?? [],
      subUnits: (u.subUnits ?? []).map((s: any) => ({
        id: s.id,
        name: s.name,
        displayName: lang === 'en' ? (SUB_UNIT_NAME_EN[s.name] ?? s.name) : s.name,
        order: s.order,
      })),
    };
  }

  private normalizeGrade(g?: string): GradeLevel | null {
    if (!g) return null;
    return (GRADE_LEVELS as readonly string[]).includes(g) ? (g as GradeLevel) : null;
  }
}

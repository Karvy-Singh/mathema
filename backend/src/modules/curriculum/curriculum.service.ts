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

  /** lang='en' 시 한국어 음절이 결과 문자열에 남아있으면 한국어 누출. 마지막 안전망. */
  private safeEn(name: string): string {
    if (/[가-힣]/.test(name)) {
      // 매핑이 누락된 케이스 — 표시는 빈 라벨로 막고 로그.
      // eslint-disable-next-line no-console
      console.warn(`[curriculum] UNIT/SUB_UNIT EN mapping missing for: ${name}`);
      return '';
    }
    return name;
  }

  private shape(u: any, lang: Lang) {
    const rawUnit = lang === 'en' ? (UNIT_NAME_EN[u.name] ?? u.name) : u.name;
    const unitName = lang === 'en' ? this.safeEn(rawUnit) : rawUnit;
    return {
      id: u.id,
      name: unitName,
      displayName: unitName,
      order: u.order,
      gradeLevels: u.gradeLevels ?? [],
      subUnits: (u.subUnits ?? []).map((s: any) => {
        const rawSub = lang === 'en' ? (SUB_UNIT_NAME_EN[s.name] ?? s.name) : s.name;
        const subName = lang === 'en' ? this.safeEn(rawSub) : rawSub;
        return {
          id: s.id,
          name: subName,
          displayName: subName,
          order: s.order,
        };
      }),
    };
  }

  private normalizeGrade(g?: string): GradeLevel | null {
    if (!g) return null;
    return (GRADE_LEVELS as readonly string[]).includes(g) ? (g as GradeLevel) : null;
  }
}

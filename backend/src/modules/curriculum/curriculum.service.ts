import { Injectable } from '@nestjs/common';
import { CurriculumRepository } from './curriculum.repository';
import { Lang } from '../../common/i18n/current-lang.decorator';
import { UNIT_NAME_EN, SUB_UNIT_NAME_EN } from '../../common/i18n/content-en';
import { UNIT_NAME_HI, SUB_UNIT_NAME_HI } from '../../common/i18n/content-hi';
import { GradeLevel, GRADE_LEVELS } from '../../common/enums/unit.enum';

function localizeUnit(name: string, lang: Lang): string {
  if (lang === 'hi') return UNIT_NAME_HI[name] ?? UNIT_NAME_EN[name] ?? name;
  if (lang === 'en') return UNIT_NAME_EN[name] ?? name;
  return name;
}
function localizeSub(name: string, lang: Lang): string {
  if (lang === 'hi') return SUB_UNIT_NAME_HI[name] ?? SUB_UNIT_NAME_EN[name] ?? name;
  if (lang === 'en') return SUB_UNIT_NAME_EN[name] ?? name;
  return name;
}

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

  /** 한국어 음절 누출 안전망 — lang 이 ko 가 아닌데 결과에 한글 음절이 남으면 빈 문자열로 차단. */
  private safeLocalised(name: string, lang: Lang): string {
    if (lang === 'ko') return name;
    if (/[가-힣]/.test(name)) {
      // eslint-disable-next-line no-console
      console.warn(`[curriculum] localisation missing for: ${name} (lang=${lang})`);
      return '';
    }
    return name;
  }

  private shape(u: any, lang: Lang) {
    const unitName = this.safeLocalised(localizeUnit(u.name, lang), lang);
    return {
      id: u.id,
      name: unitName,
      displayName: unitName,
      order: u.order,
      gradeLevels: u.gradeLevels ?? [],
      subUnits: (u.subUnits ?? []).map((s: any) => {
        const subName = this.safeLocalised(localizeSub(s.name, lang), lang);
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

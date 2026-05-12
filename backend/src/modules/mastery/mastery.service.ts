import { Injectable } from '@nestjs/common';
import { MasteryRepository } from './mastery.repository';
import { Lang } from '../../common/i18n/current-lang.decorator';
import { UNIT_NAME_EN } from '../../common/i18n/content-en';
import { UNIT_NAME_HI } from '../../common/i18n/content-hi';

function localizeUnit(name: string, lang: Lang): string {
  if (lang === 'hi') return UNIT_NAME_HI[name] ?? UNIT_NAME_EN[name] ?? name;
  if (lang === 'en') return UNIT_NAME_EN[name] ?? name;
  return name;
}

@Injectable()
export class MasteryService {
  constructor(private readonly repo: MasteryRepository) {}

  async all(userId: string, lang: Lang = 'ko') {
    const list = await this.repo.findAll(userId);
    return list
      .sort((a: any, b: any) => a.unit.order - b.unit.order)
      .map((m: any) => ({
        subject: localizeUnit(m.unit.name, lang),
        value: Math.round(m.score),
        unitId: m.unitId,
      }));
  }

  byUnit(userId: string, unitId: string) { return this.repo.findByUnit(userId, unitId); }
}

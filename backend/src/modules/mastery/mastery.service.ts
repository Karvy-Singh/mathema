import { Injectable } from '@nestjs/common';
import { MasteryRepository } from './mastery.repository';
import { Lang } from '../../common/i18n/current-lang.decorator';
import { UNIT_NAME_EN } from '../../common/i18n/content-en';

@Injectable()
export class MasteryService {
  constructor(private readonly repo: MasteryRepository) {}

  async all(userId: string, lang: Lang = 'ko') {
    const list = await this.repo.findAll(userId);
    return list
      .sort((a: any, b: any) => a.unit.order - b.unit.order)
      .map((m: any) => ({
        subject: lang === 'en' ? (UNIT_NAME_EN[m.unit.name] ?? m.unit.name) : m.unit.name,
        value: Math.round(m.score),
        unitId: m.unitId,
      }));
  }

  byUnit(userId: string, unitId: string) { return this.repo.findByUnit(userId, unitId); }
}

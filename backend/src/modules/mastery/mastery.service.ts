import { Injectable } from '@nestjs/common';
import { MasteryRepository } from './mastery.repository';

@Injectable()
export class MasteryService {
  constructor(private readonly repo: MasteryRepository) {}

  async all(userId: string) {
    const list = await this.repo.findAll(userId);
    // UI radar/막대용 { subject, value }
    return list
      .sort((a: any, b: any) => a.unit.order - b.unit.order)
      .map((m: any) => ({ subject: m.unit.name, value: Math.round(m.score), unitId: m.unitId }));
  }

  byUnit(userId: string, unitId: string) { return this.repo.findByUnit(userId, unitId); }
}

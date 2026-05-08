import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { daysUntil } from '../../common/utils/date.util';

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  create(data: any) { return this.repo.create(data); }
  findByEmail(email: string) { return this.repo.findByEmail(email); }
  updateProfile(id: string, dto: any) { return this.repo.update(id, dto); }
  updateTarget(id: string, dto: any) { return this.repo.update(id, dto); }

  async findOne(id: string) {
    const u = await this.repo.findById(id);
    if (!u) return null;
    const { passwordHash, ...rest } = u;
    return { ...rest, dDay: daysUntil(u.examDate) };
  }
}

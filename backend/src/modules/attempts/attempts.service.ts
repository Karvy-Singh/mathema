import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AttemptsRepository } from './attempts.repository';

@Injectable()
export class AttemptsService {
  constructor(
    private readonly repo: AttemptsRepository,
    private readonly events: EventEmitter2,
  ) {}

  async create(userId: string, dto: any) {
    const attempt = await this.repo.create(userId, dto);
    // 측면 효과: mastery / activity / wrong-notes 가 구독해 비동기 갱신
    this.events.emit('attempt.completed', attempt);
    return attempt;
  }
}

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * 모든 도메인 repository 가 주입받는 단일 Prisma 클라이언트.
 * 트랜잭션은 PrismaService.$transaction(async (tx) => ...) 으로 사용.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    this.logger.log('PostgreSQL connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

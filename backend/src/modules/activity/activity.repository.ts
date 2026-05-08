import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class ActivityRepository {
  constructor(private readonly prisma: PrismaService) {}
  // ActivityService 가 직접 prisma 를 사용하므로 본 repository 는 추가 쿼리 추상화용 자리.
}

import { Test } from '@nestjs/testing';
import { AdaptiveNextProblemService } from './adaptive-next-problem.service';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

/**
 * 단위 테스트 — AdaptiveNextProblemService 의 사용자 격리.
 *
 *   회귀: 이전 코드에서 expandWithPrerequisites() 가 trajectories[0].userId
 *   참조로 인해 undefined 가 되어 cross-user mastery 가 섞일 수 있었음.
 *   이 테스트는 prerequisite mastery 조회 시 항상 userId 필터가 들어가는지 검증.
 */
describe('AdaptiveNextProblemService — 사용자 격리', () => {
  const masteryFindManyMock = jest.fn();
  const conceptFindUniqueMock = jest.fn();
  const userFindUniqueMock = jest.fn();
  const recLogFindManyMock = jest.fn();
  const recLogCreateMock = jest.fn();
  const problemFindFirstMock = jest.fn();
  const errorPatternFindManyMock = jest.fn();

  let service: AdaptiveNextProblemService;

  beforeEach(async () => {
    masteryFindManyMock.mockReset();
    conceptFindUniqueMock.mockReset();
    userFindUniqueMock.mockReset();
    recLogFindManyMock.mockReset();
    recLogCreateMock.mockReset();
    problemFindFirstMock.mockReset();
    errorPatternFindManyMock.mockReset();

    const prismaMock: Partial<PrismaService> = {
      user: { findUnique: userFindUniqueMock } as any,
      masteryTrajectory: { findMany: masteryFindManyMock } as any,
      concept: { findUnique: conceptFindUniqueMock, findFirst: jest.fn() } as any,
      errorPatternProfile: { findMany: errorPatternFindManyMock } as any,
      recommendationLog: { findMany: recLogFindManyMock, create: recLogCreateMock } as any,
      problem: { findFirst: problemFindFirstMock } as any,
    };
    const mod = await Test.createTestingModule({
      providers: [
        AdaptiveNextProblemService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = mod.get(AdaptiveNextProblemService);
  });

  it('expandWithPrerequisites: prerequisite mastery 조회 시 항상 같은 userId 가 필터로 들어간다', async () => {
    const USER_ID = 'user-alice';
    userFindUniqueMock.mockResolvedValue({ tenantId: null, gradeLevel: 'G_HIGH_2' });

    // 약점 concept 1 개 (prerequisite 2 개) — 그 prerequisite 가 더 약해서 우선 진입
    masteryFindManyMock
      // 1st call — 첫 mastery 목록
      .mockResolvedValueOnce([
        { conceptId: 'c-derived', masteryScore: 50, evidenceCount: 5 },
      ])
      // 2nd call — prerequisite mastery (이 호출의 where 절이 userId 가 들어가는지 검증)
      .mockResolvedValueOnce([
        { conceptId: 'c-prereq-1', masteryScore: 20 },  // 30+ 점수 차로 prerequisite 진입
      ]);
    conceptFindUniqueMock.mockResolvedValue({ prerequisiteConceptIds: ['c-prereq-1'] });
    errorPatternFindManyMock.mockResolvedValue([]);
    recLogFindManyMock.mockResolvedValue([]);   // 최근 추천 없음
    problemFindFirstMock.mockResolvedValue({ id: 'p-prereq-easy', difficultyLevel: 1 });
    recLogCreateMock.mockResolvedValue({ id: 'rec-log-1' });

    const result = await service.getNext(USER_ID);

    expect(result).not.toBeNull();
    expect(result?.targetConceptId).toBe('c-prereq-1');

    // prerequisite mastery 조회 시점 (2번째 masteryFindMany) 의 where 절에 userId 가 정확히 들어가는지
    const preCall = masteryFindManyMock.mock.calls[1];
    expect(preCall[0].where).toMatchObject({ userId: USER_ID });
    expect(preCall[0].where.userId).toBe(USER_ID);
    // userId 가 undefined 가 아닌지 명시 검증
    expect(preCall[0].where.userId).toBeDefined();
  });
});

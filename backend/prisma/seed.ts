import { PrismaClient, Difficulty, ErrorType, NoteStatus, SessionContext, MockExamType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { GRADE_TO_UNITS, UNIT_NAMES, UNIT_TO_GRADES, SUB_UNIT_MAP } from '../src/common/enums/unit.enum';
import { seedSteps } from './seed-steps';

const prisma = new PrismaClient();

/**
 * 광범위한 시드 — 학년별 교육과정 (중1~고3) 단원 + 일반 수학 콘텐츠 (방정식·함수 등) + 기존 고3 콘텐츠 보존.
 * 시드 사용자: 민준 (polopot123@gmail.com / password1234) — 고3 / 목표 1등급.
 */
async function main() {
  console.log('🌱 Seeding...');

  // ===== Unit + SubUnit (학년별 매핑 포함) =====
  const units: Record<string, { id: string; subs: Record<string, string> }> = {};
  for (let i = 0; i < UNIT_NAMES.length; i++) {
    const name = UNIT_NAMES[i];
    const grades = UNIT_TO_GRADES[name] ?? [];
    const unit = await prisma.unit.upsert({
      where: { name },
      update: { order: i, gradeLevels: grades as any },
      create: { name, order: i, gradeLevels: grades as any },
    });
    const subs: Record<string, string> = {};
    const subList = SUB_UNIT_MAP[name] ?? [];
    for (let j = 0; j < subList.length; j++) {
      const sub = await prisma.subUnit.upsert({
        where: { unitId_name: { unitId: unit.id, name: subList[j] } },
        update: { order: j },
        create: { unitId: unit.id, name: subList[j], order: j },
      });
      subs[subList[j]] = sub.id;
    }
    units[name] = { id: unit.id, subs };
  }

  // ===== User: 데모 (중1) =====
  // 데모 단계 — 중1 과정으로 통일해 진입장벽을 낮춘다.
  const examDate = new Date();
  examDate.setDate(examDate.getDate() + 287);
  const user = await prisma.user.upsert({
    where: { email: 'polopot123@gmail.com' },
    update: { gradeLevel: 'G_MIDDLE_1' },
    create: {
      email: 'polopot123@gmail.com',
      passwordHash: await bcrypt.hash('password1234', 10),
      name: '민준', examDate, targetGrade: 1, gradeLevel: 'G_MIDDLE_1',
    },
  });

  // ===== Sample Problems =====
  await prisma.attempt.deleteMany({ where: { userId: user.id } });
  await prisma.wrongNote.deleteMany({ where: { userId: user.id } });

  type ProblemSpec = {
    source: string; unit: string; sub?: string;
    difficulty: Difficulty; body: string; answer: string;
  };

  // 기존 고3 본격 문제 7종 (3단계 객관식 + distractor metadata) — 시드-스텝과 짝이 됨
  const featured: ProblemSpec[] = [
    { source: '2024 9월 모의평가 30번', unit: '미적분 II', sub: '정적분의 활용', difficulty: 'SEMI_KILLER',
      body: '함수 f(x) = √x 와 x축 그리고 직선 x = 4로 둘러싸인 영역을 x축 둘레로 회전시켜 생기는 회전체의 부피를 구하시오.', answer: '8π' },
    { source: '수능특강 미적분 III-2-15', unit: '미적분 II', sub: '부분적분', difficulty: 'UPPER_MIDDLE',
      body: '∫ x e^x dx 를 구하시오.', answer: '(x-1)e^x + C' },
    { source: '2024 6월 모의평가 28번', unit: '확률·통계', sub: '조건부확률', difficulty: 'SEMI_KILLER',
      body: '주머니에서 공을 뽑는 시행에서 P(A|B)를 구하시오.', answer: '7/15' },
    { source: '2024 9월 모의평가 21번', unit: '기하·벡터', sub: '공간벡터', difficulty: 'SEMI_KILLER',
      body: '공간좌표계에서 두 직선이 이루는 각의 코사인 값을 구하시오.', answer: '√3/3' },
    { source: '교육청 학평 18번', unit: '미적분 II', sub: '치환적분', difficulty: 'MIDDLE',
      body: '∫ 2x √(x²+1) dx 를 구하시오.', answer: '(2/3)(x²+1)^(3/2) + C' },
    { source: '수능기출 2023 22번', unit: '미적분 II', sub: '정적분', difficulty: 'KILLER',
      body: '구분구적법으로 정적분 ∫₀¹ x² dx 를 정의에 따라 구하시오.', answer: '1/3' },
    { source: '2024 6월 모의평가 21번', unit: '함수와 그래프', sub: '함수의 정의', difficulty: 'UPPER_MIDDLE',
      body: 'log_2 (x²-x-6) ≥ 0 을 만족하는 x의 범위.', answer: 'x ≤ -2 또는 x ≥ 4' },
  ];

  // 신규 — 중1 과정 (정수·유리수, 문자와 식, 일차방정식, 좌표평면) — 모든 문제는 3단계 객관식.
  // step 정의는 seed-steps.ts SPEC_M1 에서 source 매칭으로 부여된다.
  const general: ProblemSpec[] = [
    // 정수와 유리수 (5)
    { source: '중1 · 정수와 유리수 1', unit: '정수와 유리수', sub: '정수의 사칙연산', difficulty: 'MIDDLE',
      body: '다음을 계산하시오: (-3) + 7', answer: '4' },
    { source: '중1 · 정수와 유리수 2', unit: '정수와 유리수', sub: '정수의 사칙연산', difficulty: 'MIDDLE',
      body: '다음을 계산하시오: (-5) - (-8)', answer: '3' },
    { source: '중1 · 정수와 유리수 3', unit: '정수와 유리수', sub: '정수의 사칙연산', difficulty: 'MIDDLE',
      body: '다음을 계산하시오: (-2) × (+3) × (-4)', answer: '24' },
    { source: '중1 · 정수와 유리수 4', unit: '정수와 유리수', sub: '유리수와 절댓값', difficulty: 'MIDDLE',
      body: '|−7| + |+5| 의 값을 구하시오.', answer: '12' },
    { source: '중1 · 정수와 유리수 5', unit: '정수와 유리수', sub: '소수와 분수의 변환', difficulty: 'MIDDLE',
      body: '0.4 를 기약분수로 나타내시오.', answer: '2/5' },

    // 문자와 식 (4)
    { source: '중1 · 문자와 식 1', unit: '문자와 식', sub: '문자식 표현', difficulty: 'MIDDLE',
      body: 'x 의 5배에 3을 더한 식을 쓰시오.', answer: '5x + 3' },
    { source: '중1 · 문자와 식 2', unit: '문자와 식', sub: '동류항 정리', difficulty: 'MIDDLE',
      body: '3a + 2b - a + 5b 를 정리하시오.', answer: '2a + 7b' },
    { source: '중1 · 문자와 식 3', unit: '문자와 식', sub: '식의 값 계산', difficulty: 'UPPER_MIDDLE',
      body: 'x = -2 일 때, 3x² - 5 의 값을 구하시오.', answer: '7' },
    { source: '중1 · 문자와 식 4', unit: '문자와 식', sub: '동류항 정리', difficulty: 'MIDDLE',
      body: '-2(3x - 5) + 4x 를 정리하시오.', answer: '-2x + 10' },

    // 일차방정식 (7)
    { source: '중1 · 일차방정식 1', unit: '일차방정식', sub: '일차방정식 풀이', difficulty: 'MIDDLE',
      body: '다음 일차방정식을 푸시오: 3x − 7 = 11', answer: 'x = 6' },
    { source: '중1 · 일차방정식 2', unit: '일차방정식', sub: '일차방정식 풀이', difficulty: 'UPPER_MIDDLE',
      body: '다음 일차방정식을 푸시오: 2(x + 4) = 5x − 1', answer: 'x = 3' },
    { source: '중1 · 일차방정식 3', unit: '일차방정식', sub: '일차방정식 풀이', difficulty: 'MIDDLE',
      body: '다음 일차방정식을 푸시오: -3x + 5 = 14', answer: 'x = -3' },
    { source: '중1 · 일차방정식 4', unit: '일차방정식', sub: '일차방정식 풀이', difficulty: 'MIDDLE',
      body: '다음 일차방정식을 푸시오: x/2 + 3 = 7', answer: 'x = 8' },
    { source: '중1 · 일차방정식 5', unit: '일차방정식', sub: '일차방정식의 활용', difficulty: 'UPPER_MIDDLE',
      body: '한 변의 길이가 x 인 정사각형의 둘레가 24cm 일 때, x 의 값은?', answer: '6' },
    { source: '중1 · 일차방정식 6', unit: '일차방정식', sub: '일차방정식의 활용', difficulty: 'UPPER_MIDDLE',
      body: '연속된 세 자연수의 합이 39 일 때, 가장 작은 수는?', answer: '12' },
    { source: '중1 · 일차방정식 7', unit: '일차방정식', sub: '비례식과 활용', difficulty: 'MIDDLE',
      body: '비례식 3 : 5 = x : 20 에서 x 의 값은?', answer: '12' },

    // 좌표평면과 그래프 (4)
    { source: '중1 · 좌표와 그래프 1', unit: '좌표평면과 그래프', sub: '순서쌍과 좌표', difficulty: 'MIDDLE',
      body: '점 (-3, 2) 는 어느 사분면 위에 있는가?', answer: '제2사분면' },
    { source: '중1 · 좌표와 그래프 2', unit: '좌표평면과 그래프', sub: '순서쌍과 좌표', difficulty: 'MIDDLE',
      body: '점 (4, -1) 을 x축에 대하여 대칭이동한 점의 좌표는?', answer: '(4, 1)' },
    { source: '중1 · 좌표와 그래프 3', unit: '좌표평면과 그래프', sub: '정비례·반비례', difficulty: 'UPPER_MIDDLE',
      body: 'y 가 x 에 정비례하고, x = 4 일 때 y = 12 이다. y 를 x 의 식으로 나타내시오.', answer: 'y = 3x' },
    { source: '중1 · 좌표와 그래프 4', unit: '좌표평면과 그래프', sub: '정비례·반비례', difficulty: 'UPPER_MIDDLE',
      body: '함수 y = -2x 의 그래프가 지나는 사분면을 모두 고르시오.', answer: '제2사분면, 제4사분면' },
  ];

  const problemsSpec: ProblemSpec[] = [...featured, ...general];

  // 기존 시드 문제 삭제 후 재생성
  for (const spec of problemsSpec) {
    await prisma.problem.deleteMany({ where: { source: spec.source } });
  }

  const problems: Record<string, string> = {};
  for (const p of problemsSpec) {
    const u = units[p.unit];
    if (!u) { console.warn(`Unit not found: ${p.unit} (skipping ${p.source})`); continue; }
    const subUnitId = p.sub ? u.subs[p.sub] : null;
    const created = await prisma.problem.create({
      data: {
        source: p.source, unitId: u.id, subUnitId,
        difficulty: p.difficulty, body: p.body, answer: p.answer,
        hint: '단계별 가이드는 학습 페이지의 AI 가이드 패널에서 확인하세요.',
      },
    });
    problems[p.source] = created.id;
  }

  // ===== 3단계 객관식 (CONCEPT → PROCESS → ANSWER) — featured 7종에만 적용 =====
  console.log('🪜 Seeding problem steps + choices for featured problems...');
  await seedSteps(prisma, problems);

  // ===== WrongNotes (SM-2 분포 포함) — 중1 데모 =====
  const wrongNotesSpec: Array<{ source: string; errorType: ErrorType; insight: string; status: NoteStatus; similarCount: number; daysAgo: number; rep: number; ef: number; intervalDays: number; dueOffset: number | null; lapseCount: number; }> = [
    { source: '중1 · 일차방정식 2',  errorType: 'CALCULATION_MISTAKE',           insight: '괄호를 풀고 동류항 정리 후 이항 단계를 자주 빠뜨림',           status: 'ANALYZING', similarCount: 4, daysAgo: 5,  rep: 1, ef: 2.4, intervalDays: 1,  dueOffset: 0,  lapseCount: 1 },
    { source: '중1 · 정수와 유리수 3', errorType: 'CALCULATION_MISTAKE',           insight: '음수 곱셈 부호 결정 시 음수 개수 카운팅 실수 반복',              status: 'ANALYZING', similarCount: 3, daysAgo: 7,  rep: 2, ef: 2.5, intervalDays: 6,  dueOffset: -1, lapseCount: 0 },
    { source: '중1 · 좌표와 그래프 1', errorType: 'CONCEPT_MISUNDERSTANDING',     insight: '사분면 번호와 좌표 부호의 대응을 혼동',                          status: 'MASTERED',  similarCount: 3, daysAgo: 14, rep: 4, ef: 2.7, intervalDays: 35, dueOffset: 21, lapseCount: 0 },
    { source: '중1 · 일차방정식 5',  errorType: 'CONCEPT_MISUNDERSTANDING',     insight: '도형 둘레식 세우기 단계에서 변의 개수 혼동',                    status: 'MASTERED',  similarCount: 4, daysAgo: 21, rep: 5, ef: 2.8, intervalDays: 60, dueOffset: 39, lapseCount: 0 },
    { source: '중1 · 문자와 식 3',   errorType: 'TIME_SHORTAGE',               insight: '식의 값 계산 시 음수 제곱의 부호 처리에서 시간 소모',           status: 'PENDING',   similarCount: 3, daysAgo: 5,  rep: 0, ef: 2.5, intervalDays: 0,  dueOffset: null, lapseCount: 0 },
    { source: '중1 · 일차방정식 4',  errorType: 'CALCULATION_MISTAKE',           insight: '분수 계수 방정식에서 양변에 분모를 곱하는 단계 누락',           status: 'ANALYZING', similarCount: 2, daysAgo: 7,  rep: 1, ef: 2.3, intervalDays: 1,  dueOffset: 3,  lapseCount: 2 },
  ];

  const startOfDay = (offset: number) => {
    const d = new Date(); d.setDate(d.getDate() + offset); d.setHours(0, 0, 0, 0); return d;
  };

  for (const w of wrongNotesSpec) {
    const problemId = problems[w.source]; if (!problemId) continue;
    const created = new Date(); created.setDate(created.getDate() - w.daysAgo);
    const lastReviewed = w.rep > 0 ? new Date(created.getTime() + 86400000 * Math.min(w.daysAgo - 1, 1)) : null;
    await prisma.wrongNote.create({
      data: {
        userId: user.id, problemId,
        errorType: w.errorType, insight: w.insight, status: w.status,
        similarCount: w.similarCount, createdAt: created,
        masteredAt: w.status === 'MASTERED' ? created : null,
        easinessFactor: w.ef,
        repetitionCount: w.rep,
        intervalDays: w.intervalDays,
        nextReviewAt: w.dueOffset === null ? null : startOfDay(w.dueOffset),
        lastReviewedAt: lastReviewed,
        lapseCount: w.lapseCount,
      },
    });
  }

  // ===== Attempts (250개 무작위 90일치, 모든 단원 분포) =====
  const allProblemIds = Object.values(problems);
  for (let i = 0; i < 250; i++) {
    const daysAgo = Math.floor(Math.random() * 90);
    const at = new Date(); at.setDate(at.getDate() - daysAgo);
    await prisma.attempt.create({
      data: {
        userId: user.id, problemId: allProblemIds[i % allProblemIds.length],
        context: SessionContext.STUDY, answer: 'sample',
        isCorrect: Math.random() < 0.73,
        durationSec: 60 + Math.floor(Math.random() * 240),
        createdAt: at,
      },
    });
  }

  // ===== DailyActivity (84일 heatmap, 마지막 23일 연속) =====
  await prisma.dailyActivity.deleteMany({ where: { userId: user.id } });
  for (let i = 0; i < 84; i++) {
    const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
    const intensity = i < 23 ? Math.floor(Math.random() * 3) + 1
                              : Math.random() < 0.85 ? Math.floor(Math.random() * 4) : 0;
    await prisma.dailyActivity.create({
      data: {
        userId: user.id, date: d,
        durationMin: intensity === 0 ? 0 : 40 + intensity * 30 + Math.floor(Math.random() * 30),
        problemsSolved: intensity * 12 + Math.floor(Math.random() * 5),
        accuracyPct: 65 + Math.random() * 15,
        intensity,
      },
    });
  }

  // ===== MasterySnapshot — 데모는 중1 단원만 (mastery 가 있는 단원만 AI compose 가 사용) =====
  await prisma.masterySnapshot.deleteMany({ where: { userId: user.id } });
  const masteryByUnitName: Record<string, number> = {
    // 약점 → 강점 스펙트럼
    '일차방정식':         52,  // 약점 — 추천 우선순위 ↑
    '정수와 유리수':      78,  // 안정
    '문자와 식':          65,  // 약점 보강 필요
    '좌표평면과 그래프':  72,  // 안정
  };
  for (const [unitName, score] of Object.entries(masteryByUnitName)) {
    const unit = units[unitName];
    if (!unit) continue;
    await prisma.masterySnapshot.create({
      data: { userId: user.id, unitId: unit.id, score },
    });
  }

  // ===== MockExam + Result =====
  const mockSpec: Array<{ name: string; type: MockExamType; score: number; grade: number; percentile: number; daysAgo: number; minutes: number }> = [
    { name: '2024 3월 학력평가',   type: 'HAKPYEONG', score: 62, grade: 4, percentile: 55, daysAgo: 240, minutes: 99 },
    { name: '2024 4월 학력평가',   type: 'HAKPYEONG', score: 68, grade: 3, percentile: 62, daysAgo: 200, minutes: 100 },
    { name: '2024 6월 모의평가',   type: 'MOPYEONG',  score: 71, grade: 3, percentile: 71, daysAgo: 150, minutes: 100 },
    { name: '2024 7월 학력평가',   type: 'HAKPYEONG', score: 76, grade: 2, percentile: 78, daysAgo: 110, minutes: 95 },
    { name: '2024 9월 모의평가',   type: 'MOPYEONG',  score: 79, grade: 2, percentile: 82, daysAgo: 60,  minutes: 100 },
    { name: '2024 10월 학력평가',  type: 'HAKPYEONG', score: 84, grade: 2, percentile: 88, daysAgo: 25,  minutes: 98 },
  ];

  await prisma.mockExamResult.deleteMany({ where: { userId: user.id } });
  for (const m of mockSpec) {
    let exam = await prisma.mockExam.findFirst({ where: { name: m.name } });
    if (!exam) {
      exam = await prisma.mockExam.create({
        data: { name: m.name, type: m.type, totalProblems: 30, totalMinutes: 100 },
      });
    }
    const takenAt = new Date(); takenAt.setDate(takenAt.getDate() - m.daysAgo);
    await prisma.mockExamResult.create({
      data: {
        userId: user.id, mockExamId: exam.id,
        score: m.score, grade: m.grade, percentile: m.percentile,
        durationMin: m.minutes, takenAt,
      },
    });
  }

  // ===== WeeklyReport =====
  await prisma.weeklyReport.deleteMany({ where: { userId: user.id } });
  const reportSpec = [
    { time: 12,   accuracy: 65 }, { time: 14, accuracy: 68 },
    { time: 11,   accuracy: 64 }, { time: 16, accuracy: 71 },
    { time: 18,   accuracy: 73 }, { time: 17, accuracy: 75 },
    { time: 19,   accuracy: 76 }, { time: 21.4, accuracy: 76 },
  ];
  for (let i = 0; i < reportSpec.length; i++) {
    const r = reportSpec[i];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (reportSpec.length - 1 - i) * 7);
    weekStart.setHours(0, 0, 0, 0);
    await prisma.weeklyReport.create({
      data: {
        userId: user.id,
        isoWeek: `${weekStart.getFullYear()}-W${String(40 + i).padStart(2, '0')}`,
        weekStart,
        totalHours: r.time,
        problemsSolved: 200 + i * 20,
        accuracyPct: r.accuracy,
        aiScore: 6 + i * 0.3,
        mentorMessage:
          i === reportSpec.length - 1
            ? '지난주보다 학습시간을 18% 늘렸고 정답률도 4%p 올랐어요. 특히 미적분 II에서 보였던 치환적분 약점이 65% → 78%로 회복되고 있습니다. 이 페이스를 유지하면 12월 모의고사에서 1등급권 진입이 충분히 가능해요.'
            : '꾸준한 학습 패턴을 유지하고 있어요.',
      },
    });
  }

  console.log(`✅ Seed completed for ${user.email} — ${UNIT_NAMES.length} units, ${problemsSpec.length} problems across grades`);
  console.log(`📊 Grades: ${Object.entries(GRADE_TO_UNITS).map(([g, u]) => `${g}=${u.length} units`).join(', ')}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

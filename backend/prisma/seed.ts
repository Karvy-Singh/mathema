import { PrismaClient, Difficulty, ErrorType, NoteStatus, SessionContext, MockExamType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UNIT_NAMES, SUB_UNIT_MAP } from '../src/common/enums/unit.enum';
import { seedSteps } from './seed-steps';

const prisma = new PrismaClient();

/**
 * 광범위한 시드 — UI(MathLearningApp.jsx) 가 보여주는 모든 카드/차트가 실제 DB 값으로 동작하도록 구성.
 * 시드 사용자: 민준 (polopot123@gmail.com / password1234)
 */
async function main() {
  console.log('🌱 Seeding...');

  // ===== Unit + SubUnit =====
  const units: Record<string, { id: string; subs: Record<string, string> }> = {};
  for (let i = 0; i < UNIT_NAMES.length; i++) {
    const name = UNIT_NAMES[i];
    const unit = await prisma.unit.upsert({
      where: { name }, update: { order: i }, create: { name, order: i },
    });
    const subs: Record<string, string> = {};
    const subList = SUB_UNIT_MAP[name];
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

  // ===== User: 민준 =====
  const examDate = new Date();
  examDate.setDate(examDate.getDate() + 287);
  const user = await prisma.user.upsert({
    where: { email: 'polopot123@gmail.com' },
    update: {},
    create: {
      email: 'polopot123@gmail.com',
      passwordHash: await bcrypt.hash('password1234', 10),
      name: '민준', examDate, targetGrade: 1,
    },
  });

  // ===== Sample Problems =====
  await prisma.attempt.deleteMany({ where: { userId: user.id } });
  await prisma.wrongNote.deleteMany({ where: { userId: user.id } });

  const problemsSpec = [
    { source: '2024 9월 모의평가 30번', unit: '미적분 II', sub: '정적분의 활용', difficulty: 'SEMI_KILLER' as Difficulty,
      body: '함수 f(x) = √x 와 x축 그리고 직선 x = 4로 둘러싸인 영역을 x축 둘레로 회전시켜 생기는 회전체의 부피를 구하시오.', answer: '8π' },
    { source: '수능특강 미적분 III-2-15', unit: '미적분 II', sub: '부분적분', difficulty: 'UPPER_MIDDLE' as Difficulty,
      body: '∫ x e^x dx 를 구하시오.', answer: '(x-1)e^x + C' },
    { source: '2024 6월 모의평가 28번', unit: '확률·통계', sub: '조건부확률', difficulty: 'SEMI_KILLER' as Difficulty,
      body: '주머니에서 공을 뽑는 시행에서 P(A|B)를 구하시오.', answer: '7/15' },
    { source: '2024 9월 모의평가 21번', unit: '기하·벡터', sub: '공간벡터', difficulty: 'SEMI_KILLER' as Difficulty,
      body: '공간좌표계에서 두 직선이 이루는 각의 코사인 값을 구하시오.', answer: '√3/3' },
    { source: '교육청 학평 18번', unit: '미적분 II', sub: '치환적분', difficulty: 'MIDDLE' as Difficulty,
      body: '∫ 2x √(x²+1) dx 를 구하시오.', answer: '(2/3)(x²+1)^(3/2) + C' },
    { source: '수능기출 2023 22번', unit: '미적분 II', sub: '정적분', difficulty: 'KILLER' as Difficulty,
      body: '구분구적법으로 정적분 ∫₀¹ x² dx 를 정의에 따라 구하시오.', answer: '1/3' },
    { source: '2024 6월 모의평가 21번', unit: '함수', sub: '지수·로그함수', difficulty: 'UPPER_MIDDLE' as Difficulty,
      body: 'log_2 (x²-x-6) ≥ 0 을 만족하는 x의 범위.', answer: 'x ≤ -2 또는 x ≥ 4' },
  ];

  // 기존 시드 문제 삭제 후 재생성
  for (const spec of problemsSpec) {
    await prisma.problem.deleteMany({ where: { source: spec.source } });
  }

  const problems: Record<string, string> = {};
  for (const p of problemsSpec) {
    const u = units[p.unit];
    const created = await prisma.problem.create({
      data: {
        source: p.source, unitId: u.id, subUnitId: u.subs[p.sub],
        difficulty: p.difficulty, body: p.body, answer: p.answer,
        hint: '단계별 가이드는 학습 페이지의 AI 가이드 패널에서 확인하세요.',
      },
    });
    problems[p.source] = created.id;
  }

  // ===== 3단계 객관식 (CONCEPT → PROCESS → ANSWER) + 매력적 오답 =====
  console.log('🪜 Seeding problem steps + choices...');
  await seedSteps(prisma, problems);

  // ===== WrongNotes (SM-2 분포 포함) =====
  // dueOffset: 다음 복습일까지 남은 일수 (음수=만기, 0=오늘, 양수=미래). null=미복습.
  const wrongNotesSpec: Array<{ source: string; errorType: ErrorType; insight: string; status: NoteStatus; similarCount: number; daysAgo: number; rep: number; ef: number; intervalDays: number; dueOffset: number | null; lapseCount: number; }> = [
    { source: '2024 9월 모의평가 30번',  errorType: 'CONCEPT_MISUNDERSTANDING', insight: '회전체 부피 공식에서 회전축에 따른 적분구간 설정을 혼동', status: 'ANALYZING', similarCount: 8, daysAgo: 5,  rep: 1, ef: 2.4, intervalDays: 1,  dueOffset: 0,  lapseCount: 1 },
    { source: '수능특강 미적분 III-2-15', errorType: 'CALCULATION_MISTAKE',     insight: '부분적분 공식 적용 후 부호 오류 반복 (3회)',                  status: 'ANALYZING', similarCount: 5, daysAgo: 7,  rep: 2, ef: 2.5, intervalDays: 6,  dueOffset: -1, lapseCount: 0 },
    { source: '2024 6월 모의평가 28번',   errorType: 'CONCEPT_MISUNDERSTANDING', insight: '조건부확률에서 표본공간 재정의를 놓침',                         status: 'MASTERED',  similarCount: 5, daysAgo: 14, rep: 4, ef: 2.7, intervalDays: 35, dueOffset: 21, lapseCount: 0 },
    { source: '교육청 학평 18번',          errorType: 'CALCULATION_MISTAKE',     insight: 'du 변환 시 dx와의 관계식에서 상수항 누락 반복',                 status: 'MASTERED',  similarCount: 6, daysAgo: 21, rep: 5, ef: 2.8, intervalDays: 60, dueOffset: 39, lapseCount: 0 },
    { source: '2024 9월 모의평가 21번',   errorType: 'TIME_SHORTAGE',           insight: '공간좌표 설정에서 좌표축 회전 시각화 부족',                     status: 'PENDING',   similarCount: 4, daysAgo: 5,  rep: 0, ef: 2.5, intervalDays: 0,  dueOffset: null, lapseCount: 0 },
    { source: '수능기출 2023 22번',       errorType: 'CONCEPT_MISUNDERSTANDING', insight: '구분구적법과 정적분의 정의 사이 직관적 연결 부족',              status: 'ANALYZING', similarCount: 3, daysAgo: 7,  rep: 1, ef: 2.3, intervalDays: 1,  dueOffset: 3,  lapseCount: 2 },
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

  // ===== Attempts (250개 무작위 90일치) =====
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

  // ===== MasterySnapshot =====
  const masterySpec: Record<string, number> = {
    '수와 식': 85, '함수': 72, '미적분 I': 91, '미적분 II': 48, '확률·통계': 67, '기하·벡터': 79,
  };
  for (const [unitName, score] of Object.entries(masterySpec)) {
    const unitId = units[unitName].id;
    await prisma.masterySnapshot.upsert({
      where: { userId_unitId: { userId: user.id, unitId } },
      update: { score },
      create: { userId: user.id, unitId, score },
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

  console.log(`✅ Seed completed for ${user.email}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

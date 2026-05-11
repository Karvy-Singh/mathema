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

  // ===== Demo user — India launch (Class 7 NCERT, building foundation) =====
  // Phase 1 출시: Class 7 (G_MIDDLE_1) NCERT — 시드 문제 20개가 모두 이 학년에 매핑되어 데모가 풍부.
  // Phase 2: Class 11 (JEE prep) 콘텐츠 확보 후 페르소나 추가 예정.
  const examDate = new Date();
  examDate.setDate(examDate.getDate() + 287);
  const user = await prisma.user.upsert({
    where: { email: 'polopot123@gmail.com' },
    update: { gradeLevel: 'G_MIDDLE_1', country: 'IN', name: 'Arjun Sharma' } as any,
    create: {
      email: 'polopot123@gmail.com',
      passwordHash: await bcrypt.hash('password1234', 10),
      name: 'Arjun Sharma',
      examDate,
      targetGrade: 1,
      gradeLevel: 'G_MIDDLE_1',
      country: 'IN' as any,
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

    // ============ Class 8 NCERT (4) ============
    { source: 'Class 8 · Rational Numbers · Q1', unit: '유리수와 순환소수', sub: '순환소수와 분수', difficulty: 'MIDDLE',
      body: 'Express 0.\\overline{3} (0.3 repeating) as a fraction in lowest terms.', answer: '1/3' },
    { source: 'Class 8 · Algebraic Identities · Q1', unit: '식의 계산', sub: '곱셈공식', difficulty: 'UPPER_MIDDLE',
      body: 'Use an identity to expand (x + 5)².', answer: 'x² + 10x + 25' },
    { source: 'Class 8 · Linear Equations · Q1', unit: '식의 계산', sub: '동류항 정리', difficulty: 'MIDDLE',
      body: 'Solve for x:  2x − 3 = 5x + 9.', answer: 'x = -4' },
    { source: 'Class 8 · Graphs · Q1', unit: '일차함수', sub: '기울기와 절편', difficulty: 'MIDDLE',
      body: 'A line passes through (0, 2) and (3, 8). Find its slope.', answer: '2' },

    // ============ Class 9 NCERT (4) ============
    { source: 'Class 9 · Number Systems · Q1', unit: '제곱근과 실수', sub: '근호의 사칙연산', difficulty: 'MIDDLE',
      body: 'Simplify √50 + √8.', answer: '7√2' },
    { source: 'Class 9 · Polynomials · Q1', unit: '인수분해', sub: '인수분해 공식', difficulty: 'UPPER_MIDDLE',
      body: 'Factorise x² + 7x + 12.', answer: '(x + 3)(x + 4)' },
    { source: 'Class 9 · Coordinate Geometry · Q1', unit: '좌표평면과 그래프', sub: '순서쌍과 좌표', difficulty: 'MIDDLE',
      body: 'Find the distance between A(2, 3) and B(5, 7).', answer: '5' },
    { source: 'Class 9 · Polynomials · Q2', unit: '이차함수', sub: '이차함수의 그래프', difficulty: 'UPPER_MIDDLE',
      body: 'For p(x) = 2x² − 3x − 2, find p(2).', answer: '0' },

    // ============ Class 10 NCERT (4) ============
    { source: 'Class 10 · Polynomials · Q1', unit: '다항식', sub: '나머지정리', difficulty: 'UPPER_MIDDLE',
      body: 'Find the remainder when p(x) = x³ − 3x² + 4 is divided by (x − 2).', answer: '0' },
    { source: 'Class 10 · Quadratic Equations · Q1', unit: '이차방정식', sub: '근의 공식', difficulty: 'UPPER_MIDDLE',
      body: 'Solve x² − 4x − 5 = 0 using factorisation.', answer: 'x = 5 or x = -1' },
    { source: 'Class 10 · Coordinate Geometry · Q1', unit: '도형의 방정식', sub: '직선의 방정식', difficulty: 'UPPER_MIDDLE',
      body: 'Find the midpoint of the segment joining A(-2, 4) and B(6, -2).', answer: '(2, 1)' },
    { source: 'Class 10 · Trigonometry · Q1', unit: '도형의 방정식', sub: '직선의 방정식', difficulty: 'UPPER_MIDDLE',
      body: 'In a right triangle, sin θ = 3/5. Find cos θ.', answer: '4/5' },
  ];

  const problemsSpec: ProblemSpec[] = [...featured, ...general];

  // 기존 시드 문제 삭제 후 재생성
  for (const spec of problemsSpec) {
    await prisma.problem.deleteMany({ where: { source: spec.source } });
  }

  // source → 관련 핵심 공식 (개념 패널의 공식 박스에 노출). null/비어있으면 노출 안 됨.
  const FORMULA_KO: Record<string, string> = {
    // 고3 featured
    '2024 9월 모의평가 30번': 'V = π ∫ₐᵇ [f(x)]² dx (x축 회전)',
    '수능특강 미적분 III-2-15': '∫ u dv = uv − ∫ v du',
    '2024 6월 모의평가 28번': 'P(A | B) = P(A ∩ B) / P(B)',
    '2024 9월 모의평가 21번': 'cos θ = |u·v| / (|u| · |v|)',
    '교육청 학평 18번': 't = g(x) ⇒ dt = g\'(x) dx',
    '수능기출 2023 22번': '∫ₐᵇ f(x) dx = lim Σ f(xₖ*) · Δx ; Σ k² = n(n+1)(2n+1)/6',
    '2024 6월 모의평가 21번': 'log_a A ≥ b ⇔ A ≥ a^b (a > 1, A > 0)',
    // 중1 — 정수와 유리수
    '중1 · 정수와 유리수 1': '(부호 다른 두 수 합) = (큰 |·| 부호) × (큰 |·| − 작은 |·|)',
    '중1 · 정수와 유리수 2': 'a − (−b) = a + b',
    '중1 · 정수와 유리수 3': '곱의 부호 = (−1)^(음수 개수)',
    '중1 · 정수와 유리수 4': '|x| = x (x ≥ 0), |x| = −x (x < 0)',
    '중1 · 정수와 유리수 5': '0.abc = abc / 1000 → 약분',
    // 중1 — 문자와 식
    '중1 · 문자와 식 1': 'a × x = ax (수가 문자 앞)',
    '중1 · 문자와 식 2': 'mx + nx = (m + n)x (동류항 합)',
    '중1 · 문자와 식 3': '(−a)² = a² ≠ −a²',
    '중1 · 문자와 식 4': 'a(b + c) = ab + ac, −a(b − c) = −ab + ac',
    // 중1 — 일차방정식
    '중1 · 일차방정식 1': 'ax + b = c ⇒ ax = c − b ⇒ x = (c − b) / a',
    '중1 · 일차방정식 2': 'a(x + b) = c ⇒ ax + ab = c (분배법칙 후 이항)',
    '중1 · 일차방정식 3': '−ax + b = c ⇒ −ax = c − b ⇒ x = (b − c) / a',
    '중1 · 일차방정식 4': 'x/n + b = c ⇒ x + nb = nc (양변 × n)',
    '중1 · 일차방정식 5': '정사각형 둘레 = 4 × (한 변의 길이)',
    '중1 · 일차방정식 6': '연속한 세 자연수 합 = 3 × (가운데 수) = 3x + 3',
    '중1 · 일차방정식 7': 'a : b = c : d ⇔ ad = bc',
    // 중1 — 좌표와 그래프
    '중1 · 좌표와 그래프 1': 'I(+,+), II(−,+), III(−,−), IV(+,−)',
    '중1 · 좌표와 그래프 2': '(x, y) → x축 대칭: (x, −y), y축 대칭: (−x, y), 원점 대칭: (−x, −y)',
    '중1 · 좌표와 그래프 3': 'y = ax (정비례) ⇒ a = y/x',
    '중1 · 좌표와 그래프 4': 'y = ax (a ≠ 0) → 원점을 지나는 직선, a > 0: I·III, a < 0: II·IV',
    // Class 8
    'Class 8 · Rational Numbers · Q1':     'x = 0.\\overline{abc...n}  ⇒  10ⁿx − x = (정수부) ⇒ x = (정수부)/(10ⁿ − 1)',
    'Class 8 · Algebraic Identities · Q1': '(a + b)² = a² + 2ab + b²',
    'Class 8 · Linear Equations · Q1':     'ax + b = cx + d  ⇒  (a − c)x = d − b  ⇒  x = (d − b)/(a − c)',
    'Class 8 · Graphs · Q1':               'slope m = (y₂ − y₁)/(x₂ − x₁)',
    // Class 9
    'Class 9 · Number Systems · Q1':       '√(a²·b) = a√b ;  √m + √n 은 같은 surd 일 때만 합칠 수 있음',
    'Class 9 · Polynomials · Q1':          'x² + (p+q)x + pq = (x + p)(x + q)',
    'Class 9 · Coordinate Geometry · Q1':  'd = √[(x₂ − x₁)² + (y₂ − y₁)²]',
    'Class 9 · Polynomials · Q2':          'p(c) = c 를 변수에 대입한 식의 값 (function evaluation)',
    // Class 10
    'Class 10 · Polynomials · Q1':         '(x − c) 로 나눈 나머지 = p(c)  (Remainder Theorem)',
    'Class 10 · Quadratic Equations · Q1': 'x² − (sum)x + (product) = 0  ⇒  factor as (x − r₁)(x − r₂) = 0',
    'Class 10 · Coordinate Geometry · Q1': 'midpoint M = ((x₁ + x₂)/2, (y₁ + y₂)/2)',
    'Class 10 · Trigonometry · Q1':        'sin²θ + cos²θ = 1  ⇒  cos θ = √(1 − sin²θ) (예각)',
  };

  // source → 핵심 개념 설명 (학습 피드백·오답노트 상세에 노출)
  const CONCEPT_KO: Record<string, string> = {
    // 고3 featured
    '2024 9월 모의평가 30번': '회전체의 부피는 V = π ∫ [f(x)]² dx (x축 회전). 단순 정적분(면적)이나 셸 방법(2π ∫ x f(x) dx, y축 회전)과 구별해 적용 조건을 정확히 매칭하는 것이 핵심.',
    '수능특강 미적분 III-2-15': '부분적분 ∫ u dv = uv − ∫ v du. 다항식과 지수·삼각·로그의 곱에서 자주 사용. u 와 dv 선택 후 du, v 를 정확히 계산하고 부호를 추적하는 것이 핵심.',
    '2024 6월 모의평가 28번': '조건부확률 P(A|B) = P(A∩B) / P(B). 조건이 주어지면 표본공간이 B 로 축소된다는 점이 핵심. 곱셈정리·베이즈정리와 헷갈리지 않게.',
    '2024 9월 모의평가 21번': '공간 두 직선의 사잇각: cos θ = |u·v| / (|u|·|v|). 절댓값으로 예각만 다루며, 방향벡터를 좌표 차이로 구한 뒤 내적·크기 순으로 계산.',
    '교육청 학평 18번': '치환적분 — t = g(x) 로 치환할 때 dt = g\'(x) dx 로 미분 관계식까지 함께 바꿔야 함. 적분 후 반드시 원래 변수 x 로 되돌려 표기.',
    '수능기출 2023 22번': '정적분의 정의(구분구적법): ∫ f(x) dx = lim Σ f(xₖ*) · Δx. 대표값으로 k/n, 너비 1/n 을 잡고 Σ k² = n(n+1)(2n+1)/6 같은 합 공식을 활용.',
    '2024 6월 모의평가 21번': '로그부등식 log_a A ≥ b 는 밑 a > 1 이면 A ≥ a^b, A > 0 도 함께 (정의역). 정의역과 부등식 해의 교집합이 최종 답.',
    // 중1 — 정수와 유리수
    '중1 · 정수와 유리수 1': '부호가 다른 두 수의 합 = (절댓값 큰 쪽 부호) + (큰 절댓값 − 작은 절댓값). 같은 부호 합(절댓값 더하기) 과 헷갈리지 않게.',
    '중1 · 정수와 유리수 2': '음수 뺄셈은 부호 변환: a − (−b) = a + b. 빼는 수의 부호만 바꿔 더한다. −5 의 부호는 그대로.',
    '중1 · 정수와 유리수 3': '여러 수의 곱의 부호: 음수 인수 개수가 짝수면 +, 홀수면 −. 절댓값은 모두 곱한다.',
    '중1 · 정수와 유리수 4': '|x| 는 0 으로부터의 거리 (≥ 0). 음수면 부호 반전, 양수·0 이면 그대로. 제곱과 헷갈리지 않게.',
    '중1 · 정수와 유리수 5': '소수 → 분수: 소수점 아래 자릿수만큼 10ⁿ 을 분모로 쓰고 약분. 0.4 = 4/10 = 2/5.',
    // 중1 — 문자와 식
    '중1 · 문자와 식 1': '"x 의 a배" = ax (곱셈 표현). 곱셈 기호를 생략하고 수가 문자 앞에 옴. + 와 × 를 혼동하지 않기.',
    '중1 · 문자와 식 2': '동류항 = 문자와 차수가 같은 항. 계수끼리만 더하거나 빼고, 문자 부분은 그대로 둔다.',
    '중1 · 문자와 식 3': '식의 값 계산 = 문자에 수를 대입해 사칙연산. 음수 대입 시 (−2)² = 4, −2² = −4 의 차이에 주의.',
    '중1 · 문자와 식 4': '괄호 앞 음수는 분배법칙으로 모든 항 부호 반전: −2(3x − 5) = −6x + 10. 동류항 정리로 마무리.',
    // 중1 — 일차방정식
    '중1 · 일차방정식 1': '일차방정식 풀이: ① 상수항 이항(부호 반전) ② 양변을 미지수 계수로 나눔. 이항 시 부호가 바뀐다는 점이 핵심.',
    '중1 · 일차방정식 2': '괄호 있는 일차방정식: 분배법칙으로 괄호 풀고 → 동류항 정리 → 이항 → 양변 나눔.',
    '중1 · 일차방정식 3': '음수 계수 방정식: 상수항을 먼저 이항 후 양변을 음수로 나눔. 양변에 −1 곱하기로 시작할 필요 없음.',
    '중1 · 일차방정식 4': '분수 계수 방정식: 양변에 분모의 최소공배수를 곱해 분수 제거 → 일반 일차방정식 풀이.',
    '중1 · 일차방정식 5': '문장형 → 식: 미지수 정의 → 도형/조건 공식 적용. 정사각형 둘레 = 4 × 한 변.',
    '중1 · 일차방정식 6': '연속한 자연수: x, x+1, x+2 (또는 가운데 값 기준). 합은 3x + 3 또는 3 × 가운데 값.',
    '중1 · 일차방정식 7': '비례식 a : b = c : d ⇔ b·c = a·d (내항·외항 곱이 같다). 한 항을 미지수로 두고 풀이.',
    // 중1 — 좌표와 그래프
    '중1 · 좌표와 그래프 1': '사분면: 1사분면(+,+) → 2(−,+) → 3(−,−) → 4(+,−). 반시계 방향 순서로 좌표 부호가 바뀜.',
    '중1 · 좌표와 그래프 2': 'x축 대칭: y 좌표 부호만 반전. y축 대칭은 x 부호만, 원점 대칭은 둘 다.',
    '중1 · 좌표와 그래프 3': '정비례 y = ax 의 비례상수 a = y/x. 한 점 (x, y) 만 알면 a 결정 → y = ax 식 완성.',
    '중1 · 좌표와 그래프 4': 'y = ax (a < 0): 원점을 지나는 직선이며 좌상-우하 방향 → 2사분면·4사분면 통과.',
    // Class 8 NCERT
    'Class 8 · Rational Numbers · Q1':     'Repeating decimals: multiply by 10ⁿ (n = repeating block length), subtract original, solve for x. Every repeating decimal is rational.',
    'Class 8 · Algebraic Identities · Q1': 'Square of a binomial identity: (a + b)² = a² + 2ab + b². Always check the cross-term 2ab — most-missed step.',
    'Class 8 · Linear Equations · Q1':     'Linear equation in one variable: collect x terms on one side, constants on the other (transposition flips signs), then divide.',
    'Class 8 · Graphs · Q1':               'Slope (gradient) of a line through two points = rise / run = (Δy)/(Δx). Sign of slope tells direction.',
    // Class 9 NCERT
    'Class 9 · Number Systems · Q1':       'Surds: √(a²·b) simplifies to a√b. Only like surds (same b) can be added or subtracted directly.',
    'Class 9 · Polynomials · Q1':          'Factorising a quadratic x² + bx + c: find two numbers p, q with p + q = b and pq = c. Then split bx and group.',
    'Class 9 · Coordinate Geometry · Q1':  'Distance formula derives from the Pythagorean theorem applied to the horizontal and vertical legs of the segment.',
    'Class 9 · Polynomials · Q2':          'Evaluating a polynomial at x = c means substituting and computing — a building block for the Remainder Theorem (Class 10).',
    // Class 10 NCERT
    'Class 10 · Polynomials · Q1':         'Remainder Theorem: when polynomial p(x) is divided by (x − c), the remainder equals p(c). If p(c) = 0, then (x − c) is a factor (Factor Theorem).',
    'Class 10 · Quadratic Equations · Q1': 'Solving by factorisation: write as (x − r₁)(x − r₂) = 0. Look for two numbers that multiply to the constant term and add to the linear coefficient (with sign).',
    'Class 10 · Coordinate Geometry · Q1': 'Midpoint formula: average of x-coordinates and average of y-coordinates. Section formula generalises to any ratio.',
    'Class 10 · Trigonometry · Q1':        'Pythagorean identity sin²θ + cos²θ = 1. Given one ratio, the others can be derived (mind the sign by quadrant for general angles).',
  };

  // (NCERT 신규 문제는 본문/공식이 이미 영문/수식 표기 — content-en.ts 에 별도 EN 사전 불필요)

  const problems: Record<string, string> = {};
  for (const p of problemsSpec) {
    const u = units[p.unit];
    if (!u) { console.warn(`Unit not found: ${p.unit} (skipping ${p.source})`); continue; }
    const subUnitId = p.sub ? u.subs[p.sub] : null;
    const created = await prisma.problem.create({
      data: {
        source: p.source, unitId: u.id, subUnitId,
        difficulty: p.difficulty, body: p.body, answer: p.answer,
        concept: CONCEPT_KO[p.source] ?? null,
        formula: FORMULA_KO[p.source] ?? null,
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

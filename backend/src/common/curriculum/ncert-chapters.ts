/**
 * NCERT Mathematics Class 7~12 — 챕터 마스터 데이터.
 *
 * 소스: NCERT Textbook Class VII~XII (Reprint 2024-25 / 2026-27, NCF 2005).
 * Class 9 는 PDF 동봉본 누락분으로 표준 NCERT IX 목차 기준 (학생용 핵심 12 챕터).
 *
 * 각 챕터는 ConceptLesson 1개로 시드된다. chapterCode 는 안정 식별자
 * (시드 재실행 시에도 동일성 보장). cognitiveLoad 는 시퀀스 선택과
 * UX 의 난이도 표시에 사용 (0 가벼움 ~ 3 킬러 챕터).
 *
 * koUnit 은 한국어 사용자(수능)와의 매핑 — 가능한 경우만 채움. NULL 이면
 * 해당 챕터의 ConceptLesson 은 NCERT 전용으로 노출되고, 한국 사용자 단원
 * 트리에서는 표시되지 않는다.
 */

import { NcertClass } from '@prisma/client';

export interface NcertChapter {
  ncertClass: NcertClass;
  chapterNumber: number;
  chapterCode: string;          // e.g. "C7-CH01-INTEGERS"
  titleKo: string;
  titleEn: string;
  bigIdeaKo: string;
  bigIdeaEn: string;
  cognitiveLoad: 0 | 1 | 2 | 3;
  estimatedMin: number;
  /** 선수 학습 chapterCode 리스트 (빈 배열이면 진입 가능) */
  prerequisites: string[];
  /** 한국 단원과의 매핑 (선택). 없으면 NCERT 전용. */
  koUnit?: string;
  koSubUnit?: string;
}

export const NCERT_CHAPTERS: NcertChapter[] = [
  // ============================================================
  // Class VII (한국 중1 매핑 가능)
  // ============================================================
  {
    ncertClass: 'CLASS_7', chapterNumber: 1, chapterCode: 'C7-CH01-INTEGERS',
    titleKo: '정수', titleEn: 'Integers',
    bigIdeaKo: '음수도 수직선 위의 위치로 보면, 덧셈은 이동 · 곱셈은 방향 반복으로 일관되게 해석된다.',
    bigIdeaEn: 'Negatives sit on the number line, so addition is movement and multiplication is repeated direction.',
    cognitiveLoad: 1, estimatedMin: 15, prerequisites: [],
    koUnit: '정수와 유리수', koSubUnit: '정수의 사칙연산',
  },
  {
    ncertClass: 'CLASS_7', chapterNumber: 2, chapterCode: 'C7-CH02-FRACTIONS-DECIMALS',
    titleKo: '분수와 소수', titleEn: 'Fractions and Decimals',
    bigIdeaKo: '분수와 소수는 같은 수의 다른 표기. 곱셈은 부분의 부분, 나눗셈은 단위로 묶기.',
    bigIdeaEn: 'Fractions and decimals are two notations for one number; multiply = part of a part.',
    cognitiveLoad: 1, estimatedMin: 15, prerequisites: ['C7-CH01-INTEGERS'],
    koUnit: '정수와 유리수', koSubUnit: '소수와 분수의 변환',
  },
  {
    ncertClass: 'CLASS_7', chapterNumber: 3, chapterCode: 'C7-CH03-DATA-HANDLING',
    titleKo: '자료의 정리', titleEn: 'Data Handling',
    bigIdeaKo: '평균·중앙값·최빈값은 "대푯값" — 어떤 질문에 답하느냐에 따라 다른 값을 쓴다.',
    bigIdeaEn: 'Mean, median, mode are different lenses on the same data — pick by the question.',
    cognitiveLoad: 1, estimatedMin: 12, prerequisites: [],
  },
  {
    ncertClass: 'CLASS_7', chapterNumber: 4, chapterCode: 'C7-CH04-SIMPLE-EQUATIONS',
    titleKo: '간단한 방정식', titleEn: 'Simple Equations',
    bigIdeaKo: '방정식은 "균형 잡힌 저울". 같은 연산을 양변에 하면 균형이 유지된다.',
    bigIdeaEn: 'An equation is a balanced scale — do the same to both sides to keep balance.',
    cognitiveLoad: 1, estimatedMin: 15, prerequisites: ['C7-CH01-INTEGERS'],
    koUnit: '일차방정식', koSubUnit: '일차방정식 풀이',
  },
  {
    ncertClass: 'CLASS_7', chapterNumber: 5, chapterCode: 'C7-CH05-LINES-ANGLES',
    titleKo: '직선과 각', titleEn: 'Lines and Angles',
    bigIdeaKo: '각은 회전량. 평행선과 횡단선은 동위각/엇각 관계로 같은 회전량을 공유한다.',
    bigIdeaEn: 'Angles measure rotation; parallel lines + transversal share rotation patterns.',
    cognitiveLoad: 1, estimatedMin: 15, prerequisites: [],
  },
  {
    ncertClass: 'CLASS_7', chapterNumber: 6, chapterCode: 'C7-CH06-TRIANGLE',
    titleKo: '삼각형의 성질', titleEn: 'The Triangle and its Properties',
    bigIdeaKo: '삼각형 내각의 합은 항상 180°. 변과 각은 서로 크기 순서를 공유한다.',
    bigIdeaEn: 'Interior angles sum to 180°; side and opposite-angle orders match.',
    cognitiveLoad: 1, estimatedMin: 15, prerequisites: ['C7-CH05-LINES-ANGLES'],
  },
  {
    ncertClass: 'CLASS_7', chapterNumber: 7, chapterCode: 'C7-CH07-COMPARING-QUANTITIES',
    titleKo: '비교하기 (비·백분율)', titleEn: 'Comparing Quantities',
    bigIdeaKo: '비·백분율·이자는 모두 "단위 1당 얼마"를 묻는 같은 사고의 변형.',
    bigIdeaEn: 'Ratios, percents, interest — all "how much per 1 unit".',
    cognitiveLoad: 1, estimatedMin: 12, prerequisites: ['C7-CH02-FRACTIONS-DECIMALS'],
    koUnit: '일차방정식', koSubUnit: '비례식과 활용',
  },
  {
    ncertClass: 'CLASS_7', chapterNumber: 8, chapterCode: 'C7-CH08-RATIONAL-NUMBERS',
    titleKo: '유리수', titleEn: 'Rational Numbers',
    bigIdeaKo: '유리수는 a/b (b≠0) 꼴 — 정수의 확장. 사칙연산이 모두 닫혀있다.',
    bigIdeaEn: 'Rationals = a/b (b≠0); closed under +, −, ×, ÷ (except by 0).',
    cognitiveLoad: 1, estimatedMin: 15, prerequisites: ['C7-CH02-FRACTIONS-DECIMALS'],
    koUnit: '정수와 유리수', koSubUnit: '유리수와 절댓값',
  },
  {
    ncertClass: 'CLASS_7', chapterNumber: 9, chapterCode: 'C7-CH09-PERIMETER-AREA',
    titleKo: '둘레와 넓이', titleEn: 'Perimeter and Area',
    bigIdeaKo: '둘레는 1차원 합, 넓이는 2차원 곱. 차원이 다르면 단위도 다르다.',
    bigIdeaEn: 'Perimeter is 1-D sum, area is 2-D product — dimensions and units differ.',
    cognitiveLoad: 1, estimatedMin: 12, prerequisites: [],
  },
  {
    ncertClass: 'CLASS_7', chapterNumber: 10, chapterCode: 'C7-CH10-ALG-EXPRESSIONS',
    titleKo: '대수식', titleEn: 'Algebraic Expressions',
    bigIdeaKo: '문자는 "변할 수 있는 수"의 자리. 동류항만 합칠 수 있다.',
    bigIdeaEn: 'A letter is a slot for "any number"; only like terms combine.',
    cognitiveLoad: 1, estimatedMin: 15, prerequisites: ['C7-CH01-INTEGERS'],
    koUnit: '문자와 식', koSubUnit: '동류항 정리',
  },
  {
    ncertClass: 'CLASS_7', chapterNumber: 11, chapterCode: 'C7-CH11-EXPONENTS',
    titleKo: '지수와 거듭제곱', titleEn: 'Exponents and Powers',
    bigIdeaKo: '지수는 곱셈의 반복 표기. 곱은 지수 합, 나눗셈은 지수 차.',
    bigIdeaEn: 'Exponent shorthand for repeated multiplication; product → add exponents.',
    cognitiveLoad: 1, estimatedMin: 12, prerequisites: ['C7-CH08-RATIONAL-NUMBERS'],
  },
  {
    ncertClass: 'CLASS_7', chapterNumber: 12, chapterCode: 'C7-CH12-SYMMETRY',
    titleKo: '대칭', titleEn: 'Symmetry',
    bigIdeaKo: '대칭은 "변환 후에도 똑같이 보이는" 성질. 선·회전·점 대칭.',
    bigIdeaEn: 'Symmetry = "looks the same after a transformation" (line / rotational).',
    cognitiveLoad: 0, estimatedMin: 10, prerequisites: [],
  },
  {
    ncertClass: 'CLASS_7', chapterNumber: 13, chapterCode: 'C7-CH13-SOLID-SHAPES',
    titleKo: '입체도형의 시각화', titleEn: 'Visualising Solid Shapes',
    bigIdeaKo: '3차원 물체는 면·모서리·꼭짓점으로 분해되며, 2차원 전개도로 풀 수 있다.',
    bigIdeaEn: '3-D solids decompose into faces, edges, vertices; nets flatten them.',
    cognitiveLoad: 1, estimatedMin: 12, prerequisites: [],
  },

  // ============================================================
  // Class VIII (한국 중2)
  // ============================================================
  {
    ncertClass: 'CLASS_8', chapterNumber: 1, chapterCode: 'C8-CH01-RATIONAL-NUMBERS',
    titleKo: '유리수의 성질', titleEn: 'Rational Numbers',
    bigIdeaKo: '유리수 집합 위의 +, ×는 교환·결합·분배 법칙을 모두 만족한다 (체의 구조).',
    bigIdeaEn: 'Rationals form a field: commutative, associative, distributive all hold.',
    cognitiveLoad: 1, estimatedMin: 15, prerequisites: ['C7-CH08-RATIONAL-NUMBERS'],
    koUnit: '유리수와 순환소수', koSubUnit: '순환소수와 분수',
  },
  {
    ncertClass: 'CLASS_8', chapterNumber: 2, chapterCode: 'C8-CH02-LINEAR-EQ-ONE-VAR',
    titleKo: '일변수 일차방정식', titleEn: 'Linear Equations in One Variable',
    bigIdeaKo: '이항은 양변에 같은 연산을 한 줄임표 — 부호가 바뀌는 이유다.',
    bigIdeaEn: 'Transposition = doing the same to both sides — that\'s why signs flip.',
    cognitiveLoad: 1, estimatedMin: 15, prerequisites: ['C7-CH04-SIMPLE-EQUATIONS'],
    koUnit: '식의 계산',
  },
  {
    ncertClass: 'CLASS_8', chapterNumber: 3, chapterCode: 'C8-CH03-QUADRILATERALS',
    titleKo: '사각형의 이해', titleEn: 'Understanding Quadrilaterals',
    bigIdeaKo: '사각형은 변·각의 조건으로 계층화 (사다리꼴⊂평행사변형⊂직사각형⊂정사각형).',
    bigIdeaEn: 'Quadrilaterals form a hierarchy by side/angle constraints.',
    cognitiveLoad: 1, estimatedMin: 15, prerequisites: ['C7-CH06-TRIANGLE'],
  },
  {
    ncertClass: 'CLASS_8', chapterNumber: 4, chapterCode: 'C8-CH04-DATA-HANDLING',
    titleKo: '자료의 정리 II', titleEn: 'Data Handling',
    bigIdeaKo: '히스토그램·원그래프·확률은 "자료가 어디 몰려있나"를 묻는 다른 도구.',
    bigIdeaEn: 'Histograms, pie charts, probability — different lenses on "where data lives".',
    cognitiveLoad: 1, estimatedMin: 12, prerequisites: ['C7-CH03-DATA-HANDLING'],
  },
  {
    ncertClass: 'CLASS_8', chapterNumber: 5, chapterCode: 'C8-CH05-SQUARES-ROOTS',
    titleKo: '제곱과 제곱근', titleEn: 'Squares and Square Roots',
    bigIdeaKo: '제곱근은 제곱의 역연산. 비완전제곱수의 √는 유리수가 아니다 (무리수의 단서).',
    bigIdeaEn: 'Square root undoes squaring; √n for non-perfect-square n is irrational.',
    cognitiveLoad: 1, estimatedMin: 15, prerequisites: ['C7-CH11-EXPONENTS'],
  },
  {
    ncertClass: 'CLASS_8', chapterNumber: 6, chapterCode: 'C8-CH06-CUBES-ROOTS',
    titleKo: '세제곱과 세제곱근', titleEn: 'Cubes and Cube Roots',
    bigIdeaKo: '세제곱은 부피 (3차원). 세제곱근은 음수도 1개의 실근을 가진다.',
    bigIdeaEn: 'Cubing is volume (3-D); cube root of a negative is real and unique.',
    cognitiveLoad: 1, estimatedMin: 10, prerequisites: ['C8-CH05-SQUARES-ROOTS'],
  },
  {
    ncertClass: 'CLASS_8', chapterNumber: 7, chapterCode: 'C8-CH07-COMPARING-QUANTITIES',
    titleKo: '비교하기 II (이자·할인)', titleEn: 'Comparing Quantities',
    bigIdeaKo: '복리는 "이자가 원금으로 합쳐져 다시 이자를 낳는" 구조 — 지수함수의 씨앗.',
    bigIdeaEn: 'Compound interest = interest joins principal, then earns again — exponential seed.',
    cognitiveLoad: 2, estimatedMin: 15, prerequisites: ['C7-CH07-COMPARING-QUANTITIES'],
  },
  {
    ncertClass: 'CLASS_8', chapterNumber: 8, chapterCode: 'C8-CH08-ALG-IDENTITIES',
    titleKo: '대수식과 항등식', titleEn: 'Algebraic Expressions and Identities',
    bigIdeaKo: '(a+b)²= a² + 2ab + b² — 항등식은 모든 값에서 성립하는 "변환 규칙".',
    bigIdeaEn: 'Identities like (a+b)² hold for every value — they\'re rewriting rules.',
    cognitiveLoad: 2, estimatedMin: 18, prerequisites: ['C7-CH10-ALG-EXPRESSIONS'],
    koUnit: '식의 계산', koSubUnit: '곱셈공식',
  },
  {
    ncertClass: 'CLASS_8', chapterNumber: 9, chapterCode: 'C8-CH09-MENSURATION',
    titleKo: '도형의 양 (둘레·넓이·부피)', titleEn: 'Mensuration',
    bigIdeaKo: '평면 도형은 분할-결합으로, 입체는 단면 누적으로 양을 구한다.',
    bigIdeaEn: 'Cut-and-combine for areas; cross-section stacking for volumes.',
    cognitiveLoad: 1, estimatedMin: 15, prerequisites: ['C7-CH09-PERIMETER-AREA'],
  },
  {
    ncertClass: 'CLASS_8', chapterNumber: 10, chapterCode: 'C8-CH10-EXPONENTS',
    titleKo: '지수의 확장', titleEn: 'Exponents and Powers',
    bigIdeaKo: '지수 법칙(곱·몫·거듭제곱)을 음수·0 지수까지 일관되게 확장 → 표준형 표기.',
    bigIdeaEn: 'Extend exponent laws to 0 and negative exponents consistently.',
    cognitiveLoad: 1, estimatedMin: 12, prerequisites: ['C7-CH11-EXPONENTS'],
  },
  {
    ncertClass: 'CLASS_8', chapterNumber: 11, chapterCode: 'C8-CH11-DIRECT-INVERSE',
    titleKo: '정비례·반비례', titleEn: 'Direct and Inverse Proportions',
    bigIdeaKo: '정비례: 곱이 일정 / 반비례: 합이 아니라 곱이 일정 — 두 변량의 "잠긴 관계".',
    bigIdeaEn: 'Direct: y/x constant. Inverse: x·y constant.',
    cognitiveLoad: 1, estimatedMin: 12, prerequisites: ['C7-CH07-COMPARING-QUANTITIES'],
    koUnit: '일차함수',
  },
  {
    ncertClass: 'CLASS_8', chapterNumber: 12, chapterCode: 'C8-CH12-FACTORISATION',
    titleKo: '인수분해 (입문)', titleEn: 'Factorisation',
    bigIdeaKo: '인수분해는 곱셈의 역방향. 공통인수 → 두제곱차 → 완전제곱 → 그루핑 순.',
    bigIdeaEn: 'Factorising reverses multiplication: common factor → diff. of squares → grouping.',
    cognitiveLoad: 2, estimatedMin: 18, prerequisites: ['C8-CH08-ALG-IDENTITIES'],
  },
  {
    ncertClass: 'CLASS_8', chapterNumber: 13, chapterCode: 'C8-CH13-GRAPHS',
    titleKo: '그래프 입문', titleEn: 'Introduction to Graphs',
    bigIdeaKo: '좌표평면은 "두 수의 관계"를 위치로 본다. 직선은 일정 변화율의 시각화.',
    bigIdeaEn: 'The coordinate plane turns number pairs into positions; a line is constant change.',
    cognitiveLoad: 1, estimatedMin: 12, prerequisites: ['C8-CH11-DIRECT-INVERSE'],
    koUnit: '일차함수', koSubUnit: '기울기와 절편',
  },

  // ============================================================
  // Class IX (PDF 누락 — 표준 NCERT 9 기준)
  // ============================================================
  {
    ncertClass: 'CLASS_9', chapterNumber: 1, chapterCode: 'C9-CH01-NUMBER-SYSTEMS',
    titleKo: '수의 체계 (실수)', titleEn: 'Number Systems',
    bigIdeaKo: '실수 = 유리수 ∪ 무리수. 수직선의 모든 점이 실수와 1:1 대응한다 (완비성).',
    bigIdeaEn: 'Real numbers fill the line — rationals + irrationals (completeness).',
    cognitiveLoad: 2, estimatedMin: 18, prerequisites: ['C8-CH05-SQUARES-ROOTS'],
    koUnit: '제곱근과 실수', koSubUnit: '무리수와 실수',
  },
  {
    ncertClass: 'CLASS_9', chapterNumber: 2, chapterCode: 'C9-CH02-POLYNOMIALS',
    titleKo: '다항식', titleEn: 'Polynomials',
    bigIdeaKo: '다항식은 단항의 합. 인수분해는 다항식을 일차식으로 쪼개는 분해.',
    bigIdeaEn: 'A polynomial is a sum of monomials; factoring decomposes it into linear pieces.',
    cognitiveLoad: 2, estimatedMin: 18, prerequisites: ['C8-CH12-FACTORISATION'],
    koUnit: '인수분해', koSubUnit: '인수분해 공식',
  },
  {
    ncertClass: 'CLASS_9', chapterNumber: 3, chapterCode: 'C9-CH03-COORDINATE-GEOM',
    titleKo: '좌표기하 입문', titleEn: 'Coordinate Geometry',
    bigIdeaKo: '거리·중점·기울기 — 기하 문제를 좌표로 옮기면 대수가 된다 (해석기하).',
    bigIdeaEn: 'Coordinates turn geometry into algebra (distance, midpoint, slope).',
    cognitiveLoad: 1, estimatedMin: 15, prerequisites: ['C8-CH13-GRAPHS'],
    koUnit: '좌표평면과 그래프', koSubUnit: '순서쌍과 좌표',
  },
  {
    ncertClass: 'CLASS_9', chapterNumber: 4, chapterCode: 'C9-CH04-LINEAR-EQ-TWO-VAR',
    titleKo: '두 변수 일차방정식', titleEn: 'Linear Equations in Two Variables',
    bigIdeaKo: 'ax+by=c 의 해는 좌표평면 위의 직선 — 미지수가 늘면 차원이 늘어난다.',
    bigIdeaEn: 'Solutions of ax+by=c form a line in the plane.',
    cognitiveLoad: 1, estimatedMin: 15, prerequisites: ['C8-CH02-LINEAR-EQ-ONE-VAR', 'C9-CH03-COORDINATE-GEOM'],
  },
  {
    ncertClass: 'CLASS_9', chapterNumber: 5, chapterCode: 'C9-CH05-EUCLID',
    titleKo: '유클리드 기하의 공준', titleEn: "Introduction to Euclid's Geometry",
    bigIdeaKo: '공리(자명한 가정) → 정리(증명된 명제). 수학적 증명의 기본 구조.',
    bigIdeaEn: 'Axioms (taken as given) → theorems (proved): the spine of mathematical proof.',
    cognitiveLoad: 1, estimatedMin: 12, prerequisites: [],
  },
  {
    ncertClass: 'CLASS_9', chapterNumber: 6, chapterCode: 'C9-CH06-LINES-ANGLES-II',
    titleKo: '직선과 각 II', titleEn: 'Lines and Angles',
    bigIdeaKo: '평행선·삼각형 외각·각의 합 정리 — 사실들이 서로 도출되는 증명 사슬.',
    bigIdeaEn: 'Parallel-line angle facts chain together into formal proofs.',
    cognitiveLoad: 1, estimatedMin: 12, prerequisites: ['C7-CH05-LINES-ANGLES'],
  },
  {
    ncertClass: 'CLASS_9', chapterNumber: 7, chapterCode: 'C9-CH07-TRIANGLES-II',
    titleKo: '삼각형 (합동)', titleEn: 'Triangles',
    bigIdeaKo: '합동 판정(SSS, SAS, ASA, RHS) — 일부 정보만으로 전체 일치를 보장하는 조건.',
    bigIdeaEn: 'Congruence tests (SSS, SAS, ASA, RHS) — partial info forces full match.',
    cognitiveLoad: 2, estimatedMin: 18, prerequisites: ['C8-CH03-QUADRILATERALS'],
  },
  {
    ncertClass: 'CLASS_9', chapterNumber: 8, chapterCode: 'C9-CH08-QUADRILATERALS',
    titleKo: '사각형 (성질·증명)', titleEn: 'Quadrilaterals',
    bigIdeaKo: '평행사변형의 성질은 모두 한 정의에서 도출된다. 중점 연결 정리는 자주 쓰는 무기.',
    bigIdeaEn: 'Parallelogram properties cascade from one definition; mid-point theorem is key.',
    cognitiveLoad: 1, estimatedMin: 15, prerequisites: ['C9-CH07-TRIANGLES-II'],
  },
  {
    ncertClass: 'CLASS_9', chapterNumber: 9, chapterCode: 'C9-CH09-CIRCLES',
    titleKo: '원', titleEn: 'Circles',
    bigIdeaKo: '원주각의 핵심: 같은 호 위의 원주각은 모두 같다 — 등각의 원리.',
    bigIdeaEn: 'Inscribed angles on the same arc are equal — the key invariant of circles.',
    cognitiveLoad: 2, estimatedMin: 15, prerequisites: ['C9-CH07-TRIANGLES-II'],
  },
  {
    ncertClass: 'CLASS_9', chapterNumber: 10, chapterCode: 'C9-CH10-HERON',
    titleKo: '헤론의 공식', titleEn: "Heron's Formula",
    bigIdeaKo: '세 변만으로 넓이를 구하는 공식 — 높이를 모를 때의 강력한 우회.',
    bigIdeaEn: 'Area from three sides only — bypasses the need for height.',
    cognitiveLoad: 1, estimatedMin: 10, prerequisites: ['C8-CH05-SQUARES-ROOTS'],
  },
  {
    ncertClass: 'CLASS_9', chapterNumber: 11, chapterCode: 'C9-CH11-SURFACE-VOLUME',
    titleKo: '겉넓이와 부피', titleEn: 'Surface Areas and Volumes',
    bigIdeaKo: '입체의 양 = 단면 × 길이 (각기둥) 또는 ⅓ × 밑면 × 높이 (각뿔·원뿔).',
    bigIdeaEn: 'Solid volume = cross-section × length, or 1/3 × base × height for cones/pyramids.',
    cognitiveLoad: 1, estimatedMin: 15, prerequisites: ['C8-CH09-MENSURATION'],
  },
  {
    ncertClass: 'CLASS_9', chapterNumber: 12, chapterCode: 'C9-CH12-STATISTICS',
    titleKo: '통계 입문', titleEn: 'Statistics',
    bigIdeaKo: '도수분포·중심측도·산포 — 자료를 "한 점"으로 압축하기 위한 도구들.',
    bigIdeaEn: 'Frequency, central tendency, spread — three lenses on summarising data.',
    cognitiveLoad: 1, estimatedMin: 12, prerequisites: ['C8-CH04-DATA-HANDLING'],
  },

  // ============================================================
  // Class X (한국 고1)
  // ============================================================
  {
    ncertClass: 'CLASS_10', chapterNumber: 1, chapterCode: 'C10-CH01-REAL-NUMBERS',
    titleKo: '실수 II (산술의 기본정리)', titleEn: 'Real Numbers',
    bigIdeaKo: '모든 자연수는 소인수분해가 유일하다 (산술의 기본정리). √2의 무리성 증명 도구.',
    bigIdeaEn: 'Fundamental theorem of arithmetic — unique prime factorisation; proves √2 irrational.',
    cognitiveLoad: 2, estimatedMin: 18, prerequisites: ['C9-CH01-NUMBER-SYSTEMS'],
    koUnit: '제곱근과 실수',
  },
  {
    ncertClass: 'CLASS_10', chapterNumber: 2, chapterCode: 'C10-CH02-POLYNOMIALS',
    titleKo: '다항식 II (영점·계수 관계)', titleEn: 'Polynomials',
    bigIdeaKo: '계수와 영점의 관계 (Vieta) — 근들을 직접 풀지 않아도 합·곱을 안다.',
    bigIdeaEn: 'Vieta\'s relations — root sums/products from coefficients without solving.',
    cognitiveLoad: 2, estimatedMin: 15, prerequisites: ['C9-CH02-POLYNOMIALS'],
    koUnit: '다항식', koSubUnit: '나머지정리',
  },
  {
    ncertClass: 'CLASS_10', chapterNumber: 3, chapterCode: 'C10-CH03-LINEAR-EQ-PAIRS',
    titleKo: '두 변수 일차연립방정식', titleEn: 'Pair of Linear Equations in Two Variables',
    bigIdeaKo: '두 직선의 위치(교차·평행·일치)가 해의 개수(유일·없음·무수)를 결정한다.',
    bigIdeaEn: 'Two lines\' relative position dictates the number of solutions.',
    cognitiveLoad: 1, estimatedMin: 15, prerequisites: ['C9-CH04-LINEAR-EQ-TWO-VAR'],
    koUnit: '방정식과 부등식',
  },
  {
    ncertClass: 'CLASS_10', chapterNumber: 4, chapterCode: 'C10-CH04-QUADRATIC-EQ',
    titleKo: '이차방정식', titleEn: 'Quadratic Equations',
    bigIdeaKo: '근의 공식·판별식. 판별식의 부호가 실근/중근/허근을 모두 결정.',
    bigIdeaEn: 'The quadratic formula & discriminant — sign of D decides real / repeated / complex.',
    cognitiveLoad: 2, estimatedMin: 18, prerequisites: ['C8-CH12-FACTORISATION'],
    koUnit: '이차방정식', koSubUnit: '근의 공식',
  },
  {
    ncertClass: 'CLASS_10', chapterNumber: 5, chapterCode: 'C10-CH05-AP',
    titleKo: '등차수열 (A.P.)', titleEn: 'Arithmetic Progressions',
    bigIdeaKo: '등차수열은 "공차 d 만큼 일정한 증가". 일반항 aₙ=a+(n−1)d, 합 Sₙ=n/2(2a+(n−1)d).',
    bigIdeaEn: 'Arithmetic progression — constant step d. aₙ = a+(n-1)d, Sₙ = n/2[2a+(n-1)d].',
    cognitiveLoad: 1, estimatedMin: 15, prerequisites: [],
  },
  {
    ncertClass: 'CLASS_10', chapterNumber: 6, chapterCode: 'C10-CH06-TRIANGLES-III',
    titleKo: '삼각형의 닮음', titleEn: 'Triangles (Similarity)',
    bigIdeaKo: '닮음 = 크기 무관, 각만 동일. 닮음비가 변·넓이·부피에 다른 지수로 적용된다.',
    bigIdeaEn: 'Similarity preserves shape; ratios apply with different powers to length/area/volume.',
    cognitiveLoad: 2, estimatedMin: 18, prerequisites: ['C9-CH07-TRIANGLES-II'],
  },
  {
    ncertClass: 'CLASS_10', chapterNumber: 7, chapterCode: 'C10-CH07-COORDINATE-GEOM-II',
    titleKo: '좌표기하 II (분점·넓이)', titleEn: 'Coordinate Geometry',
    bigIdeaKo: '내분·외분 공식과 좌표 삼각형 넓이 공식 — 평면의 점을 무기로 거리·넓이 계산.',
    bigIdeaEn: 'Section formula and coordinate triangle area — full algebraic toolkit on the plane.',
    cognitiveLoad: 1, estimatedMin: 15, prerequisites: ['C9-CH03-COORDINATE-GEOM'],
    koUnit: '도형의 방정식',
  },
  {
    ncertClass: 'CLASS_10', chapterNumber: 8, chapterCode: 'C10-CH08-TRIG-INTRO',
    titleKo: '삼각비 입문', titleEn: 'Introduction to Trigonometry',
    bigIdeaKo: 'sin·cos·tan = 직각삼각형의 변 비율. 같은 각이면 삼각형 크기와 무관.',
    bigIdeaEn: 'sin/cos/tan = side ratios in a right triangle — same angle, same ratio.',
    cognitiveLoad: 2, estimatedMin: 18, prerequisites: ['C10-CH06-TRIANGLES-III'],
  },
  {
    ncertClass: 'CLASS_10', chapterNumber: 9, chapterCode: 'C10-CH09-TRIG-APPLICATIONS',
    titleKo: '삼각비의 활용', titleEn: 'Some Applications of Trigonometry',
    bigIdeaKo: '높이·거리 문제는 모두 한 직각삼각형을 그리는 데서 시작한다.',
    bigIdeaEn: 'Height/distance problems all start with one right triangle.',
    cognitiveLoad: 1, estimatedMin: 12, prerequisites: ['C10-CH08-TRIG-INTRO'],
  },
  {
    ncertClass: 'CLASS_10', chapterNumber: 10, chapterCode: 'C10-CH10-CIRCLES-II',
    titleKo: '원 II (접선)', titleEn: 'Circles',
    bigIdeaKo: '접선은 반지름과 직교한다 — 원과 직선 문제의 핵심 사실.',
    bigIdeaEn: 'A tangent is perpendicular to the radius at the point of contact.',
    cognitiveLoad: 1, estimatedMin: 10, prerequisites: ['C9-CH09-CIRCLES'],
  },
  {
    ncertClass: 'CLASS_10', chapterNumber: 11, chapterCode: 'C10-CH11-AREAS-CIRCLES',
    titleKo: '원과 관련된 넓이', titleEn: 'Areas Related to Circles',
    bigIdeaKo: '부채꼴은 원의 일부 — 중심각/360° 비율로 넓이·호 길이가 결정된다.',
    bigIdeaEn: 'Sector = a fraction of a circle scaled by (angle / 360°).',
    cognitiveLoad: 1, estimatedMin: 12, prerequisites: ['C10-CH10-CIRCLES-II'],
  },
  {
    ncertClass: 'CLASS_10', chapterNumber: 12, chapterCode: 'C10-CH12-SURFACE-VOLUME-II',
    titleKo: '겉넓이·부피 (합성도형)', titleEn: 'Surface Areas and Volumes',
    bigIdeaKo: '합성 입체는 분해하면 표준 입체들의 합·차 — 단면의 변화로 부피를 추적.',
    bigIdeaEn: 'Composite solids decompose into standard solids; track cross-section changes.',
    cognitiveLoad: 1, estimatedMin: 12, prerequisites: ['C9-CH11-SURFACE-VOLUME'],
  },
  {
    ncertClass: 'CLASS_10', chapterNumber: 13, chapterCode: 'C10-CH13-STATISTICS-II',
    titleKo: '통계 II (평균·중앙값·최빈값)', titleEn: 'Statistics',
    bigIdeaKo: '도수분포표에서의 대푯값 계산 — 동일 자료를 다른 압축으로 본다.',
    bigIdeaEn: 'Mean, median, mode from grouped data — different summaries of the same set.',
    cognitiveLoad: 1, estimatedMin: 12, prerequisites: ['C9-CH12-STATISTICS'],
  },
  {
    ncertClass: 'CLASS_10', chapterNumber: 14, chapterCode: 'C10-CH14-PROBABILITY',
    titleKo: '확률 입문', titleEn: 'Probability',
    bigIdeaKo: '확률 = (유리한 경우) / (모든 경우) — 단, 모든 경우가 "동일하게 가능"할 때.',
    bigIdeaEn: 'Probability = favourable / total — provided outcomes are equally likely.',
    cognitiveLoad: 1, estimatedMin: 12, prerequisites: ['C8-CH04-DATA-HANDLING'],
  },

  // ============================================================
  // Class XI (한국 고2)
  // ============================================================
  {
    ncertClass: 'CLASS_11', chapterNumber: 1, chapterCode: 'C11-CH01-SETS',
    titleKo: '집합', titleEn: 'Sets',
    bigIdeaKo: '집합은 잘 정의된 모임. 합·교·차·여집합으로 새로운 모임을 만든다 (대수 구조).',
    bigIdeaEn: 'A set is a well-defined collection; operations build new sets algebraically.',
    cognitiveLoad: 1, estimatedMin: 15, prerequisites: [],
  },
  {
    ncertClass: 'CLASS_11', chapterNumber: 2, chapterCode: 'C11-CH02-RELATIONS-FUNCTIONS',
    titleKo: '관계와 함수', titleEn: 'Relations and Functions',
    bigIdeaKo: '함수 f: A→B 는 "각 입력에 유일한 출력"을 약속한 관계 — 정의역·치역 구분.',
    bigIdeaEn: 'A function assigns each input one output; domain ≠ range.',
    cognitiveLoad: 2, estimatedMin: 18, prerequisites: ['C11-CH01-SETS'],
    koUnit: '함수와 그래프', koSubUnit: '함수의 정의',
  },
  {
    ncertClass: 'CLASS_11', chapterNumber: 3, chapterCode: 'C11-CH03-TRIG-FUNCTIONS',
    titleKo: '삼각함수 (일반각)', titleEn: 'Trigonometric Functions',
    bigIdeaKo: '단위원 위의 (cos θ, sin θ) — 직각삼각형 정의를 모든 각으로 확장.',
    bigIdeaEn: 'Unit-circle (cos θ, sin θ) extends right-triangle definitions to all angles.',
    cognitiveLoad: 2, estimatedMin: 20, prerequisites: ['C10-CH08-TRIG-INTRO'],
    koUnit: '삼각함수',
  },
  {
    ncertClass: 'CLASS_11', chapterNumber: 4, chapterCode: 'C11-CH04-COMPLEX',
    titleKo: '복소수와 이차방정식', titleEn: 'Complex Numbers and Quadratic Equations',
    bigIdeaKo: '복소수는 √(−1) = i 의 도입으로 모든 다항식이 근을 갖게 한다 (대수의 완비).',
    bigIdeaEn: 'Introducing i = √(−1) makes every polynomial solvable (algebraic closure).',
    cognitiveLoad: 2, estimatedMin: 18, prerequisites: ['C10-CH04-QUADRATIC-EQ'],
  },
  {
    ncertClass: 'CLASS_11', chapterNumber: 5, chapterCode: 'C11-CH05-LINEAR-INEQ',
    titleKo: '일차부등식', titleEn: 'Linear Inequalities',
    bigIdeaKo: '부등식의 양변에 음수를 곱하면 부등호 방향이 뒤집힌다 — 풀이 절차의 단 한 가지 함정.',
    bigIdeaEn: 'Multiplying by a negative flips the inequality sign — the one trap.',
    cognitiveLoad: 1, estimatedMin: 12, prerequisites: ['C8-CH02-LINEAR-EQ-ONE-VAR'],
    koUnit: '일차부등식',
  },
  {
    ncertClass: 'CLASS_11', chapterNumber: 6, chapterCode: 'C11-CH06-PERMUTATIONS',
    titleKo: '순열과 조합', titleEn: 'Permutations and Combinations',
    bigIdeaKo: '순열: 순서 중요 / 조합: 순서 무시. "선택 vs 배열"의 구분이 모든 것.',
    bigIdeaEn: 'Permutation = ordered, combination = unordered — the distinction governs all.',
    cognitiveLoad: 2, estimatedMin: 18, prerequisites: ['C11-CH01-SETS'],
  },
  {
    ncertClass: 'CLASS_11', chapterNumber: 7, chapterCode: 'C11-CH07-BINOMIAL',
    titleKo: '이항정리', titleEn: 'Binomial Theorem',
    bigIdeaKo: '(a+b)ⁿ 의 전개 계수는 ⁿCᵣ — 파스칼 삼각형의 수학적 본질.',
    bigIdeaEn: 'Binomial coefficients ⁿCᵣ — Pascal\'s triangle made formal.',
    cognitiveLoad: 2, estimatedMin: 18, prerequisites: ['C11-CH06-PERMUTATIONS'],
  },
  {
    ncertClass: 'CLASS_11', chapterNumber: 8, chapterCode: 'C11-CH08-SEQUENCES',
    titleKo: '수열과 급수', titleEn: 'Sequences and Series',
    bigIdeaKo: '등차·등비수열은 가산구조의 두 원형. Σ 표기는 합을 한 줄로 압축한다.',
    bigIdeaEn: 'A.P. and G.P. are the two prototypes; Σ compresses any sum into one expression.',
    cognitiveLoad: 2, estimatedMin: 18, prerequisites: ['C10-CH05-AP'],
    koUnit: '수열',
  },
  {
    ncertClass: 'CLASS_11', chapterNumber: 9, chapterCode: 'C11-CH09-STRAIGHT-LINES',
    titleKo: '직선의 방정식', titleEn: 'Straight Lines',
    bigIdeaKo: '한 직선은 (점, 기울기)·(두 점)·(절편) 등 여러 표현이 가능 — 같은 직선의 다른 옷.',
    bigIdeaEn: 'A line has many forms (point-slope, two-point, intercept) — all the same line.',
    cognitiveLoad: 1, estimatedMin: 15, prerequisites: ['C10-CH07-COORDINATE-GEOM-II'],
    koUnit: '도형의 방정식', koSubUnit: '직선의 방정식',
  },
  {
    ncertClass: 'CLASS_11', chapterNumber: 10, chapterCode: 'C11-CH10-CONIC',
    titleKo: '원뿔곡선', titleEn: 'Conic Sections',
    bigIdeaKo: '원·타원·포물선·쌍곡선은 모두 평면과 원뿔의 절단면 — 이심률 e 한 값이 종류를 결정.',
    bigIdeaEn: 'Circle, ellipse, parabola, hyperbola — slices of a cone; eccentricity e decides type.',
    cognitiveLoad: 3, estimatedMin: 22, prerequisites: ['C11-CH09-STRAIGHT-LINES'],
  },
  {
    ncertClass: 'CLASS_11', chapterNumber: 11, chapterCode: 'C11-CH11-3D-INTRO',
    titleKo: '공간기하 입문', titleEn: 'Introduction to Three Dimensional Geometry',
    bigIdeaKo: '평면에 z 축을 더하면 공간 — 거리·중점 공식이 차원만큼 확장된다.',
    bigIdeaEn: 'Adding a z-axis to the plane gives 3-D space; formulas extend by dimension.',
    cognitiveLoad: 1, estimatedMin: 12, prerequisites: ['C10-CH07-COORDINATE-GEOM-II'],
  },
  {
    ncertClass: 'CLASS_11', chapterNumber: 12, chapterCode: 'C11-CH12-LIMITS-DERIVATIVES',
    titleKo: '극한과 미분 입문', titleEn: 'Limits and Derivatives',
    bigIdeaKo: '극한 = "가까이 다가갈 때 값". 미분은 그 한계로 만든 순간 변화율.',
    bigIdeaEn: 'A limit is "the value as you approach"; the derivative is the instantaneous rate.',
    cognitiveLoad: 3, estimatedMin: 25, prerequisites: ['C11-CH02-RELATIONS-FUNCTIONS'],
    koUnit: '함수의 극한',
  },
  {
    ncertClass: 'CLASS_11', chapterNumber: 13, chapterCode: 'C11-CH13-STATISTICS-III',
    titleKo: '통계 III (분산·표준편차)', titleEn: 'Statistics',
    bigIdeaKo: '분산은 평균에서 떨어진 거리의 평균. 표준편차는 그 √ — 자료의 "흩어짐 척도".',
    bigIdeaEn: 'Variance = average squared deviation; standard deviation = its √.',
    cognitiveLoad: 1, estimatedMin: 15, prerequisites: ['C10-CH13-STATISTICS-II'],
  },
  {
    ncertClass: 'CLASS_11', chapterNumber: 14, chapterCode: 'C11-CH14-PROBABILITY-II',
    titleKo: '확률 II (사건의 대수)', titleEn: 'Probability',
    bigIdeaKo: 'P(A∪B) = P(A)+P(B)−P(A∩B) — 사건도 집합처럼 대수 연산을 따른다.',
    bigIdeaEn: 'Events obey set-algebra: P(A∪B) = P(A)+P(B)−P(A∩B).',
    cognitiveLoad: 2, estimatedMin: 18, prerequisites: ['C10-CH14-PROBABILITY', 'C11-CH01-SETS'],
  },

  // ============================================================
  // Class XII (한국 고3)
  // ============================================================
  {
    ncertClass: 'CLASS_12', chapterNumber: 1, chapterCode: 'C12-CH01-RELATIONS-FUNCTIONS-II',
    titleKo: '관계와 함수 II', titleEn: 'Relations and Functions',
    bigIdeaKo: '일대일·위로의·역함수·합성 — 함수의 구조적 성질을 분류한다.',
    bigIdeaEn: 'Bijection, inverse, composition — classifying functions by structure.',
    cognitiveLoad: 2, estimatedMin: 18, prerequisites: ['C11-CH02-RELATIONS-FUNCTIONS'],
  },
  {
    ncertClass: 'CLASS_12', chapterNumber: 2, chapterCode: 'C12-CH02-INV-TRIG',
    titleKo: '역삼각함수', titleEn: 'Inverse Trigonometric Functions',
    bigIdeaKo: '주값(principal value)을 정해야 삼각함수의 역함수가 함수로 성립한다.',
    bigIdeaEn: 'Inverse trig requires choosing a principal range to be a true function.',
    cognitiveLoad: 2, estimatedMin: 15, prerequisites: ['C11-CH03-TRIG-FUNCTIONS'],
  },
  {
    ncertClass: 'CLASS_12', chapterNumber: 3, chapterCode: 'C12-CH03-MATRICES',
    titleKo: '행렬', titleEn: 'Matrices',
    bigIdeaKo: '행렬은 "수의 표"이자 "선형변환의 표기" — 곱셈은 합성이다 (비가환).',
    bigIdeaEn: 'A matrix is both a table and a linear map; multiplication is composition (non-commutative).',
    cognitiveLoad: 2, estimatedMin: 20, prerequisites: ['C10-CH03-LINEAR-EQ-PAIRS'],
  },
  {
    ncertClass: 'CLASS_12', chapterNumber: 4, chapterCode: 'C12-CH04-DETERMINANTS',
    titleKo: '행렬식', titleEn: 'Determinants',
    bigIdeaKo: '행렬식은 "변환이 면적/부피를 얼마나 확대하는가" — 0이면 역행렬 없음.',
    bigIdeaEn: 'Determinant = volume scale of the transformation; zero ⇒ non-invertible.',
    cognitiveLoad: 3, estimatedMin: 20, prerequisites: ['C12-CH03-MATRICES'],
  },
  {
    ncertClass: 'CLASS_12', chapterNumber: 5, chapterCode: 'C12-CH05-CONTINUITY-DIFF',
    titleKo: '연속과 미분가능성', titleEn: 'Continuity and Differentiability',
    bigIdeaKo: '미분 가능 ⇒ 연속. 역은 거짓 (|x|는 0에서 연속이나 미분 불가능).',
    bigIdeaEn: 'Differentiable ⇒ continuous, but not vice-versa (|x| at 0 is the canonical case).',
    cognitiveLoad: 3, estimatedMin: 25, prerequisites: ['C11-CH12-LIMITS-DERIVATIVES'],
    koUnit: '미적분 I', koSubUnit: '도함수',
  },
  {
    ncertClass: 'CLASS_12', chapterNumber: 6, chapterCode: 'C12-CH06-APP-DERIVATIVES',
    titleKo: '미분의 활용', titleEn: 'Application of Derivatives',
    bigIdeaKo: '도함수는 증감·극값·접선의 도구. 임계점은 후보일 뿐, 2계 도함수가 판정한다.',
    bigIdeaEn: 'The derivative diagnoses monotonicity, extrema, tangents; 2nd derivative confirms.',
    cognitiveLoad: 3, estimatedMin: 22, prerequisites: ['C12-CH05-CONTINUITY-DIFF'],
    koUnit: '미적분 I', koSubUnit: '미분의 활용',
  },
  {
    ncertClass: 'CLASS_12', chapterNumber: 7, chapterCode: 'C12-CH07-INTEGRALS',
    titleKo: '적분', titleEn: 'Integrals',
    bigIdeaKo: '적분 = 미분의 역연산이자 "누적된 양". 치환·부분적분은 변수 변환의 두 큰 도구.',
    bigIdeaEn: 'Integration reverses differentiation and accumulates quantity; substitution & parts are the levers.',
    cognitiveLoad: 3, estimatedMin: 25, prerequisites: ['C12-CH05-CONTINUITY-DIFF'],
    koUnit: '미적분 II', koSubUnit: '치환적분',
  },
  {
    ncertClass: 'CLASS_12', chapterNumber: 8, chapterCode: 'C12-CH08-APP-INTEGRALS',
    titleKo: '적분의 활용', titleEn: 'Application of Integrals',
    bigIdeaKo: '곡선 아래 면적·회전체 부피 — 정적분으로 기하량을 "누적"한다.',
    bigIdeaEn: 'Definite integrals accumulate geometric quantities (area, volume of revolution).',
    cognitiveLoad: 3, estimatedMin: 22, prerequisites: ['C12-CH07-INTEGRALS'],
    koUnit: '미적분 II', koSubUnit: '정적분의 활용',
  },
  {
    ncertClass: 'CLASS_12', chapterNumber: 9, chapterCode: 'C12-CH09-DIFF-EQ',
    titleKo: '미분방정식', titleEn: 'Differential Equations',
    bigIdeaKo: '미지함수가 자기 미분과 같이 등장하는 식 — 변수분리는 가장 쉬운 풀이 도구.',
    bigIdeaEn: 'An equation where the unknown is a function relating itself to its derivatives.',
    cognitiveLoad: 3, estimatedMin: 22, prerequisites: ['C12-CH07-INTEGRALS'],
  },
  {
    ncertClass: 'CLASS_12', chapterNumber: 10, chapterCode: 'C12-CH10-VECTORS',
    titleKo: '벡터대수', titleEn: 'Vector Algebra',
    bigIdeaKo: '벡터는 (크기, 방향). 내적은 "투영", 외적은 "회전으로 만든 면적".',
    bigIdeaEn: 'Vectors carry magnitude + direction; dot = projection, cross = swept area.',
    cognitiveLoad: 3, estimatedMin: 22, prerequisites: ['C11-CH11-3D-INTRO'],
    koUnit: '기하·벡터', koSubUnit: '공간벡터',
  },
  {
    ncertClass: 'CLASS_12', chapterNumber: 11, chapterCode: 'C12-CH11-3D-GEOM',
    titleKo: '공간기하 II', titleEn: 'Three Dimensional Geometry',
    bigIdeaKo: '공간 직선·평면의 방정식은 벡터의 평행·법선 언어로 통일된다.',
    bigIdeaEn: 'Lines and planes in 3-D: a unified vector language (parallel + normal).',
    cognitiveLoad: 3, estimatedMin: 22, prerequisites: ['C12-CH10-VECTORS'],
    koUnit: '기하·벡터', koSubUnit: '공간도형',
  },
  {
    ncertClass: 'CLASS_12', chapterNumber: 12, chapterCode: 'C12-CH12-LP',
    titleKo: '선형계획법', titleEn: 'Linear Programming',
    bigIdeaKo: '제약(부등식들)이 만드는 다각형 영역의 꼭짓점에서 최적해가 나온다.',
    bigIdeaEn: 'Optimal points of a constrained linear objective sit on vertices of the feasible polygon.',
    cognitiveLoad: 2, estimatedMin: 18, prerequisites: ['C11-CH05-LINEAR-INEQ'],
  },
  {
    ncertClass: 'CLASS_12', chapterNumber: 13, chapterCode: 'C12-CH13-PROBABILITY-III',
    titleKo: '확률 III (조건부·베이즈)', titleEn: 'Probability',
    bigIdeaKo: '조건부확률 P(A|B) 와 베이즈 — "사후"가 "사전"을 어떻게 갱신하는가.',
    bigIdeaEn: 'Conditional probability + Bayes — how new evidence updates prior belief.',
    cognitiveLoad: 3, estimatedMin: 25, prerequisites: ['C11-CH14-PROBABILITY-II'],
    koUnit: '확률·통계', koSubUnit: '조건부확률',
  },
];

/** chapterCode → NcertChapter 빠른 조회 */
export const NCERT_BY_CODE: Record<string, NcertChapter> = Object.fromEntries(
  NCERT_CHAPTERS.map((c) => [c.chapterCode, c]),
);

/** NCERT 학년 → 챕터 리스트 */
export const NCERT_BY_CLASS: Record<NcertClass, NcertChapter[]> = NCERT_CHAPTERS.reduce(
  (acc, c) => {
    (acc[c.ncertClass] ||= []).push(c);
    return acc;
  },
  {} as Record<NcertClass, NcertChapter[]>,
);

/** NCERT Class → 한국 GradeLevel 매핑 (1:1) */
export const NCERT_TO_KO_GRADE: Record<NcertClass, 'G_MIDDLE_1' | 'G_MIDDLE_2' | 'G_MIDDLE_3' | 'G_HIGH_1' | 'G_HIGH_2' | 'G_HIGH_3'> = {
  CLASS_7:  'G_MIDDLE_1',
  CLASS_8:  'G_MIDDLE_2',
  CLASS_9:  'G_MIDDLE_3',
  CLASS_10: 'G_HIGH_1',
  CLASS_11: 'G_HIGH_2',
  CLASS_12: 'G_HIGH_3',
};

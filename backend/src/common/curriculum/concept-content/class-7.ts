/**
 * Class 7 (NCERT VII) — 챕터별 개념학습 콘텐츠 (production grade).
 * 모든 13 챕터 7단계 완비.
 */

import { ChapterContentMap } from './types';

export const CLASS_7_CONTENT: ChapterContentMap = {
  'C7-CH01-INTEGERS': {
    hook: {
      ko: '온도가 영하로 내려가거나 엘리베이터가 지하로 내려갈 때, 그 양을 어떻게 수로 적을까? 음수가 답이다.',
      en: 'How do we write a temperature below zero or a basement floor? Negative numbers solve this.',
    },
    concrete: {
      ko: '서울 −5°C, 두바이 +35°C. 두 도시 차이 = 35 − (−5) = 40°C. 음수 빼기는 부호 바꾼 더하기.',
      en: 'Seoul −5°C, Dubai +35°C. Difference = 35 − (−5) = 40°C. Subtracting a negative = adding.',
    },
    pictorial: {
      ko: '수직선: 0 왼쪽 음수, 오른쪽 양수. 덧셈 = 오른쪽 이동, 뺄셈 = 왼쪽 이동.',
      en: 'Number line: negatives left of 0, positives right. Adding = move right, subtracting = move left.',
    },
    abstract: {
      ko: '정수 ℤ = {…, −2, −1, 0, 1, 2, …}. 부호가 같은 두 수: 절댓값 합·공통 부호. 부호가 다른 두 수: 절댓값 차·큰 쪽 부호.',
      en: 'Integers ℤ = {…, −2, −1, 0, 1, 2, …}. Same signs ⇒ add absolute values, keep sign. Different signs ⇒ subtract, keep sign of larger |·|.',
    },
    worked: {
      ko: '계산: (−7) + (+4)',
      en: 'Compute: (−7) + (+4)',
      steps: [
        { math: '|−7|=7, |+4|=4', narrationKo: '절댓값을 따로 본다.', narrationEn: 'Read absolute values separately.' },
        { math: '7 − 4 = 3',     narrationKo: '부호가 다르므로 차를 구한다.', narrationEn: 'Signs differ → subtract.' },
        { math: '결과 부호: −',   narrationKo: '|−7|이 더 크므로 결과는 음수.', narrationEn: 'Larger |·| had the minus sign.' },
        { math: '∴ −3',          narrationKo: '최종 답.', narrationEn: 'Final answer.' },
      ],
    },
    misconception: {
      wrongKo: '(−7) + (+4) = −11',
      wrongEn: '(−7) + (+4) = −11',
      whyKo: '부호가 다른데 절댓값을 그대로 더했다.',
      whyEn: 'Added the magnitudes although signs differ.',
      correctKo: '부호 다름 ⇒ 절댓값 차 = 3, 큰 |·|의 부호 = − ⇒ −3.',
      correctEn: 'Different signs ⇒ difference = 3, sign of larger |·| ⇒ −3.',
    },
    retrieval: {
      promptKo: '(−12) + 5 = ?',
      promptEn: '(−12) + 5 = ?',
      accept: ['-7', '−7'],
      explainKo: '|−12|−|5| = 7, 더 큰 |·|의 부호가 −.',
      explainEn: '|−12|−|5| = 7, sign of larger |·| is −.',
    },
  },

  'C7-CH02-FRACTIONS-DECIMALS': {
    hook: {
      ko: '피자 한 판의 ⅔를 다시 ½ 만큼 친구에게 주려 한다. 결과는 한 판의 몇 분의 몇일까?',
      en: 'You give half of two-thirds of a pizza away. How much of the whole pizza is that?',
    },
    concrete: {
      ko: '⅔ × ½ = 2/6 = ⅓. 0.4 × 0.5 = 0.20 (자릿수 합 2). 분수와 소수 같은 값을 다른 표기로.',
      en: '2/3 × 1/2 = 2/6 = 1/3. 0.4 × 0.5 = 0.20 (sum decimal places). Two notations, same number.',
    },
    pictorial: {
      ko: '피자 그림: 전체를 6 등분하면 ⅔는 4 조각, 그 절반은 2 조각 = ⅓. 면적 시각화.',
      en: 'Pizza: 6 equal slices. Two-thirds = 4 slices. Half of those = 2 slices = 1/3.',
    },
    abstract: {
      ko: '분수 곱셈: (a/b)·(c/d) = ac / bd. 소수 곱셈: 자릿수 합만큼 소수점을 이동.',
      en: 'Fractions: (a/b)·(c/d) = ac/bd. Decimals: count decimal places, sum them in the answer.',
    },
    worked: {
      ko: '계산: ⅔ × ½',
      en: 'Compute: 2/3 × 1/2',
      steps: [
        { math: '분자끼리: 2·1 = 2', narrationKo: '분자는 분자끼리.', narrationEn: 'Numerators together.' },
        { math: '분모끼리: 3·2 = 6', narrationKo: '분모는 분모끼리.', narrationEn: 'Denominators together.' },
        { math: '2/6 = 1/3',         narrationKo: '약분으로 마무리.', narrationEn: 'Reduce.' },
      ],
    },
    misconception: {
      wrongKo: '분수 곱셈에서 분모를 공통분모로 맞춘다.',
      wrongEn: 'Finding a common denominator before multiplying.',
      whyKo: '덧셈 규칙을 곱셈에 잘못 적용했다.',
      whyEn: 'Confused the addition rule with multiplication.',
      correctKo: '곱셈은 그대로 분자·분모를 곱한다. 공통분모는 +/− 에서만.',
      correctEn: 'For ×, just multiply across. Common denominators only for +/−.',
    },
    retrieval: {
      promptKo: '3/4 × 2/5 = ?',
      promptEn: '3/4 × 2/5 = ?',
      accept: ['3/10', '0.3'],
      explainKo: '6/20 = 3/10.',
      explainEn: '6/20 = 3/10.',
    },
  },

  'C7-CH03-DATA-HANDLING': {
    hook: {
      ko: '반 친구들의 시험 점수를 한 숫자로 요약한다면? "평균"이 가장 친숙하지만 그것 하나로 충분하지 않을 때가 있다.',
      en: 'How to summarise class test scores with one number? Mean is familiar, but not always enough.',
    },
    concrete: {
      ko: '점수 {2, 3, 3, 5, 7}: 평균 4, 중앙값 3, 최빈값 3. 평균은 합 기준, 중앙값은 위치 기준, 최빈값은 빈도 기준.',
      en: 'Scores {2, 3, 3, 5, 7}: mean 4, median 3, mode 3. Mean by sum, median by position, mode by frequency.',
    },
    pictorial: {
      ko: '바 그래프에서 시각화: 평균은 가상의 균형점, 중앙값은 정중앙 위치, 최빈값은 가장 높은 막대.',
      en: 'On a bar chart: mean = balance point, median = middle position, mode = tallest bar.',
    },
    abstract: {
      ko: '평균 = (합)/(개수). 중앙값 = 정렬 후 가운데 값. 최빈값 = 가장 자주 나타나는 값.',
      en: 'Mean = sum/count. Median = middle value after sorting. Mode = most frequent value.',
    },
    worked: {
      ko: '데이터 {2, 3, 3, 5, 7} 의 평균·중앙값·최빈값.',
      en: 'For {2, 3, 3, 5, 7}: mean, median, mode.',
      steps: [
        { math: '평균 = (2+3+3+5+7)/5 = 20/5 = 4', narrationKo: '합을 개수로 나눔.', narrationEn: 'Sum ÷ count.' },
        { math: '중앙값 = 3 (정렬 후 가운데)',     narrationKo: '이미 정렬된 가운데 값.', narrationEn: 'Already sorted; pick middle.' },
        { math: '최빈값 = 3 (2번 등장)',           narrationKo: '가장 자주 나오는 값.', narrationEn: 'Most frequent.' },
      ],
    },
    misconception: {
      wrongKo: '"평균이 4이므로 점수의 절반은 4보다 작다."',
      wrongEn: '"Mean is 4, so half the scores are below 4."',
      whyKo: '평균과 중앙값을 같다고 가정.',
      whyEn: 'Confusing mean with median.',
      correctKo: '평균은 합 기반, 중앙값만 "절반 위/아래"를 보장한다.',
      correctEn: 'Median guarantees half above/below, not the mean.',
    },
    retrieval: {
      promptKo: '{1, 4, 4, 9} 의 평균은?',
      promptEn: 'Mean of {1, 4, 4, 9}?',
      accept: ['4.5', '9/2'],
      explainKo: '(1+4+4+9)/4 = 18/4 = 4.5.',
      explainEn: '(1+4+4+9)/4 = 18/4 = 4.5.',
    },
  },

  'C7-CH04-SIMPLE-EQUATIONS': {
    hook: {
      ko: '"어떤 수에 3을 더하니 10이 되었다." 그 수를 찾는 가장 빠른 길은? 양팔저울이 답이다.',
      en: '"A number plus 3 is 10." What\'s the fastest path to find it? Think of a balance scale.',
    },
    concrete: {
      ko: '3x − 7 = 11: +7 양변 → 3x = 18 → ÷3 → x = 6. 검산 3·6 − 7 = 11 ✓.',
      en: '3x − 7 = 11: add 7 → 3x = 18 → divide 3 → x = 6. Check 3·6 − 7 = 11 ✓.',
    },
    pictorial: {
      ko: '양팔저울: 한쪽에 3개 봉지 + 7개 손실, 다른 쪽 11개. x = 봉지 한 개에 든 개수.',
      en: 'Two-pan balance: 3 bags minus 7 on one side equals 11 on the other. x = items per bag.',
    },
    abstract: {
      ko: '일차방정식 ax + b = c ⇒ ax = c − b ⇒ x = (c − b)/a. 양변에 같은 연산을 하면 균형 유지.',
      en: 'Linear equation ax + b = c ⇒ ax = c − b ⇒ x = (c − b)/a. Same operation on both sides keeps balance.',
    },
    worked: {
      ko: '풀이: 3x − 7 = 11',
      en: 'Solve: 3x − 7 = 11',
      steps: [
        { math: '+7 양변',  narrationKo: '상수항 이항.', narrationEn: 'Move the constant.' },
        { math: '3x = 18',   narrationKo: '단순화.',    narrationEn: 'Simplify.' },
        { math: '÷3 양변',   narrationKo: '계수로 나눔.', narrationEn: 'Divide by coefficient.' },
        { math: 'x = 6',     narrationKo: '완료.',      narrationEn: 'Done.' },
      ],
    },
    misconception: {
      wrongKo: '3x − 7 = 11 ⇒ 3x = 11 − 7 = 4',
      wrongEn: '3x − 7 = 11 ⇒ 3x = 11 − 7 = 4',
      whyKo: '−7을 이항할 때 부호를 바꾸지 않고 좌변 그대로 우변으로 옮김.',
      whyEn: 'Forgot to flip the sign of −7 when moving across the equals sign.',
      correctKo: '−7 을 이항하면 +7 ⇒ 3x = 11 + 7 = 18.',
      correctEn: 'Transposing −7 makes it +7 ⇒ 3x = 11 + 7 = 18.',
    },
    retrieval: {
      promptKo: '2x + 5 = 17. x = ?',
      promptEn: '2x + 5 = 17. x = ?',
      accept: ['6', 'x=6'],
      explainKo: '2x = 12 ⇒ x = 6.',
      explainEn: '2x = 12 ⇒ x = 6.',
    },
  },

  'C7-CH05-LINES-ANGLES': {
    hook: {
      ko: '시계 바늘이 한 시간 동안 만드는 회전은 30°. 각이란 회전의 양을 재는 도구다.',
      en: 'In one hour the hour hand sweeps 30°. An angle measures how much we rotated.',
    },
    concrete: {
      ko: '두 직선이 X자로 만나면 각 4개. 한 각 = 65° 면, 맞꼭지각 = 65°, 인접각 두 개 = 115° 씩. 합 360°.',
      en: 'Two lines crossing make an X (four angles). One = 65° ⇒ vertical = 65°, two adjacent = 115° each. Sum = 360°.',
    },
    pictorial: {
      ko: '시계: 12시 기준 1시간 회전 = 30° (시침), 분침은 6° / 분. 회전이 곧 각.',
      en: 'Clock: hour hand sweeps 30° per hour, minute hand 6° per minute. Rotation = angle.',
    },
    abstract: {
      ko: '맞꼭지각은 같다. 평행선 + 횡단선 ⇒ 동위각·엇각은 같고, 동측내각은 보각(180°).',
      en: 'Vertically opposite angles are equal. Parallel lines + transversal ⇒ corresponding & alternate angles equal; co-interior sum to 180°.',
    },
    worked: {
      ko: '두 직선이 만나 만드는 각 중 하나가 65°. 나머지 세 각은?',
      en: 'Two lines meet; one angle is 65°. Find the other three.',
      steps: [
        { math: '맞꼭지: 65°', narrationKo: '맞꼭지각은 같다.', narrationEn: 'Vertically opposite is equal.' },
        { math: '인접: 180° − 65° = 115°', narrationKo: '직선 위 각의 합 = 180°.', narrationEn: 'Linear pair sums to 180°.' },
        { math: '나머지 맞꼭지: 115°', narrationKo: '같은 논리로.', narrationEn: 'Same logic.' },
      ],
    },
    misconception: {
      wrongKo: '평행선 사이 동측내각이 같다.',
      wrongEn: 'Co-interior angles are equal under parallel lines.',
      whyKo: '동위각/엇각/동측내각의 위치를 혼동.',
      whyEn: 'Confused position of corresponding/alternate/co-interior.',
      correctKo: '동측내각은 합이 180° (보각), 같지 않다. 위치는 그림으로 외울 것.',
      correctEn: 'Co-interior angles sum to 180°, not equal. Memorise positions visually.',
    },
    retrieval: {
      promptKo: '평행선 사이 한 동위각이 130°. 나머지 동위각은?',
      promptEn: 'One corresponding angle is 130° between parallels. The other?',
      accept: ['130', '130°'],
      explainKo: '동위각은 같다.',
      explainEn: 'Corresponding angles are equal.',
    },
  },

  'C7-CH06-TRIANGLE': {
    hook: {
      ko: '어떤 모양의 삼각형이든 세 각을 더하면 항상 같은 값이 나온다. 왜일까?',
      en: 'Whatever triangle you draw, its three angles always add to the same total. Why?',
    },
    concrete: {
      ko: '두 내각 40°, 75° ⇒ 세 번째 = 180 − 115 = 65°. 외각 정리: 외각 한 개 = 이웃하지 않는 두 내각의 합 (예: 65°+75°=140°).',
      en: 'Angles 40°, 75° ⇒ third = 180 − 115 = 65°. Exterior angle theorem: exterior = sum of remote interiors (e.g. 65°+75°=140°).',
    },
    pictorial: {
      ko: '삼각형의 한 변을 잘라 굴리면 세 각이 일직선 (180°)이 되는 것을 시각적으로 확인 가능.',
      en: 'Tear off the three corners of a triangle and arrange them — they form a straight line (180°).',
    },
    abstract: {
      ko: '삼각형 내각의 합 = 180°. 외각의 크기 = 이웃하지 않은 두 내각의 합.',
      en: 'Triangle angle sum = 180°. Exterior angle = sum of two remote interior angles.',
    },
    worked: {
      ko: '두 내각이 40°, 75° 일 때 세 번째 내각은?',
      en: 'Two angles are 40°, 75°. Find the third.',
      steps: [
        { math: '40 + 75 = 115°', narrationKo: '두 각을 더한다.', narrationEn: 'Add the two given.' },
        { math: '180 − 115 = 65°', narrationKo: '내각 합 정리로 나머지.', narrationEn: 'Use the angle sum.' },
      ],
    },
    misconception: {
      wrongKo: '큰 변의 맞은편 각이 작다.',
      wrongEn: 'The angle opposite the longest side is the smallest.',
      whyKo: '변과 각의 크기 순서를 뒤바꿈.',
      whyEn: 'Inverted the side-angle correspondence.',
      correctKo: '큰 변의 맞은편 각이 크다 (변·각 순서 일치).',
      correctEn: 'Largest side faces the largest angle (orders match).',
    },
    retrieval: {
      promptKo: '두 내각이 50°, 60°. 세 번째는?',
      promptEn: 'Two angles 50°, 60°. The third?',
      accept: ['70', '70°'],
      explainKo: '180 − 110 = 70°.',
      explainEn: '180 − 110 = 70°.',
    },
  },

  'C7-CH07-COMPARING-QUANTITIES': {
    hook: {
      ko: '"이 셔츠는 25% 할인"의 진짜 의미는? 가격의 1/4 만큼이 깎인다는 뜻.',
      en: '"25% off" — what does it really mean? You pay one-quarter less.',
    },
    concrete: {
      ko: '₹800 의 25% 할인: 할인액 200, 판매가 600. 25% + 10% 할인 같은 게 아니라 (1−0.25)(1−0.1) = 0.675 = 32.5% 할인.',
      en: '₹800 at 25% off: discount 200, sale 600. 25% then 10% off ≠ 35% off — it\'s 1 − 0.675 = 32.5% off.',
    },
    pictorial: {
      ko: '백분율 막대: 100% = 전체, 25% = 1/4 부분 색칠. 비율로 시각화하면 곱셈 의미가 직관적.',
      en: 'Bar of 100%. Shade 25% = one-quarter. Visualising as a bar makes percentage operations intuitive.',
    },
    abstract: {
      ko: '백분율 p% = p/100. (할인된 가격) = (원가) × (1 − p/100).',
      en: 'Percent p% = p/100. Sale price = original × (1 − p/100).',
    },
    worked: {
      ko: '₹800 상품의 25% 할인가는?',
      en: 'Sale price of a ₹800 item at 25% off.',
      steps: [
        { math: '할인액 = 800 × 0.25 = 200', narrationKo: '할인 금액.', narrationEn: 'Discount amount.' },
        { math: '판매가 = 800 − 200 = 600',  narrationKo: '원가에서 차감.', narrationEn: 'Subtract.' },
      ],
    },
    misconception: {
      wrongKo: '25% 할인 + 10% 할인 = 35% 할인.',
      wrongEn: 'Two successive discounts of 25% and 10% = 35% off.',
      whyKo: '두 번째 할인이 이미 할인된 가격에 적용된다는 점을 무시.',
      whyEn: 'Forgot the second discount applies to the already discounted price.',
      correctKo: '실제 (1 − 0.25)(1 − 0.10) = 0.675 ⇒ 32.5% 할인.',
      correctEn: 'Real effect (1 − 0.25)(1 − 0.10) = 0.675 ⇒ 32.5% off.',
    },
    retrieval: {
      promptKo: '₹500 의 30% 는?',
      promptEn: '30% of ₹500?',
      accept: ['150', '₹150'],
      explainKo: '500 × 0.30 = 150.',
      explainEn: '500 × 0.30 = 150.',
    },
  },

  'C7-CH08-RATIONAL-NUMBERS': {
    hook: {
      ko: '정수 사이에는 빈 공간이 많다. 분수를 더하면 그 사이가 채워진다 — 유리수의 등장.',
      en: 'Between integers there are gaps. Fractions fill them in — that\'s rationals.',
    },
    concrete: {
      ko: '0 과 1 사이: 0.5 = 1/2, 0.25 = 1/4, 0.1 = 1/10, … 무한히 많은 유리수. 임의의 두 유리수 사이에는 또 유리수가 있음.',
      en: 'Between 0 and 1: 0.5 = 1/2, 0.25 = 1/4, 0.1 = 1/10, … infinitely many rationals. Between any two rationals, another rational lives.',
    },
    pictorial: {
      ko: '수직선 확대: 1/3 ≈ 0.333, 1/4 = 0.25, 그 사이 5/12 = 0.4167. 더 확대해도 항상 사이에 유리수.',
      en: 'Zoom in on a number line: between 1/4 and 1/3 sits 5/12. Zoom further — always another rational fits.',
    },
    abstract: {
      ko: '유리수 ℚ = { a/b | a, b ∈ ℤ, b ≠ 0 }. 두 유리수 사이엔 또 다른 유리수가 항상 있다 (조밀성).',
      en: 'Rationals ℚ = { a/b : a, b ∈ ℤ, b ≠ 0 }. Between any two rationals lies another (density).',
    },
    worked: {
      ko: '1/3 과 1/2 사이의 유리수 1개 찾기.',
      en: 'Find a rational between 1/3 and 1/2.',
      steps: [
        { math: '평균 = (1/3 + 1/2)/2 = 5/12', narrationKo: '두 수의 평균은 항상 사이.', narrationEn: 'The mean always lies between.' },
      ],
    },
    misconception: {
      wrongKo: '두 정수 사이엔 정수가 무한히 많다.',
      wrongEn: 'Between two integers lie infinitely many integers.',
      whyKo: '정수와 유리수의 조밀성 차이를 혼동.',
      whyEn: 'Confusing integer discreteness with rational density.',
      correctKo: '정수는 이산적; 유리수만 조밀하다.',
      correctEn: 'Integers are discrete; only rationals are dense.',
    },
    retrieval: {
      promptKo: '−2/3 의 덧셈 역원은?',
      promptEn: 'Additive inverse of −2/3?',
      accept: ['2/3'],
      explainKo: '−2/3 + 2/3 = 0.',
      explainEn: '−2/3 + 2/3 = 0.',
    },
  },

  'C7-CH09-PERIMETER-AREA': {
    hook: {
      ko: '두 도형이 같은 둘레를 가져도 넓이는 천차만별. 왜일까?',
      en: 'Two shapes can share a perimeter but have wildly different areas. Why?',
    },
    concrete: {
      ko: '둘레 20 cm: 1×9 직사각형 넓이 9, 4×6 넓이 24, 5×5 정사각형 넓이 25. 같은 둘레에서 정사각형이 넓이 최대.',
      en: 'Perimeter 20 cm: 1×9 rectangle area 9, 4×6 → 24, 5×5 square → 25. Square maximises area for given perimeter.',
    },
    pictorial: {
      ko: '같은 길이의 줄로 다양한 모양 만들기 — 펴면 길이 1차원(둘레), 닫으면 면적 2차원. 원이 같은 둘레에서 최대 넓이.',
      en: 'Same loop of string in different shapes — length is 1-D (perimeter), enclosed area is 2-D. Circle maximises area.',
    },
    abstract: {
      ko: '직사각형 둘레 = 2(l + w), 넓이 = l · w. 원: 둘레 = 2πr, 넓이 = πr².',
      en: 'Rectangle: P = 2(l + w), A = l·w. Circle: C = 2πr, A = πr².',
    },
    worked: {
      ko: '반지름 7 cm 원의 둘레와 넓이.',
      en: 'Circumference and area of a circle, r = 7 cm.',
      steps: [
        { math: 'C = 2π·7 = 14π ≈ 44 cm', narrationKo: '둘레 공식.', narrationEn: 'Circumference formula.' },
        { math: 'A = π·7² = 49π ≈ 154 cm²', narrationKo: '넓이 공식.', narrationEn: 'Area formula.' },
      ],
    },
    misconception: {
      wrongKo: '같은 둘레면 넓이도 같다.',
      wrongEn: 'Same perimeter ⇒ same area.',
      whyKo: '1차원과 2차원 양의 독립성을 인식하지 못함.',
      whyEn: 'Missing the independence of length vs. area.',
      correctKo: '둘레가 같아도 도형 모양에 따라 넓이는 크게 달라진다 (원이 최대).',
      correctEn: 'Same perimeter, very different areas (circle is the max).',
    },
    retrieval: {
      promptKo: '한 변 5 cm 정사각형 넓이는?',
      promptEn: 'Area of a 5 cm square?',
      accept: ['25', '25cm²', '25 cm²'],
      explainKo: '5 × 5.',
      explainEn: '5 × 5.',
    },
  },

  'C7-CH10-ALG-EXPRESSIONS': {
    hook: {
      ko: '"x 살인 형보다 2살 어린 동생". 동생의 나이를 단 한 글자로 적을 수 있을까?',
      en: 'A brother is x years old, the sister 2 years younger. Can we name her age in one expression?',
    },
    concrete: {
      ko: '3a + 2b − a + 5b = 2a + 7b (동류항끼리). 3x + 2 는 더 정리 X (다른 항). x = 4 대입: 2·4 + 7·5 = 8 + 35 = 43 (b=5 가정).',
      en: '3a + 2b − a + 5b = 2a + 7b (combine like terms). 3x + 2 can\'t simplify (unlike). Substitute x=4, b=5: 8 + 35 = 43.',
    },
    pictorial: {
      ko: '대수 타일: x²는 큰 사각형, x는 직사각형, 1은 작은 사각형. 같은 종류 타일끼리만 합칠 수 있다.',
      en: 'Algebra tiles: x² = big square, x = rectangle, 1 = small square. Only like tiles combine.',
    },
    abstract: {
      ko: '동류항은 문자와 차수가 같은 항. 계수만 더하거나 빼고 문자 부분은 보존.',
      en: 'Like terms share variables and powers; add their coefficients, keep the variable part.',
    },
    worked: {
      ko: '정리: 3x + 2y − x + 5y',
      en: 'Simplify: 3x + 2y − x + 5y',
      steps: [
        { math: '(3x − x) + (2y + 5y)', narrationKo: '동류항끼리 묶음.', narrationEn: 'Group like terms.' },
        { math: '2x + 7y',              narrationKo: '계수 합.', narrationEn: 'Combine coefficients.' },
      ],
    },
    misconception: {
      wrongKo: '3x + 2 = 5x',
      wrongEn: '3x + 2 = 5x',
      whyKo: '동류항이 아닌 항을 더했다.',
      whyEn: 'Combined unlike terms (number + x).',
      correctKo: '3x 와 2 는 동류항이 아니므로 그대로 둔다: 3x + 2.',
      correctEn: '3x and 2 are unlike; leave as 3x + 2.',
    },
    retrieval: {
      promptKo: '4a − 2b − a + 5b 정리.',
      promptEn: 'Simplify 4a − 2b − a + 5b.',
      accept: ['3a + 3b', '3a+3b'],
      explainKo: '동류항: (4a − a) + (−2b + 5b).',
      explainEn: '(4a − a) + (−2b + 5b).',
    },
  },

  'C7-CH11-EXPONENTS': {
    hook: {
      ko: '"2를 10번 곱한 값" 을 종이에 다 쓰지 않으려면? 지수 표기가 답.',
      en: '"Two multiplied by itself ten times" — how to write it briefly? Use exponent notation.',
    },
    concrete: {
      ko: '2³ · 2⁴ = 2⁷ = 128 (밑 같으면 지수 합). (3²)³ = 3⁶ = 729 (거듭제곱은 지수 곱). 2¹⁰ = 1024.',
      en: '2³ · 2⁴ = 2⁷ = 128 (same base, add exp). (3²)³ = 3⁶ = 729 (power-of-power, multiply). 2¹⁰ = 1024.',
    },
    pictorial: {
      ko: '나무 가지처럼 분기: 2¹ → 가지 2개, 2² → 4개, 2³ → 8개. 지수가 깊이.',
      en: 'Branching tree: 2¹ = 2 branches, 2² = 4, 2³ = 8. Exponent = depth.',
    },
    abstract: {
      ko: 'aᵐ · aⁿ = a^(m+n).  aᵐ / aⁿ = a^(m−n).  (aᵐ)ⁿ = a^(m·n).  a⁰ = 1 (a≠0).',
      en: 'aᵐ·aⁿ = a^(m+n).  aᵐ/aⁿ = a^(m−n).  (aᵐ)ⁿ = a^(m·n).  a⁰ = 1.',
    },
    worked: {
      ko: '계산: 2³ · 2⁴',
      en: 'Compute: 2³ · 2⁴',
      steps: [
        { math: '2^(3+4) = 2⁷', narrationKo: '같은 밑, 지수 합.', narrationEn: 'Same base ⇒ add exponents.' },
        { math: '= 128',         narrationKo: '값 계산.', narrationEn: 'Evaluate.' },
      ],
    },
    misconception: {
      wrongKo: '2³ · 2⁴ = 2¹²',
      wrongEn: '2³ · 2⁴ = 2¹²',
      whyKo: '곱과 거듭제곱 법칙을 혼동.',
      whyEn: 'Confused product rule with power-of-power rule.',
      correctKo: '곱: 지수 합 → 2⁷. 거듭제곱: 지수 곱.',
      correctEn: 'Product: add exponents (2⁷). Power-of-power: multiply.',
    },
    retrieval: {
      promptKo: '(3²)³ = ?',
      promptEn: '(3²)³ = ?',
      accept: ['3^6', '3⁶', '729'],
      explainKo: '지수 곱 ⇒ 3⁶ = 729.',
      explainEn: 'Multiply exponents ⇒ 3⁶ = 729.',
    },
  },

  'C7-CH12-SYMMETRY': {
    hook: {
      ko: '나비 한 마리, 자동차 한 대, 정육각형. 무엇이 공통일까? 모두 어떤 "변환에도 같은" 도형이다.',
      en: 'A butterfly, a car, a regular hexagon — what do they share? All look the same after some transformation.',
    },
    concrete: {
      ko: '정사각형: 대칭축 4개 (두 대각선 + 두 변 중점선), 회전대칭 차수 4 (90° 회전마다 같음). 원: 무한 대칭축 + 무한 회전대칭.',
      en: 'Square: 4 lines of symmetry (2 diagonals + 2 midlines), rotational order 4 (matches every 90°). Circle: infinite of each.',
    },
    pictorial: {
      ko: '도형을 접거나 회전시켜 자기 자신과 일치하면 대칭. 거울/회전 두 방식.',
      en: 'Fold or rotate the shape and it matches itself. Two flavours: mirror (line) and rotational.',
    },
    abstract: {
      ko: '선 대칭: 한 직선으로 접으면 일치. 회전 대칭: 360°/n 만큼 돌려도 일치 (n차 회전대칭).',
      en: 'Line symmetry: folds onto itself; rotational symmetry of order n: matches after 360°/n turn.',
    },
    worked: {
      ko: '정육각형의 대칭축 개수와 회전대칭 차수.',
      en: 'Lines of symmetry and order of rotational symmetry of a regular hexagon.',
      steps: [
        { math: '대칭축 6개', narrationKo: '꼭짓점-꼭짓점 3개 + 변-변 3개.', narrationEn: 'Vertex-to-vertex 3 + edge-to-edge 3.' },
        { math: '회전대칭 차수 6', narrationKo: '60° 돌릴 때마다 같은 모양.', narrationEn: 'Repeats every 60°.' },
      ],
    },
    misconception: {
      wrongKo: '평행사변형은 대칭축이 두 개 있다.',
      wrongEn: 'A parallelogram has two lines of symmetry.',
      whyKo: '대각선이 도형을 두 등합동 부분으로 나누지만 거울 대칭은 아님.',
      whyEn: 'Diagonals split into congruent halves but are not mirror lines.',
      correctKo: '일반 평행사변형은 대칭축 0개, 회전대칭 차수 2 (180° 회전).',
      correctEn: 'General parallelogram has 0 lines of symmetry; rotational order 2 (180° turn).',
    },
    retrieval: {
      promptKo: '정사각형의 대칭축은 몇 개?',
      promptEn: 'How many lines of symmetry does a square have?',
      accept: ['4'],
      explainKo: '두 대각선 + 두 변의 중점선.',
      explainEn: 'Two diagonals + two midline segments.',
    },
  },

  'C7-CH13-SOLID-SHAPES': {
    hook: {
      ko: '주사위 한 면이 6개 점. 그러면 모서리, 꼭짓점은 각각 몇 개일까?',
      en: 'A die shows 6 faces — but how many edges and vertices does it have?',
    },
    concrete: {
      ko: '정육면체: V=8, E=12, F=6 → 8 − 12 + 6 = 2. 정사면체: V=4, E=6, F=4 → 4 − 6 + 4 = 2. 오일러 공식 일관.',
      en: 'Cube: V=8, E=12, F=6 → 2. Tetrahedron: V=4, E=6, F=4 → 2. Euler\'s formula always gives 2.',
    },
    pictorial: {
      ko: '입체 전개도: 6 정사각형 = 정육면체 전개, 4 정삼각형 = 정사면체. 평면에서 잘라 접는 활동.',
      en: 'Nets: 6 squares fold into a cube, 4 equilateral triangles into a tetrahedron. Hands-on activity.',
    },
    abstract: {
      ko: '오일러 공식 (다면체): V − E + F = 2. 정육면체: V=8, E=12, F=6 ⇒ 2.',
      en: 'Euler\'s formula for polyhedra: V − E + F = 2. Cube: V=8, E=12, F=6 ⇒ 2.',
    },
    worked: {
      ko: '삼각뿔(정사면체)의 V, E, F 와 오일러 공식 확인.',
      en: 'Tetrahedron — list V, E, F and verify Euler.',
      steps: [
        { math: 'V=4, E=6, F=4', narrationKo: '꼭짓점/모서리/면 개수.', narrationEn: 'Count V, E, F.' },
        { math: '4 − 6 + 4 = 2', narrationKo: '공식 성립.', narrationEn: 'Euler verified.' },
      ],
    },
    misconception: {
      wrongKo: '원기둥은 정점 0, 모서리 0, 면 3 → 오일러 V−E+F = 3.',
      wrongEn: 'Cylinder: V=0, E=0, F=3 ⇒ V−E+F=3.',
      whyKo: '오일러 공식은 다면체(평면)에만 적용. 곡면이 있는 입체는 제외.',
      whyEn: 'Euler\'s formula applies only to polyhedra (flat faces). Curved surfaces excluded.',
      correctKo: '원기둥·구·원뿔은 다면체가 아니라 오일러 공식 적용 X.',
      correctEn: 'Cylinder/sphere/cone are not polyhedra; Euler\'s formula doesn\'t apply.',
    },
    retrieval: {
      promptKo: '정육면체의 모서리 개수는?',
      promptEn: 'Number of edges of a cube?',
      accept: ['12'],
      explainKo: '4 × 3 = 12.',
      explainEn: '4 × 3 = 12.',
    },
  },
};

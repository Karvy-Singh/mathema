"""
NCERT PDF 본문에서 챕터별 introduction 발췌 추출.

사용법:
    # 영어 (디폴트)
    python scripts/extract-ncert-excerpts.py
    # 힌디
    python scripts/extract-ncert-excerpts.py --lang hi --src /path/to/ncert_hindi_full.txt

입력:  pdftotext 로 추출된 텍스트 파일
출력:  backend/src/common/curriculum/concept-content/ncert-excerpts[-hi].json

각 챕터의 "N.1 Introduction" (영어) 또는 "N.1 परिचय" (힌디) 위치를 찾고 그 다음 줄을 발췌.
페이지 머리글·꼬리글·노이즈 줄 제거.

chapterCode 매핑은 ncert-chapters.ts 의 식별자 (C7-CH01-INTEGERS 등) 와 일치.
"""

import re
import json
import os
import sys
import argparse
import tempfile
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--lang', choices=['en', 'hi'], default='en')
parser.add_argument('--src', default=None, help='Override source txt path')
args = parser.parse_args()

LANG = args.lang
if args.src:
    SRC = args.src
elif LANG == 'hi':
    SRC = os.path.join(tempfile.gettempdir(), 'ncert_full_hi.txt')
else:
    SRC = os.path.join(tempfile.gettempdir(), 'ncert_full.txt')

DST_NAME = 'ncert-excerpts.json' if LANG == 'en' else 'ncert-excerpts-hi.json'
DST = Path(__file__).parent.parent / 'backend' / 'src' / 'common' / 'curriculum' / 'concept-content' / DST_NAME

# 챕터 시작 패턴: "N.1 Introduction" — 각 NCERT 챕터의 첫 섹션 표준 표기.
# 학년별로 PDF 안의 라인 범위와 챕터 시퀀스가 정해져 있음.
CLASS_LINE_RANGES = {
    'CLASS_7':  (380, 11700),
    'CLASS_8':  (11700, 21500),
    # PDF 에는 Class 9 가 빠져있음 → 발췌 없음
    'CLASS_10': (21500, 34000),
    'CLASS_11': (34000, 53000),
    'CLASS_12': (53000, 76936),   # Part I + Part II
}

# Class 별 챕터 번호 → chapterCode 매핑 (ncert-chapters.ts 와 일치)
CHAPTER_CODES = {
    'CLASS_7': [
        'C7-CH01-INTEGERS', 'C7-CH02-FRACTIONS-DECIMALS', 'C7-CH03-DATA-HANDLING',
        'C7-CH04-SIMPLE-EQUATIONS', 'C7-CH05-LINES-ANGLES', 'C7-CH06-TRIANGLE',
        'C7-CH07-COMPARING-QUANTITIES', 'C7-CH08-RATIONAL-NUMBERS', 'C7-CH09-PERIMETER-AREA',
        'C7-CH10-ALG-EXPRESSIONS', 'C7-CH11-EXPONENTS', 'C7-CH12-SYMMETRY', 'C7-CH13-SOLID-SHAPES',
    ],
    'CLASS_8': [
        'C8-CH01-RATIONAL-NUMBERS', 'C8-CH02-LINEAR-EQ-ONE-VAR', 'C8-CH03-QUADRILATERALS',
        'C8-CH04-DATA-HANDLING', 'C8-CH05-SQUARES-ROOTS', 'C8-CH06-CUBES-ROOTS',
        'C8-CH07-COMPARING-QUANTITIES', 'C8-CH08-ALG-IDENTITIES', 'C8-CH09-MENSURATION',
        'C8-CH10-EXPONENTS', 'C8-CH11-DIRECT-INVERSE', 'C8-CH12-FACTORISATION', 'C8-CH13-GRAPHS',
    ],
    'CLASS_10': [
        'C10-CH01-REAL-NUMBERS', 'C10-CH02-POLYNOMIALS', 'C10-CH03-LINEAR-EQ-PAIRS',
        'C10-CH04-QUADRATIC-EQ', 'C10-CH05-AP', 'C10-CH06-TRIANGLES-III',
        'C10-CH07-COORDINATE-GEOM-II', 'C10-CH08-TRIG-INTRO', 'C10-CH09-TRIG-APPLICATIONS',
        'C10-CH10-CIRCLES-II', 'C10-CH11-AREAS-CIRCLES', 'C10-CH12-SURFACE-VOLUME-II',
        'C10-CH13-STATISTICS-II', 'C10-CH14-PROBABILITY',
    ],
    'CLASS_11': [
        'C11-CH01-SETS', 'C11-CH02-RELATIONS-FUNCTIONS', 'C11-CH03-TRIG-FUNCTIONS',
        'C11-CH04-COMPLEX', 'C11-CH05-LINEAR-INEQ', 'C11-CH06-PERMUTATIONS',
        'C11-CH07-BINOMIAL', 'C11-CH08-SEQUENCES', 'C11-CH09-STRAIGHT-LINES',
        'C11-CH10-CONIC', 'C11-CH11-3D-INTRO', 'C11-CH12-LIMITS-DERIVATIVES',
        'C11-CH13-STATISTICS-III', 'C11-CH14-PROBABILITY-II',
    ],
    'CLASS_12': [
        'C12-CH01-RELATIONS-FUNCTIONS-II', 'C12-CH02-INV-TRIG', 'C12-CH03-MATRICES',
        'C12-CH04-DETERMINANTS', 'C12-CH05-CONTINUITY-DIFF', 'C12-CH06-APP-DERIVATIVES',
        'C12-CH07-INTEGRALS', 'C12-CH08-APP-INTEGRALS', 'C12-CH09-DIFF-EQ',
        'C12-CH10-VECTORS', 'C12-CH11-3D-GEOM', 'C12-CH12-LP', 'C12-CH13-PROBABILITY-III',
    ],
}

# Noise lines to skip
NOISE_PATTERNS = [
    re.compile(r'^\s*Reprint\s+\d{4}', re.IGNORECASE),
    re.compile(r'^\s*2024-25\s*$'),
    re.compile(r'^\s*\d+\s*MATHEMATICS\s*$', re.IGNORECASE),
    re.compile(r'^\s*MATHEMATICS\s*\d+\s*$', re.IGNORECASE),
    re.compile(r'^\s*Chapter\s+\d+\s*$', re.IGNORECASE),
    re.compile(r'^\s*\d+\s*$'),     # 페이지 번호만
    re.compile(r'^\s*$'),
]

if LANG == 'hi':
    # NCERT 힌디 교과서: "N.1 परिचय" (परिचय = introduction) 또는 "अध्याय N" 다음 텍스트.
    # 일부 챕터는 "1.1 भूमिका" 패턴도 사용.
    INTRO_PATTERN = re.compile(r'^\s*(\d+)\.1\s+(परिचय|भूमिका)\b')
    SECTION_BREAK = re.compile(r'^\s*\d+\.\d+\s+[ऀ-ॿ]')
else:
    INTRO_PATTERN = re.compile(r'^\s*(\d+)\.1\s+Introduction\b', re.IGNORECASE)
    SECTION_BREAK = re.compile(r'^\s*\d+\.\d+\s+[A-Z]')


def clean_line(line: str) -> str:
    """0x80 같은 mojibake 정리"""
    # pdftotext 에서 hyphen 등이 깨진 경우 대체
    line = line.replace('', '').replace('', '').replace('', '')
    line = line.replace('�', '-')
    line = line.replace('�', '-')
    line = re.sub(r'\s+', ' ', line).strip()
    return line


def extract_chapter_intros(lines: list, start: int, end: int, chapter_codes: list):
    """
    한 학년 범위(start~end) 안에서 N.1 Introduction 패턴을 찾아
    각 챕터 introduction 발췌 추출.

    각 챕터: introduction 시작 후 최대 60 줄, 또는 다음 N.2 섹션이 시작될 때까지.
    """
    intros = []
    # 한 학년 범위 안의 N.1 Introduction 위치들 — 순서대로 챕터 1, 2, 3, ...
    intro_starts = []
    for i in range(start, min(end, len(lines))):
        m = INTRO_PATTERN.match(lines[i])
        if m:
            intro_starts.append((i, int(m.group(1))))

    # 챕터 번호별로 그룹화: 같은 챕터 번호의 첫 등장만 (목차에도 N.1 Introduction 이 나오므로 본문은 보통 2번째 등장)
    by_chapter = {}
    for line_no, ch_num in intro_starts:
        # 목차 형 (페이지 번호가 우측에 붙은 형태) 은 같은 줄에 숫자가 많이 등장 — 짧고 노이즈.
        # 본문 형 — 그 다음 줄들이 실제 산문.
        # 우리는 *마지막* 등장 (가장 본문 같은 것)을 채택하지 말고, 챕터 번호별 *두 번째* 등장 (목차 아닌 본문) 채택.
        by_chapter.setdefault(ch_num, []).append(line_no)

    # 챕터 번호 순으로 정렬, 각 챕터의 *마지막* 등장이 본문 시작
    for ch_num in sorted(by_chapter.keys()):
        positions = by_chapter[ch_num]
        body_start = positions[-1]  # 보통 마지막 등장이 본문
        # 본문 내용 추출: body_start 이후 60 줄 or 다음 섹션
        body_lines = []
        for j in range(body_start + 1, min(body_start + 100, end, len(lines))):
            line = lines[j]
            if SECTION_BREAK.match(line) and not INTRO_PATTERN.match(line):
                break
            if any(p.match(line) for p in NOISE_PATTERNS):
                continue
            cleaned = clean_line(line)
            if cleaned:
                body_lines.append(cleaned)
            if len(body_lines) >= 18:  # 최대 18 줄 (충분히 짧고 의미 있음)
                break

        excerpt = ' '.join(body_lines).strip()
        # 너무 짧으면 (mojibake 만 잡힘) skip
        if len(excerpt) < 80:
            continue

        # 챕터 코드 매핑 (ch_num 은 1-based)
        if ch_num - 1 < len(chapter_codes):
            code = chapter_codes[ch_num - 1]
            intros.append({
                'chapterCode': code,
                'chapterNumber': ch_num,
                'lineNo': body_start,
                'excerpt': excerpt[:1500],   # 1500 자 상한
            })
    return intros


def main():
    with open(SRC, encoding='utf-8', errors='ignore') as f:
        lines = f.readlines()

    result = {}
    for ncert_class, (start, end) in CLASS_LINE_RANGES.items():
        codes = CHAPTER_CODES.get(ncert_class, [])
        intros = extract_chapter_intros(lines, start, end, codes)
        for it in intros:
            result[it['chapterCode']] = {
                'ncertClass': ncert_class,
                'chapterNumber': it['chapterNumber'],
                'sourceLine': it['lineNo'],
                'excerpt': it['excerpt'],
            }
        print(f'{ncert_class}: extracted {len(intros)}/{len(codes)} chapters')

    DST.parent.mkdir(parents=True, exist_ok=True)
    with open(DST, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f'wrote {len(result)} excerpts → {DST}')


if __name__ == '__main__':
    main()

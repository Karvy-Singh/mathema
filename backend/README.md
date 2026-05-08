# Mathēma Backend — 설계 문서

수능 수학 학습 앱(`MathLearningApp.jsx`)의 UI에 1:1로 대응되는 백엔드 시스템.

> **주체/객체 통일 규칙**
> - **주어(Actor):** 항상 `학습자(User)` 또는 `AI 코치(AICoach)`
> - **객체(Resource):** `Problem`, `WrongNote`, `Attempt`, `StudySession`, `MockExam`, `MasterySnapshot`, `DailyActivity`, `Recommendation`, `Report`
> - 모든 모듈/엔드포인트/테이블/DTO는 위 명사를 단복수만 바꿔 일관되게 사용한다.

---

## 1. 기술 스택

| 계층 | 선택 | 비고 |
|---|---|---|
| Runtime | Node.js 20 LTS | `.nvmrc` 고정 |
| Framework | NestJS 10 + TypeScript 5 | 모듈러 모놀리스 |
| ORM | Prisma 5 | 타입 안전 + 마이그레이션 |
| RDB | PostgreSQL 16 | 모든 영속 데이터 |
| Cache/Queue | Redis 7 | 세션·캐시·스트릭·AI 응답 캐시 |
| Auth | JWT (access + refresh) | `@nestjs/jwt`, Passport |
| Validation | class-validator + class-transformer | DTO 강제 |
| AI | 외부 LLM API (`api입력칸`) | 코드 내 placeholder로 표시 |
| Storage | S3 호환(또는 로컬) | 사진/PDF 업로드 |
| Test | Jest + Supertest | 단위 + e2e |

---

## 2. UI ↔ 백엔드 도메인 매핑

`MathLearningApp.jsx`의 5개 페이지에서 사용된 모든 데이터를 도메인 모듈로 정규화:

| UI 화면 | 표시 항목 | 도메인 모듈 |
|---|---|---|
| **TopNav** | 사용자명(민준), D-287 카운트다운 | `users` |
| **대시보드 — 헤더 4 stat** | 오늘 학습/연속 학습/주간 정답률/예상 등급 | `dashboard` (조합) |
| **대시보드 — Mastery Map (레이더)** | 단원별 숙련도 6개 | `mastery` |
| **대시보드 — Today** | 오늘의 맞춤 학습 3개 | `recommendations` |
| **대시보드 — 최근 오답 인사이트** | 카드 3장 | `wrong-notes` |
| **대시보드 — 학습 캘린더 (12주 heatmap)** | 일자별 학습 강도 + 23일 연속 | `activity` |
| **대시보드 — Error DNA** | 4가지 오답 유형 비율 | `ai-coach` |
| **오답노트 — 헤더 4 stat** | 전체/분석완료/마스터/재출제 정답률 | `wrong-notes` |
| **오답노트 — 사진/직접/PDF 등록** | 3가지 등록 경로 | `wrong-notes` (services/) |
| **오답노트 — 그리드 + 필터** | 단원/난이도/상태/정렬 | `wrong-notes` |
| **오답노트 — Pattern Analysis** | 3가지 오답 패턴 | `ai-coach` |
| **학습 — 세션 헤더** | Session 03/05, 14:32 타이머, 5단계 progress | `study-sessions` |
| **학습 — 문제 패널** | 문제 본문/공식/입력/제출/힌트 | `study-sessions` + `attempts` |
| **학습 — AI 가이드** | 관점 변환(공식/단계별/시각화/실생활), 5단계, 시각화/예제 | `study-sessions` (`ai-guide.service`) |
| **모의고사 — 헤더 4 stat** | 최근점수/예상등급/목표차/백분위 | `mock-exams` |
| **모의고사 — 점수 변화 추이** | 6회 면적그래프 | `mock-exams` |
| **모의고사 — 응시 리스트** | 점수/등급/백분위/시간 | `mock-exams` |
| **모의고사 — AI 추천 진단/미니/오답 재출제/실전** | 4가지 응시 유형 | `mock-exams` (`ai-recommend-exam.service`) |
| **리포트 — 헤더 4 stat** | 주간 시간/문제/정답률/AI 점수 | `reports` |
| **리포트 — AI Mentor Message** | 주간 멘토 메시지 | `ai-coach` |
| **리포트 — Time vs Accuracy** | 8주 라인차트 | `reports` |
| **리포트 — 단원별 진척도** | 6단원 막대 | `mastery` |
| **리포트 — Next Focus / Achievements** | 3개 영역 + 4개 성취 | `reports` |

---

## 3. 파일 구조도

```
backend/
├── .env.example              # 모든 환경변수 (API 입력칸 포함)
├── .gitignore .eslintrc.js .prettierrc .nvmrc
├── package.json tsconfig.json tsconfig.build.json nest-cli.json
├── docker-compose.yml        # postgres + redis 로컬 개발
├── Dockerfile
├── README.md                 # ← 이 문서
│
├── prisma/
│   ├── schema.prisma         # 단일 진실 원천 (ERD)
│   ├── migrations/
│   └── seed.ts               # 단원 6개 + 샘플 문제
│
├── test/
│   └── jest-e2e.json
│
└── src/
    ├── main.ts                       # 부트스트랩 (Helmet, CORS, ValidationPipe)
    ├── app.module.ts                 # 루트: 모든 modules/* import
    │
    ├── common/                       # 횡단 관심사
    │   ├── decorators/  current-user, public
    │   ├── filters/     http-exception
    │   ├── guards/      jwt-auth, roles
    │   ├── interceptors/ logging, transform(응답 포맷 통일)
    │   ├── pipes/       validation
    │   ├── dto/         pagination
    │   ├── types/       jwt-payload
    │   ├── enums/       difficulty | error-type | unit | note-status | session-context
    │   └── utils/       date, grade-calculator (점수 → 등급/백분위)
    │
    ├── config/                       # @nestjs/config 네임스페이스
    │   ├── configuration.ts
    │   ├── database.config.ts
    │   ├── redis.config.ts
    │   ├── ai-api.config.ts          # ⚑ api입력칸 — LLM/Vision/Embedding 키
    │   ├── jwt.config.ts
    │   └── storage.config.ts
    │
    ├── infrastructure/               # 외부 시스템 어댑터 (모듈에서 주입받음)
    │   ├── prisma/   PrismaService      (DB 단일 클라이언트)
    │   ├── redis/    RedisService       (ioredis 래퍼)
    │   ├── ai/                          # ⚑ AI 통합 지점
    │   │   ├── ai.module.ts             # Global module
    │   │   ├── ai.service.ts            # 통합 facade
    │   │   ├── providers/
    │   │   │   ├── llm.provider.ts        # ⚑ api입력칸 (Anthropic Claude / OpenAI)
    │   │   │   ├── vision.provider.ts     # ⚑ api입력칸 (사진 → 문제 OCR)
    │   │   │   └── embedding.provider.ts  # ⚑ api입력칸 (유사 문제 검색)
    │   │   └── prompts/
    │   │       ├── insight.prompt.ts        # 오답 인사이트
    │   │       ├── pattern.prompt.ts        # 3가지 오답 패턴
    │   │       ├── coach.prompt.ts          # 주간 멘토 메시지
    │   │       └── stepwise-guide.prompt.ts # 5단계 가이드 (관점별)
    │   └── storage/  StorageService     (사진/PDF 업로드)
    │
    └── modules/                      # 도메인 모듈 (모듈러 모놀리스)
        │
        ├── auth/             # 회원가입/로그인/리프레시 (JWT)
        ├── users/            # 학습자 프로필 (이름·D-day·목표 등급)
        ├── curriculum/       # Unit / SubUnit 마스터 데이터
        ├── problems/         # 문제 마스터 (출처·난이도·정답)
        ├── wrong-notes/      # 오답노트 (CRUD + 사진/PDF 등록 + 유사문제)
        │   └── services/  ocr · pdf-extractor · similar-finder
        ├── attempts/         # 풀이 시도 기록 (정답여부·소요시간)
        ├── study-sessions/   # 5단계 학습 세션 + AI 가이드
        │   └── services/  ai-guide (관점 4종 × 단계 5종)
        ├── mock-exams/       # 모의고사 + 결과 + 등급/백분위
        │   └── services/  grading · ai-recommend-exam
        ├── recommendations/  # 오늘의 맞춤 학습 (전략 패턴)
        │   └── strategies/ focus-on-mistakes · reinforce-weakness · maintain-strength
        ├── mastery/          # 단원별 숙련도 산출/캐시
        ├── activity/         # 학습 캘린더(heatmap) + 연속 학습(streak)
        ├── ai-coach/         # 진단/패턴/멘토 메시지 (AI facade 사용)
        ├── reports/          # 주간 리포트 (시간 vs 정답률 / 다음주 포커스 / 성취)
        └── dashboard/        # 대시보드 헤더 stat 조합 (다른 모듈 호출)
```

### 모듈 의존성 규칙
```
dashboard ─┬─> users · activity · mastery · wrong-notes · ai-coach · recommendations
           │
recommendations ─> mastery · wrong-notes · curriculum
study-sessions ─> problems · attempts · ai-coach · curriculum
mock-exams ─> problems · attempts · curriculum · ai-coach
wrong-notes ─> problems · attempts · ai (infrastructure)
mastery ─> attempts · curriculum
activity ─> attempts
ai-coach ─> ai (infrastructure) · attempts · wrong-notes · mastery
reports ─> attempts · activity · mastery · ai-coach

# 모든 모듈은 infrastructure(prisma/redis/ai/storage)를 자유 주입
# 도메인 모듈끼리는 위 방향만 허용 — 역방향 금지(순환 차단)
```

---

## 4. 데이터 모델 (Prisma 핵심 발췌)

`prisma/schema.prisma` 참조. 핵심 엔티티와 UI 항목 매핑:

| 엔티티 | 주요 필드 | UI 매핑 |
|---|---|---|
| `User` | name, email, examDate, targetGrade | 아바타·D-287·예상등급 |
| `Unit` | name(미적분 II), order | 레이더 6축 |
| `SubUnit` | unitId, name(정적분의 활용) | 오답노트 그리드 sub-unit |
| `Problem` | source, unitId, subUnitId, difficulty, body, answer | 문제 패널·세션 |
| `Attempt` | userId, problemId, isCorrect, durationSec, context | 모든 통계의 원천 |
| `WrongNote` | userId, problemId, errorType, insight, status, similarCount | 오답노트 카드 |
| `StudySession` | userId, unitId, sessionNumber/total, currentStep | 학습 헤더·5단계 |
| `MockExam` / `MockExamResult` | name·type·scheduledAt / score·grade·percentile | 모의고사 추이/리스트 |
| `DailyActivity` | userId, date, durationMin, problemsSolved, accuracyPct | heatmap·통계 카드 |
| `MasterySnapshot` | userId, unitId, score(0~100), updatedAt | 레이더·진척도 |
| `WeeklyReport` | userId, weekStart, totalHours, problemsSolved, accuracyPct, aiScore, mentorMessage | 리포트 페이지 전체 |

**Enum 통일 (`src/common/enums/`):**
- `Difficulty`: `MIDDLE | UPPER_MIDDLE | SEMI_KILLER | KILLER` (중/중상/준킬러/킬러)
- `ErrorType`: `CONCEPT_MISUNDERSTANDING | CALCULATION_MISTAKE | TIME_SHORTAGE | OTHER`
- `NoteStatus`: `PENDING | ANALYZING | MASTERED`
- `SessionContext`: `STUDY | EXAM | PRACTICE | DIAGNOSTIC`

---

## 5. Redis 키 설계

| 키 패턴 | TTL | 용도 |
|---|---|---|
| `auth:refresh:{userId}` | 14d | 리프레시 토큰 화이트리스트 |
| `session:study:{userId}:current` | 24h | 진행 중 학습 세션 상태 (타이머·step) |
| `streak:{userId}` | 영구 | 연속 학습 일수 (자정 갱신) |
| `mastery:{userId}` | 10m | 레이더 차트 캐시 |
| `recommendation:{userId}:today` | 1h | 오늘의 맞춤 학습 |
| `coach:weekly:{userId}:{isoWeek}` | 24h | 주간 멘토 메시지 |
| `ai:cache:{sha256(prompt)}` | 7d | LLM 응답 캐시 (비용 절감) |
| `lock:ai:{userId}` | 30s | AI 호출 동시성 제어 |

---

## 6. REST API ↔ UI 매핑

> 모든 응답은 `{ data, meta? }` 포맷. `transform.interceptor`가 강제.

### 인증 (`/auth`)
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

### 사용자 (`/users`)
- `GET /users/me` — 아바타·이름·D-day
- `PATCH /users/me` — 프로필 변경
- `PATCH /users/me/target` — 목표 등급/수능 날짜

### 대시보드 (`/dashboard`)
- `GET /dashboard/summary` — **헤더 4 stat 통합**
- (그 외 카드는 각 모듈 직접 호출)

### 단원/문제 (`/curriculum`, `/problems`)
- `GET /curriculum` — Unit + SubUnit 트리
- `GET /problems?unitId&difficulty&source&page` — 문제 검색
- `GET /problems/:id` — 단건
- `GET /problems/:id/hint` — 힌트 (AI)

### 오답노트 (`/wrong-notes`)
- `GET /wrong-notes/stats` — 4 stat
- `GET /wrong-notes?unit&errorType&status&sort&page` — 그리드+필터
- `POST /wrong-notes` — 직접 입력
- `POST /wrong-notes/upload-photo` (multipart) — 사진 인식 (Vision API)
- `POST /wrong-notes/upload-pdf` (multipart) — PDF 일괄 추출
- `GET /wrong-notes/:id` — 단건 + 유사문제
- `PATCH /wrong-notes/:id/status` — pending → analyzing → mastered
- `GET /wrong-notes/recent?limit=3` — 대시보드용

### 풀이 (`/attempts`)
- `POST /attempts` — { problemId, answer, durationSec, context }
  - 오답이면 자동으로 `WrongNote` 생성/업데이트 (insight는 비동기 AI)

### 학습 세션 (`/study-sessions`)
- `POST /study-sessions/start` — { unitId | recommendationId }
- `GET /study-sessions/:id` — 현재 step / 전체 5 step
- `GET /study-sessions/:id/guide?perspective=단계별` — 4가지 관점 (공식/단계별/시각화/실생활)
- `POST /study-sessions/:id/next` — step++
- `POST /study-sessions/:id/end`

### 모의고사 (`/mock-exams`)
- `GET /mock-exams/trajectory?count=6` — 점수 추이
- `GET /mock-exams/results?recent=4` — 응시 리스트
- `POST /mock-exams/recommended/start` — AI 맞춤 진단 모의고사 30문제
- `POST /mock-exams/types/{mini|wrong-redo|real}/start`
- `POST /mock-exams/results/:id/submit` — 답안 제출 → grading

### 추천 (`/recommendations`)
- `GET /recommendations/today` — 3개 (오답집중/약점보강/강점유지)

### 숙련도 (`/mastery`)
- `GET /mastery` — 단원 6개 점수 (레이더용)
- `GET /mastery/:unitId` — 단원 상세 + 약점 sub-unit

### 활동 (`/activity`)
- `GET /activity/heatmap?weeks=12` — heatmap 그리드
- `GET /activity/streak` — 연속 학습 일수
- `GET /activity/today` — 오늘 학습 분/목표

### AI 코치 (`/ai-coach`)
- `GET /ai-coach/error-dna` — Error DNA (4유형 비율 + 인사이트)
- `GET /ai-coach/patterns` — 3가지 오답 패턴
- `GET /ai-coach/diagnosis` — 대시보드 상단 진단 메시지
- `GET /ai-coach/mentor-message?week=current` — 리포트 멘토 메시지

### 리포트 (`/reports`)
- `GET /reports/weekly/current` — 헤더 4 stat
- `GET /reports/weekly/time-vs-accuracy?weeks=8`
- `GET /reports/weekly/next-focus`
- `GET /reports/weekly/achievements`
- `GET /reports/weekly/:isoWeek` — 과거 주차

---

## 7. AI 통합 지점 (`api입력칸`)

코드 내 모든 외부 LLM/Vision/Embedding 호출은 단일 facade `AiService`를 통해서만 이루어진다.
실제 키와 SDK 호출부는 **`api입력칸`** 마커로 표시되어 있어 사용자가 원하는 시점에 채워 넣을 수 있다.

```
src/config/ai-api.config.ts                       ← 환경변수 키 정의 (api입력칸)
src/infrastructure/ai/providers/llm.provider.ts   ← 텍스트 생성 (api입력칸)
src/infrastructure/ai/providers/vision.provider.ts← 이미지 OCR (api입력칸)
src/infrastructure/ai/providers/embedding.provider.ts ← 임베딩 (api입력칸)
```

`ai-coach`, `study-sessions`, `wrong-notes`, `mock-exams` 모듈은 모두 `AiService`만 의존하며,
공급자 교체(Anthropic ↔ OpenAI ↔ 자체 모델) 시 도메인 코드는 변경하지 않는다.

---

## 8. 확장성 고려

1. **모듈 독립성** — 각 도메인은 자체 controller/service/repository/dto를 가지며, 다른 도메인은 export 된 service만 의존한다. 추후 마이크로서비스 분리 시 모듈 단위로 절단 가능.
2. **읽기 전용 캐시 vs 원천 데이터 분리** — 숙련도/활동 통계는 `Attempt`에서 파생. 캐시는 Redis, 원천은 PostgreSQL.
3. **AI 비용 통제** — `ai:cache:*` 키로 동일 프롬프트 7일 캐싱, `lock:ai:*` 로 동시 호출 제한.
4. **이벤트 기반 측면 효과** — `Attempt` 저장 시 NestJS `EventEmitter2`로 `attempt.completed` 발행 →
   `wrong-notes`, `mastery`, `activity`, `streak` 가 구독해 비동기 갱신 (추후 BullMQ 큐로 이전 가능).
5. **국제화/과목 확장** — `Unit`/`SubUnit` 마스터 테이블만 추가하면 영어/국어 등 타 과목으로 확장 가능.

---

## 9. 로컬 실행

```bash
cp .env.example .env       # 환경변수 채우기 (api입력칸 포함)
docker compose up -d       # postgres + redis 기동
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev          # http://localhost:4000
```

# Mathēma — AI 학습 처방 시스템 (India-first, NCERT Class 7-12)

> **"학생이 무엇을 틀렸는지"가 아니라, "왜 틀렸고, 다음에 무엇을 풀어야 하는지"를 알려주는 AI 학습 처방 시스템.**

학습 데이터(풀이 시간 · 자신감 · 힌트 사용 · 단계별 풀이 입력)를 받아 LLM 으로 분석하고,
개념 간 graph 위에서 mastery / error-pattern / forgetting-risk 를 추적하며,
실제 데이터에 근거한 다음 문제를 추천합니다.

* **인도 1차 출시**: NCERT 79 챕터 (Class 7~12), KO/EN/HI 3 언어.
* **단계**: late-stage technical PoC. MVP 검수 체크리스트 14 절 통과 (커밋 `1037620`).
* GitHub: <https://github.com/prior89/mathema>

---

## 1. 시스템 아키텍처

```
                              ┌─────────────────────────────────────┐
                              │   Frontend (Vite + React + RQ)      │
                              │   /student   /parent   /teacher     │
                              │   /app (legacy)   /learn  /weakness │
                              └──────────────────┬──────────────────┘
                                                 │  REST + JWT
                                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       Backend (NestJS, Prisma)                       │
│ ┌──────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │
│ │ Attempts     │→ │ MasteryTrajectory│  │ LLMAnalysisService    │   │
│ │ (Grading)    │→ │ + MasteryEvent   │  │  + Zod + Concept 매칭 │   │
│ │              │→ │ ErrorPatternProf.│←│  + commonErrorCodes   │   │
│ └──────┬───────┘  └────────┬─────────┘  └──────────┬───────────┘   │
│        │ event              │                       │ setImmediate  │
│        ▼                    ▼                       ▼              │
│ ┌──────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │
│ │ Recommendation│  │ ReviewSchedule  │  │ WeeklyReport (3종)   │   │
│ │ (Adaptive +   │  │ (Ebbinghaus     │  │ student/parent/      │   │
│ │  Similar +    │  │  forgettingRisk)│  │ teacher summary      │   │
│ │  Log)         │  └──────────────────┘  └──────────────────────┘   │
│ └──────────────┘                                                    │
│  ↕  Feedback (rater × target) · TeacherOverride (감사)              │
└────────────┬────────────────────────────────────────────────────────┘
             │
   ┌─────────┴──────────┐
   ▼                     ▼
┌────────┐         ┌─────────┐
│Postgres│         │  Redis  │
│   16   │         │  cache  │
└────────┘         └─────────┘
```

### 도메인 모델 (Prisma)
* `User` (role: STUDENT | PARENT | TEACHER | ADMIN, tenantId)
* `Tenant` — 학원/기관 (multi-tenant)
* `Concept` — 개념 graph (`parentConceptId`, `prerequisiteConceptIds`, `relatedConceptIds`)
* `Problem` + `ProblemConcept` (N:M) — `commonErrorCodes`, `expectedSolutionSteps`, `requiredSkills`
* `Attempt` — `stepByStepInput`, `errorCodes`, `selfConfidenceScore`, `hintCount`, `timeOfDay`, `deviceType`
* `StudySession` — `focusScore`, `fatigueSignal`, `timeOfDay`, `context`
* `MasteryTrajectory` — 현재 mastery (`evidenceCount`, `trend`, `confidenceGap`)
* `MasteryEvent` — 시계열 이력 (heatmap/그래프)
* `ErrorPatternProfile` — (`conceptId`, `errorCode`) 누적 + `ACTIVE`/`IMPROVING`/`RESOLVED`
* `LLMAnalysisLog` — `promptVersion`, `inputHash`, `rawOutput`, `parsedOutput`, `validationStatus`
* `RecommendationLog` — `recommendationType`, `reason`, `accepted`, `solved`, `result`
* `TeacherOverride` — `beforeValue` / `afterValue` 감사 추적
* `Feedback` — `raterType × targetType × rating(1-5)`
* `Consent` — DPDP/GDPR append-only 동의 이력

### 기술 스택
* **Backend**: NestJS 10, Prisma 5, PostgreSQL 16, Redis 7
* **Frontend**: Vite + React 18 + TypeScript + React Query + Recharts + KaTeX
* **Mobile**: Capacitor 8 (Android)
* **LLM**: OpenAI (gpt-4o) — `LLM_PROVIDER` 로 Anthropic / Azure OpenAI 전환 가능
* **LangChain v1** — `@langchain/core`, `@langchain/openai`, `@langchain/anthropic`
* **Auth**: JWT HS256 (access 15m / refresh 14d, Redis 기반 revocation)
* **Monitoring**: Sentry + Application Insights + Prometheus (`/metrics`)
* **CI/CD**: GitHub Actions (OIDC) → Azure Container Apps + Static Web Apps
* **IaC**: Bicep (`infra/bicep/main.bicep`) — Central India 권장

---

## 2. 9개 핵심 데이터 흐름 (명세서 §4)

| Flow | 동작 | 검증 |
|---|---|---|
| 1 | `POST /sessions/start` → session row + **nextProblem 자동 추천** 함께 반환 | live |
| 2 | `POST /attempts` → rule-based `errorCodes` 즉시 + `basicFeedback` + `nextAction` | live |
| 3 | `setImmediate` LLM 분석 → `LLMAnalysisLog`(promptVersion/inputHash/validationStatus) → VALIDATED 만 `Attempt.errorCodes` 덮어쓰기 | live (gpt-4o ~15s) |
| 4 | Mastery 공식: `+5/-6`(정답) `-2`(힌트) `-1`(시간초과) `+2`(고난도 정답) `-2`(active 패턴) → `MasteryTrajectory` + `MasteryEvent` | live |
| 5 | ErrorPattern 상태 자동 전환 — 최근 5회 3+ → ACTIVE / 빈도 감소 → IMPROVING / 5회 미발생 → RESOLVED | live |
| 6 | SM-2 forgettingRisk = `1 - exp(-t / max(1, mastery/10))` | live |
| 7 | Adaptive next-problem — weak concept + active error + prerequisite + flow state difficulty + 중복 회피 | live |
| 8 | Similar 5개 — ProblemConcept 매칭 + commonErrorCodes 교집합 + `shortfallReason` | live |
| 9 | WeeklyReport 3종 — student / parent / teacher 별 분리 summary | live |

### LLM 검증 게이트 (§3-4)
* Zod 스키마로 응답 파싱 (errorCodes / conceptWeakness / reasoningSummary / recommendedAction / confidenceScore)
* `errorCodes` ∈ `Problem.commonErrorCodes ∪ ErrorCode enum`이 아니면 **REJECTED**
* `conceptWeakness` 가 `Problem.concepts.code` 와 매칭 안 되면 **NEEDS_REVIEW**
* `confidence >= 0.75` → **VALIDATED** (자동 반영) / `0.5~0.75` → **NEEDS_REVIEW** / `<0.5` → **REJECTED**
* VALIDATED 만 `Attempt.errorCodes` / `ErrorPatternProfile` / `MasteryTrajectory.updatedBy=HYBRID` 에 반영

---

## 3. API 표면 (명세서 §5)

### Sessions
* `POST /api/v1/sessions/start` ↔ `/api/v1/study-sessions/start` (별칭)
* `POST /api/v1/sessions/:id/end`
* `GET /api/v1/students/:id/sessions`

### Attempts
* `POST /api/v1/attempts` → `{ attemptId, isCorrect, errorCodes, conceptTags, difficultyLevel, basicFeedback, nextAction }`
* `GET /api/v1/attempts/:id` (cross-user 차단)
* `GET /api/v1/students/:id/attempts`
* `GET /api/v1/attempts/:id/similar-problems`

### Mastery & ErrorPattern
* `GET /api/v1/students/:id/mastery` (concept 단위)
* `GET /api/v1/students/:id/mastery/:conceptId/history`
* `GET /api/v1/students/:id/error-patterns(/active)`

### Recommendation
* `GET /api/v1/students/:id/next-problem`
* `GET /api/v1/recommendations/review-schedule`
* `POST /api/v1/recommendations/:id/result` `{accepted, solved, result}`

### Reports & Feedback
* `GET /api/v1/students/:id/weekly-reports`
* `GET /api/v1/weekly-reports/:id`
* `POST /api/v1/weekly-reports/generate`
* `POST /api/v1/feedback`
* `POST /api/v1/teacher-overrides` + `GET /api/v1/students/:id/teacher-overrides`

### Teacher (tenant-scoped)
* `GET /api/v1/students/teacher/list` — 같은 `tenantId` 의 STUDENT 목록

### Auth + Privacy + Misc
* `POST /api/v1/auth/{register,login,refresh,logout}` (JWT)
* `GET /api/v1/privacy/policy` + `/consents` (DPDP/GDPR)
* `GET /api/v1/health/{live,ready}`
* `GET /metrics` (Prometheus)

---

## 4. Frontend 화면 (명세서 §6)

| 화면 | 경로 | 컴포넌트 |
|---|---|---|
| **Student** (학생) | `/student` | 다음 문제 → AI mentor → Mastery 상태 카드 (evidenceCount 가드) → 개선된 개념 → 반복 실수 패턴 → 유사문제 5개 → 주간 요약 |
| **Parent** (학부모) | `/parent` | 진척 판정 (improving/mixed/stable/attention) → parentSummary → 4 stat → 좋아진 개념 → 학습 습관 신호 → 다음 주 관리 포인트 |
| **Teacher** (강사) | `/teacher` | 담당 학생 chip → Mastery Heatmap → 선택 concept 시계열 → 진단 메트릭 표 (Mastery/RecentAcc/ResponseTime/Hint%/ConfGap/Trend) → 오답 원인 비율 → ErrorPattern 테이블 + Override modal → teacherSummary → 주간 리포트 |
| Legacy | `/app` | 기존 통합 화면 (대시보드/오답/개념/학습/약점분석/모의/리포트 7탭) |
| Concept Learning | `/learn` + `/learn/:code` | NCERT 79 챕터 사전 개념학습 (HOOK→CONCRETE→PICTORIAL→ABSTRACT→WORKED→MISCONCEPTION→RETRIEVAL 7단계) |

`/` 진입 시 `RoleRedirect` 가 `User.role` 보고 자동 분기.

---

## 5. 빠른 시작 (로컬)

```powershell
# 0) 의존성
docker compose up -d                     # Postgres 16 + Redis 7

# 1) Backend
cd backend
cp .env.example .env                     # OPENAI_API_KEY 등 채움
npm install
npm run start:dev                        # predev 훅이 generate + migrate deploy 자동

# 2) Frontend
cd ../frontend
npm install
npm run dev                              # http://localhost:5173

# 3) (선택) E2E
npm run e2e:install
npm run e2e                              # AI 처방 전 흐름 자동 검증
```

### 시드 사용자 (dev 빠른 로그인용)
* email: `polopot123@gmail.com` / pw: `password1234`
* 가짜 누적 데이터는 자동 청소됨 (`LegacySeedCleanupBootstrap`, dev 한정).

### 환경 변수 핵심 (`backend/.env`)
```
NODE_ENV=development
DATABASE_URL=postgresql://...
REDIS_HOST=localhost  REDIS_PORT=6379
JWT_ACCESS_SECRET=...  JWT_REFRESH_SECRET=...

AI_LLM_PROVIDER=openai             # anthropic | openai | azure-openai
AI_LLM_API_KEY=sk-...
AI_LLM_MODEL=gpt-4o

LLM_PROVIDER=openai                # LangChain용 별도
OPENAI_API_KEY=sk-...
```

> Azure 배포 시 모든 시크릿은 **Azure Key Vault → Container App secrets** 로 주입.

---

## 6. 검수 통과 — MVP 체크리스트 (14절)

* §1 Session(8) + Attempt(14) — DB 저장 + tenantId · timeOfDay · stepByStepInput 모두 ✅
* §2 Problem 메타데이터(11) + Concept Graph(5) — prerequisite 추천 동작 ✅
* §3 LLM 환각 방지 — Zod + commonErrorCodes 범위 + Concept 매칭 + 임계값 0.75/0.5 ✅
* §4 MasteryTrajectory — 공식 정확 + `evidenceCount < 3` 단정 금지 가드 ✅
* §5 ErrorPattern — ACTIVE/IMPROVING/RESOLVED 자동 + 학생 UI 코칭 톤 ✅
* §6 Recommendation reason — 합격 예시 그대로 (수치 포함) ✅
* §7 Similar 5개 — `items` + `shortfallReason` ✅
* §8 WeeklyReport — 실 DB 만 사용, 3종 분리 ✅
* §9 UI 진실성 — Heatmap evidenceCount 흐림, mock data 0 ✅
* §10 API — 모든 endpoint 200, error message, 권한 차단 ✅
* §11 시나리오 A/B/C/D/E — Playwright E2E `1 passed (15.2s)` ✅
* §12 tenantId · JWT · role 4종 + LLM/추천/Override 로그 ✅
* §13 schema + API + seed + README + .env.example + promptVersion + 로직 주석 ✅
* §14 절대 합격 X 12 항목 — 모두 통과 ✅

### 검증된 라이브 흐름
* `/health/ready` 200 (`db: ok`, `redis: ok`)
* `POST /attempts` → rule-based `errorCodes` 즉시, 15s 후 `LLMAnalysisLog` VALIDATED + `MasteryTrajectory.delta=-8`
* `GET /next-problem` → `reason: "최근 5회 중 SIGN 오류가 3회 발생했고, 현재 masteryScore가 62점이므로 난이도 3/5 문제를 추천합니다."`
* `POST /weekly-reports/generate` → studentSummary/parentSummary/teacherSummary 3종 길이 79/68/166 분리
* `POST /teacher-overrides` → `TeacherOverride` row + beforeValue/afterValue JSON

---

## 7. 배포 — Azure Container Apps (Central India)

* `infra/bicep/main.bicep` — Log Analytics + App Insights + ACR + Container Apps + PostgreSQL Flexible 16 + Cache for Redis + Key Vault + Azure OpenAI + Static Web App
* `.github/workflows/backend-deploy.yml` — OIDC → ACR build/push → Container App revision → `/health/ready` 검증
* `.github/workflows/frontend-deploy.yml` — Vite build → SWA
* `backend/Dockerfile` — multi-stage, non-root, tini PID1, `prisma migrate deploy && node dist/src/main.js`
* 비용 추산: Container Apps + PG B1ms + Redis Basic + AOAI GPT-4o + App Insights = **~$96/월** (Azure $10k 크레딧 ≈ 100 개월)

자세한 배포 절차: `infra/README.md`.

---

## 8. 디렉토리 구조

```
교육앱/
├── backend/                  NestJS + Prisma
│   ├── prisma/
│   │   ├── schema.prisma     단일 진실 원천
│   │   ├── seed.ts           시스템 콘텐츠만 (사용자 누적 데이터 미시드)
│   │   └── migrations/       11 개 migration
│   ├── src/
│   │   ├── infrastructure/   prisma · redis · ai (providers · langchain · prompts)
│   │   └── modules/          attempts · mastery · llm-analysis · recommendations ·
│   │                         reports · students · feedback · privacy · concept-lessons …
│   └── Dockerfile
├── frontend/                 Vite + React
│   ├── src/pages/            StudentDashboardPage · ParentDashboardPage · TeacherDashboardPage · …
│   ├── src/components/       TopNav · GraphRenderer · …
│   └── e2e/                  Playwright (smoke + ai-prescription)
├── admin-frontend/           운영 어드민
├── infra/
│   ├── bicep/                Azure IaC
│   └── README.md             배포 가이드
├── scripts/
│   └── extract-ncert-excerpts.py
├── .github/workflows/        backend-deploy.yml · frontend-deploy.yml
├── COUNTRY_ROADMAP.md
├── OFFLINE_ROADMAP.md
├── POC.md
├── SETUP.md
└── README.md                 (이 문서)
```

---

## 9. 알려진 한계 (정직)

* **Similar 5개** — 시드 Problem 수가 적어 1/5 만 반환될 수 있음 (`shortfallReason` 표시). pgvector + Embedding 도입 시 자연 해소.
* **LLM worker** — 현재 `setImmediate` (명세서 "BullMQ 또는 간단한 worker" 허용). production 전환 시 BullMQ 마이그레이션 권장.
* **NCERT 79 챕터 hi 본문** — 인프라 완비, NCERT 힌디 PDF 추출 대기 (`scripts/extract-ncert-excerpts.py --lang hi`).
* **Concept seed** — NCERT 챕터 단위 1:1 매핑 (Phase 1). Concept 그래프 LLM 기반 자동 보강은 후속.

---

## 10. 라이선스 / 기여

내부 PoC. 외부 공개 라이선스는 1차 출시 전 정의.
이슈/PR: <https://github.com/prior89/mathema/issues>.

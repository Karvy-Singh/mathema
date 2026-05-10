# matheo · Korean math learning app

A full-stack technical PoC for an adaptive math learning app targeting Korean middle/high school curricula (중1 ~ 고3). Built as a teaching-aid prototype with a deliberately rich pedagogical model — three-step distractor analysis, SM-2 spaced repetition, weighted unit recommendations, and bilingual content delivery.

> **Project stage**: **technical PoC, late stage** — architecture and data model are production-grade; content (~27 problems) and AI integrations (LLM/Vision keys are stubs) are demo-only. See [Status](#status) for an honest assessment.

[![Stack](https://img.shields.io/badge/stack-NestJS%2010%20%2B%20Vite%2FReact%2018-142850)](https://github.com/prior89/mathema)
[![Lang](https://img.shields.io/badge/i18n-KO%2FEN-1FB8C4)](#bilingual)
[![License](https://img.shields.io/badge/license-private%20demo-5C6B85)](#)

---

## What it does

| Module | Description |
|---|---|
| **Dashboard** | Live AI diagnosis headline · 4-stat header (today minutes, streak, weekly accuracy, expected grade) · radar mastery map · weighted recommendations · 12-week heatmap · Error-DNA distribution · recent wrong-note cards |
| **Wrong notes** | Problem body + answer + **core concept + formula** + AI insight + similar problems (clickable preview) · SM-2 review (AGAIN / HARD / GOOD / EASY) with auto-mastery rule · permanent master toggle |
| **Study** | **Weighted unit recommendations** (mastery × wrong count × undertime score) · grade selector for advance learning · 3-step multiple choice (CONCEPT → PROCESS → ANSWER) · per-step distractor metadata · concept + formula reveal on completion or first wrong attempt · sequential step lock prevents answer leaks |
| **Mock exam** | 20 problems, 60 min · AI-tailored composition by mastery weakness · sequential step reveal · choice order shuffled per request · home button + browser back support |
| **Reports** | Weekly stats (hours/problems/accuracy/AI-score) · time-vs-accuracy chart · achievements · AI mentor message · meta-cognitive calibration (Brier score) |

### Bilingual

Every backend response goes through a request-scoped `@CurrentLang` decorator. The frontend axios interceptor sends `Accept-Language` based on the user's KO/EN toggle. **700+ translation entries** cover UI labels, problem bodies, step prompts, choice texts (with rationales), insights, formulas, concepts, AI-coach messaging, recommendation reasons, and exam names. Switching language reloads the page and React Query refetches every server-rendered string in the new language.

---

## Architecture

```
교육앱/
├── backend/                  # NestJS modular monolith
│   ├── prisma/
│   │   ├── schema.prisma     # 16 models (User, Unit, Problem, ProblemStep, ProblemChoice,
│   │   │                     #   Attempt, WrongNote, StudySession, MockExam, MockExamResult,
│   │   │                     #   DailyActivity, MasterySnapshot, AnalyticsEvent, WeeklyReport, …)
│   │   ├── migrations/       # 7 migrations (init → spaced-repetition → multi-step choices →
│   │   │                     #   analytics & soft-delete → grade-level curriculum → problem.concept)
│   │   ├── seed.ts           # 24 units, 27 problems, demo user, 250 attempts, 6 wrong notes,
│   │   │                     #   84-day heatmap, 6 mock results, 8-week reports
│   │   └── seed-steps.ts     # 27 problems × 3 steps × 5 choices with distractor metadata
│   ├── src/
│   │   ├── common/i18n/      # @CurrentLang decorator + content-en.ts (CONCEPT_EN / FORMULA_EN /
│   │   │                     #   STEP_PROMPT_EN / CHOICE_EN / SOURCE_EN / UNIT_NAME_EN / …)
│   │   ├── infrastructure/   # Prisma, Redis, AI provider (LLM/Vision/Embedding stubs)
│   │   └── modules/
│   │       ├── auth/         # JWT access/refresh
│   │       ├── users/
│   │       ├── curriculum/   # /units, /units?grade=…
│   │       ├── problems/     # sanitize, choice shuffle, EN translation
│   │       ├── study-sessions/   # /recommended-units (weighted), /start, /:id/answer, /:id/guide
│   │       ├── attempts/     # event-driven mastery & wrong-note auto-creation
│   │       ├── wrong-notes/  # SM-2 review, problemBody/Answer/Concept/Formula response
│   │       ├── mock-exams/   # AI compose (target=20), sanitize per request
│   │       ├── recommendations/  # 3 strategies (focus / weakness / strength)
│   │       ├── ai-coach/     # diagnosis, error-dna, patterns, mentor-message
│   │       ├── reports/      # weekly + meta-cognitive calibration
│   │       ├── activity/     # heatmap, streak
│   │       ├── mastery/      # event listeners → snapshot updates
│   │       └── analytics/    # AnalyticsEvent capture
│   └── docker-compose.yml    # postgres 16 + redis 7
└── frontend/                 # Vite + React 18 + TypeScript
    ├── public/
    │   └── matheo-logo.png   # brand mark (mix-blend-mode: multiply)
    └── src/
        ├── pages/MathLearningApp.tsx   # 5 internal pages, hash-based history sync
        ├── components/
        │   ├── ExamTakingScreen.tsx    # exam overlay, sequential reveal, home button
        │   ├── WrongNoteDetailModal.tsx
        │   ├── UnitPicker.tsx          # grade + unit dropdown for advance learning
        │   ├── ConfidenceSlider.tsx    # meta-cognitive 0~100 slider
        │   └── …
        ├── lib/
        │   ├── api.ts        # axios + Accept-Language + auto refresh
        │   ├── queries.ts    # all read queries
        │   ├── mutations.ts  # all writes
        │   └── translations.ts  # KO/EN UI dictionary
        └── context/AuthContext.tsx    # demo auto-login with seed account
```

### Pedagogical model: 3-step problem with distractor metadata

Every featured problem has 3 steps:

```
CONCEPT  →  Which formula / approach / definition applies here?
PROCESS  →  After substituting / applying, what does the form look like?
ANSWER   →  What is the final value?
```

Each step has 5 choices: 1 correct + 4 distractors classified as
`CONCEPT_CONFUSION` / `CALC_ERROR` / `PROCESS_SKIP` / `TIME_PRESSURE_GUESS` with a `rationale` string explaining why a learner might pick it. Wrong-attempt analytics aggregate by distractor type to drive the AI coach's pattern detection.

**Sequential reveal in mock exam**: step 2's choices are hidden until step 1 is answered, preventing reverse-engineering the previous step's answer from the next step's content.

**Choice shuffle**: Fisher-Yates shuffle on every request — the correct option is at a random position. The frontend renders display indices `1..5` from array order so the learner sees clean numbering regardless.

### Weighted unit recommendation

```
weight = 0.45 × (100 − mastery)     // mastery gap
       + 0.35 × min(60, 12 × wrongCount)   // wrong-note pressure
       + 0.20 × round(40 × (1 − timeSec / maxTime))  // undertime score
```

Returned with reason strings (`"숙련도 52% · 오답 2건 · 학습 180분"` / `"Mastery 52% · 2 wrong notes · 180 min studied"`) so the learner sees *why* a unit is recommended.

### Color system (psychology + design)

| Role | Hex | Rationale |
|---|---|---|
| Primary text/border | `#142850` | Logo navy — trust, focus |
| Brand accent (highlight) | `#1FB8C4` | Logo teal — energy, "discover" |
| Success (correct, mastered) | `#5A8A45` | Brighter sage — growth, achievement |
| Warning (wrong, weak unit) | `#C25E2E` | Warm red-orange — attention without aggression (lower cortisol response than deep red) |
| Streak / progress | `#C7791F` | Amber — motivation without alarm |
| Body secondary | `#5C6B85` | Cool navy gray — color-temperature harmony with primary |
| Body tertiary / captions | `#8B95AB` | Light navy gray |
| Background page | `#EFEBDF` | Cream with slight cool shift — paper-like, navy-harmonious |
| Background card | `#F8F4E9` | Lighter cream — elevated layer |

385 color references swapped from the original warm-dark palette to this system in one consistent pass.

---

## Tech stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 20 LTS |
| Backend | NestJS 10 + TypeScript 5 + Prisma 5 + PostgreSQL 16 + Redis 7 |
| Auth | JWT access + refresh |
| Validation | class-validator + class-transformer DTOs |
| Frontend | Vite + React 18 + TypeScript + React Query 5 + Recharts 2 |
| Icons | lucide-react |
| AI | LLM / Vision / Embedding provider interfaces — stubs return localized fallback text when API keys are unset |

---

## Local setup (3 steps)

### 1. PostgreSQL + Redis

```bash
cd backend
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env          # AI_*_API_KEY can stay as `api입력칸` (placeholder) — falls back to canned responses
npm install
npx prisma migrate deploy
npx prisma generate
npm run db:seed
npm run start:dev             # http://localhost:4000  (API mounted at /api/v1)
```

### 3. Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

Open `http://localhost:5173` — the demo automatically logs in as the seed user (login screen is skipped in demo mode). To enable a real login flow, see `frontend/src/context/AuthContext.tsx`.

### Demo account

```
email:    polopot123@gmail.com
password: password1234
gradeLevel: G_MIDDLE_1   (Korean middle-school grade 1)
```

Seeded data:
- **24 units** across 6 grades (중1 정수와 유리수 / 일차방정식 / … → 고3 미적분 II / 확률·통계 / 기하·벡터)
- **27 problems** with full 3-step distractor structure (20 중1 + 7 고3 featured)
- **81 problem steps**, **405 choices** with rationales
- 6 wrong notes spanning the SM-2 lifecycle (PENDING / ANALYZING / MASTERED, with `nextReviewAt` past/today/future)
- 250 attempts spread over 90 days
- 84-day heatmap with a 23-day current streak
- 6 mock exam results (3월~10월 모의고사) showing a 62→84 progression
- 8 weekly reports with mentor messages

### Environment variables

`backend/.env.example` — key entries:
- `DATABASE_URL` — Postgres connection string
- `REDIS_HOST` / `REDIS_PORT`
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — replace with random strings in production
- `AI_LLM_API_KEY` / `AI_VISION_API_KEY` / `AI_EMBEDDING_API_KEY` — `api입력칸` placeholder; fill to enable real LLM/Vision calls

`frontend/.env.example`:
- `VITE_API_BASE_URL=/api/v1` — Vite dev proxy forwards to the backend on `:4000`

---

## API surface

5 internal pages map to about 45 endpoints. Highlights:

| Endpoint | Returns |
|---|---|
| `GET /dashboard/summary` | today minutes, streak, weekly accuracy delta, expected grade |
| `GET /mastery` | radar dataset (subject, value, unitId) |
| `GET /recommendations/today` | 3 cards (focus-on-mistakes / reinforce-weakness / maintain-strength) |
| `GET /curriculum/units?grade=…` | units filtered by grade for the user (advance-learning support) |
| `GET /study-sessions/recommended-units?count=3&grade=…` | weighted recommendations with reason strings |
| `POST /study-sessions/start` | start a study session for a unit |
| `POST /study-sessions/:id/answer` | submit an attempt; response includes choice text, distractor type, rationale |
| `GET /problems/recommended?unitId=…` | ZPD-matched problems with shuffled choices and EN translation |
| `GET /wrong-notes` / `/recent` / `/due` / `/:id` / `:id/review` / `:id/status` | wrong-note CRUD + SM-2 |
| `POST /mock-exams/types/:kind/start` | start a mock exam (mini / wrong-redo / real, target 20 problems) |
| `POST /mock-exams/results/:id/submit` | grade and persist a result |
| `GET /ai-coach/diagnosis` / `/error-dna` / `/patterns` / `/mentor-message` | AI-coach surfaces |
| `GET /reports/weekly/current` / `/time-vs-accuracy` / `/next-focus` / `/achievements` / `/calibration` | report charts |
| `GET /activity/heatmap?weeks=12` / `/streak` / `/stats` | activity panels |

All authenticated routes carry `Authorization: Bearer <jwt>` and respect `Accept-Language: ko|en`.

---

## Status

**Honest stage assessment** — late-stage technical PoC.

| Area | State | Notes |
|---|---|---|
| Schema & data model | Production-grade | 16 models, indexes, soft-delete, FK consistency, event-driven mastery |
| Backend architecture | Production-grade | NestJS modular monolith, validated DTOs, request-scoped i18n |
| Type safety | Production-grade | `tsc --noEmit` clean on both projects |
| Pedagogical model | Differentiated | 3-step distractor + SM-2 + weighted recommendation is non-trivial |
| Bilingual coverage | Production-grade | 700+ entries, request-scoped lang detection |
| Color & visual system | Coherent | 385-ref color-psychology palette, single-mark logo |
| Content volume | **Demo-only** | 27 problems. Real product needs thousands per grade. |
| AI integration | **Stubbed** | LLM/Vision/Embedding return canned fallback when keys unset |
| Auth | **Demo-only** | Seed-account auto-login. No Google OAuth, no email verification |
| Authoring tooling | **None** | Adding problems = editing `seed.ts` |
| Tests | **Minimal** | No spec/test files |
| CI / deployment | **None** | localhost only |

**To reach an alpha**: ① fill `AI_*_API_KEY` (1–2 days) · ② 200+ problems for one grade (2–4 weeks) · ③ Google OAuth (1 week) · ④ tests + CI (1 week) · ⑤ deployment (3–5 days). ~6–8 weeks total + content authoring effort.

---

## Roadmap (selected)

- [ ] Wire `AI_*_API_KEY` to real Anthropic / OpenAI for `ai-coach` mentor / step-wise guide / OCR
- [ ] Google OAuth (single flow handling sign-up + sign-in)
- [ ] CMS or CSV import for problem authoring
- [ ] Domain unit tests + e2e for critical flows (attempt → mastery → wrong-note creation)
- [ ] CI build + deploy (Render / Fly / Vercel)
- [ ] Admin dashboards for cohort / funnel / retention from `AnalyticsEvent`

The full backend design document lives at `backend/README.md` (Korean). UI design tokens and component map are inline in `frontend/src/`.

---

## Architectural notes worth knowing

- **No request-time AI cost**: every AI surface (`ai-coach.service.ts`) ships a deterministic Korean/English fallback. Real LLM calls are only made when the keys are non-placeholder. Cache TTL is 7 days in Redis (`AiService.cacheKey`).
- **Choice integrity**: backend keeps `choiceIndex` (1~5) as the stable identifier for translation lookup, while shuffling array order per request. The frontend renders array-position bubbles so the learner sees clean numbering.
- **History semantics**: in-app navigation pushes hash entries (`#/dashboard`, `#/mock-exam/exam`), so the browser back button moves within the app rather than leaving it. Mock exam exits cleanly on `popstate`.
- **Auto-master rule**: a wrong note is auto-marked `MASTERED` after ≥3 consecutive `EASY` reviews and ≥30 days since creation (see `wrong-notes/services/spaced-repetition.service.ts`).
- **Difficulty matching**: `recommendedDifficulties(masteryScore)` and `examDifficultyDistribution(masteryScore)` produce a Vygotsky-style ZPD distribution for problem selection.

---

## License

Private demo. Not for redistribution.

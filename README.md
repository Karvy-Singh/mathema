# Mathēma · 수능 수학 학습 앱

Cowork 모드에서 설계·구현된 풀스택 학습 앱.
- **Frontend**: Vite + React 18 + TypeScript + React Query + Recharts
- **Backend**: NestJS 10 + Prisma 5 + PostgreSQL 16 + Redis 7 (모듈러 모놀리스)
- **Auth**: JWT access/refresh
- **AI**: 외부 LLM/Vision API (`api입력칸` 마커로 키 자리 표시)

## 디렉토리

```
교육앱/
├── MathLearningApp.jsx     # 원본 디자인 (보존)
├── backend/                # NestJS 서버
│   ├── prisma/
│   ├── src/
│   ├── docker-compose.yml  # postgres + redis
│   └── README.md           # 백엔드 설계 문서 (도메인 매핑 / 파일 구조도 / API)
└── frontend/               # Vite 클라이언트
    ├── src/
    │   ├── lib/api.ts      # axios + 자동 refresh
    │   ├── lib/queries.ts  # 모든 도메인 fetcher
    │   ├── context/AuthContext.tsx
    │   ├── pages/MathLearningApp.tsx   # 5개 페이지 (대시보드/오답노트/학습/모의고사/리포트)
    │   ├── pages/LoginPage.tsx
    │   └── pages/RegisterPage.tsx
    └── vite.config.ts      # /api → http://localhost:4000 프록시
```

## 로컬 실행 (3 단계)

### 1. PostgreSQL + Redis 기동

```bash
cd backend
docker compose up -d
```

### 2. 백엔드 셋업

```bash
cd backend
cp .env.example .env          # AI_*_API_KEY 는 'api입력칸' 그대로 두면 LLM 미호출 fallback 동작
npm install
npx prisma migrate dev --name init
npm run db:seed               # 시드 사용자: polopot123@gmail.com / password1234
npm run start:dev             # http://localhost:4000  (API: /api/v1)
```

### 3. 프론트엔드 셋업 (새 터미널)

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

브라우저에서 `http://localhost:5173` 접속 → 로그인 화면이 뜨면 시드 계정으로 로그인.

## 시드 계정

```
이메일:   polopot123@gmail.com
비밀번호: password1234
```

이 계정에는 단원 6개, 샘플 문제 7개, 오답 6개, 시도 250개(90일치),
일일 활동 84일치(heatmap), 단원별 숙련도, 모의고사 6회 결과, 주간 리포트 8주가 시드돼 있습니다.

## 환경 변수

`backend/.env.example` 참고. 핵심:
- `DATABASE_URL` — Postgres 접속 문자열
- `REDIS_HOST` / `REDIS_PORT`
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — 임의 랜덤 문자열로 변경
- `AI_LLM_API_KEY` / `AI_VISION_API_KEY` / `AI_EMBEDDING_API_KEY` — `api입력칸` (선택)

`frontend/.env.example`:
- `VITE_API_BASE_URL=/api/v1` — Vite 프록시 경유 (변경 불필요)

## 5개 페이지 ↔ 백엔드 엔드포인트

| 페이지 | 사용 엔드포인트 |
|---|---|
| **대시보드** | `/dashboard/summary`, `/mastery`, `/recommendations/today`, `/wrong-notes/recent`, `/activity/heatmap`, `/activity/stats`, `/ai-coach/error-dna`, `/ai-coach/diagnosis` |
| **오답노트** | `/wrong-notes/stats`, `/wrong-notes`, `/ai-coach/patterns` |
| **학습** | (정적 데모 — 추후 `/study-sessions/start` 연결) |
| **모의고사** | `/mock-exams/summary`, `/mock-exams/trajectory`, `/mock-exams/results` |
| **리포트** | `/reports/weekly/current`, `/reports/weekly/time-vs-accuracy`, `/reports/weekly/next-focus`, `/reports/weekly/achievements`, `/ai-coach/mentor-message`, `/mastery` |

## 다음 단계 (선택)

1. **AI 키 채우기** — `.env` 의 `AI_*_API_KEY` 를 실제 키로 교체하면 `ai-coach`/`study-sessions`/`wrong-notes` 의 LLM/Vision 호출이 활성화됩니다 (코드 수정 불필요).
2. **학습 세션 라우트 연결** — `pages/MathLearningApp.tsx` 의 `StudyPage` 를 `useQuery(['study', id], ...)` 로 교체.
3. **사진 업로드 실연동** — `wrong-notes/services/ocr.service.ts` 가 이미 `AiService.parseProblemImage` 를 호출. Vision Provider 의 `api입력칸` 만 채우면 동작.

설계 세부 사항은 `backend/README.md` 에 정리돼 있습니다.

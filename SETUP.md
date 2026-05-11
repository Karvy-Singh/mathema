# matheo — Local setup

Bilingual guide. **English first, Korean below.**

---

## English

### Prerequisites
- **Node.js 18+** (LTS recommended)
- **Docker Desktop** (for Postgres + Redis)
- **Git**

### 1. Clone
```bash
git clone https://github.com/prior89/mathema.git
cd mathema
```

### 2. Backend — `backend/`
```bash
cd backend
cp .env.example .env
docker compose up -d            # Postgres :5432, Redis :6379
npm install
npx prisma migrate dev          # Apply migrations + generate Prisma client
npm run db:seed                 # Seed: 1 user, 24 units, 39 problems, 250 attempts, ...
npm run start:dev               # → http://localhost:4000  (API: /api/v1)
```

Notes:
- Leave `api입력칸` for AI keys in `.env` as-is — the backend falls back to local heuristics when unset.
- `Mail`, `Sentry`, `Firebase`, `Google Sign-In` are all optional; missing env vars just disable that feature.

### 3. Frontend — `frontend/` (new terminal)
```bash
cd frontend
cp .env.example .env            # has VITE_ENABLE_DEMO_AUTO_LOGIN=true by default
npm install
npm run dev                     # → http://localhost:5173
```

Demo auto-login is on, so opening `localhost:5173` drops you straight into the dashboard as **Arjun Sharma** (seed user, NCERT Class 7).

### 4. Admin — `admin-frontend/` (new terminal, optional)
```bash
cd admin-frontend
npm install
npm run dev                     # → http://localhost:5174
```

Sign in with the seed credentials below. Only emails in backend `ADMIN_EMAILS` env (default: `polopot123@gmail.com`) can access.

### 5. Seed credentials
```
email:    polopot123@gmail.com
password: password1234
```

### 6. Daily commands
```bash
# Backend
cd backend && npm run start:dev
# Frontend
cd frontend && npm run dev
# Admin (optional)
cd admin-frontend && npm run dev

# After changing prisma/schema.prisma:
cd backend && npx prisma migrate dev --name <change-name>

# After pulling changes that touch package.json:
npm install
```

### 7. Troubleshooting

| Symptom | Fix |
|---|---|
| `Failed to resolve import "katex"` etc. in Vite | `cd frontend && npm install` (deps changed) |
| Backend 500s / Prisma errors | Stop dev server, run `npx prisma generate && npx prisma migrate dev` |
| Port 4000/5173/5174 busy | Kill the process or change in `.env` / `vite.config.ts` |
| Postgres connection refused | From `backend/`: `docker compose ps` — is Postgres container running? |
| `JWT secrets insecure` on prod boot | Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"` and put into `.env` |

### 8. Android build (optional, for Play testing)
```bash
cd frontend
npm run build
npx cap sync android
npx cap open android            # opens Android Studio
```

---

## 한글

### 사전 준비
- **Node.js 18+** (LTS 권장)
- **Docker Desktop** (Postgres + Redis 용)
- **Git**

### 1. 클론
```bash
git clone https://github.com/prior89/mathema.git
cd mathema
```

### 2. 백엔드 — `backend/`
```bash
cd backend
cp .env.example .env
docker compose up -d            # Postgres :5432, Redis :6379 컨테이너 기동
npm install
npx prisma migrate dev          # 마이그레이션 적용 + Prisma 클라이언트 생성
npm run db:seed                 # 시드: 사용자 1명, 단원 24개, 문제 39개, 시도 250건 등
npm run start:dev               # → http://localhost:4000  (API: /api/v1)
```

참고:
- `.env` 의 AI 키 자리(`api입력칸`) 는 비워둬도 됨 — 미설정 시 백엔드가 로컬 fallback 으로 동작.
- 메일·Sentry·Firebase·Google 로그인은 모두 선택사항. env 미설정이면 해당 기능만 비활성화.

### 3. 프론트엔드 — `frontend/` (새 터미널)
```bash
cd frontend
cp .env.example .env            # 기본값에 VITE_ENABLE_DEMO_AUTO_LOGIN=true 들어 있음
npm install
npm run dev                     # → http://localhost:5173
```

데모 자동 로그인이 켜져 있어서 `localhost:5173` 열면 **Arjun Sharma**(시드 계정, NCERT Class 7) 로 바로 대시보드 진입.

### 4. 어드민 — `admin-frontend/` (새 터미널, 선택)
```bash
cd admin-frontend
npm install
npm run dev                     # → http://localhost:5174
```

아래 시드 계정으로 로그인. 백엔드의 `ADMIN_EMAILS` env (기본 `polopot123@gmail.com`) 에 등록된 이메일만 접근 가능.

### 5. 시드 계정
```
이메일:   polopot123@gmail.com
비밀번호: password1234
```

### 6. 자주 쓰는 명령
```bash
# 백엔드
cd backend && npm run start:dev
# 프론트엔드
cd frontend && npm run dev
# 어드민 (선택)
cd admin-frontend && npm run dev

# prisma/schema.prisma 수정 후:
cd backend && npx prisma migrate dev --name <변경이름>

# pull 받았는데 package.json 변경됐을 때:
npm install
```

### 7. 트러블슈팅

| 증상 | 해결 |
|---|---|
| Vite 에서 `katex` 등 import 실패 | `cd frontend && npm install` (의존성 변경됨) |
| 백엔드 500 / Prisma 에러 | dev 서버 중단 후 `npx prisma generate && npx prisma migrate dev` |
| 4000/5173/5174 포트 점유 | 프로세스 종료하거나 `.env` / `vite.config.ts` 에서 변경 |
| Postgres 연결 거부 | `backend/` 에서 `docker compose ps` — Postgres 컨테이너 동작 중인지 확인 |
| production 부팅 시 `JWT secrets insecure` | `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"` 두 번 실행해 `.env` 반영 |

### 8. Android 빌드 (선택, Play 테스트용)
```bash
cd frontend
npm run build
npx cap sync android
npx cap open android            # Android Studio 열림
```

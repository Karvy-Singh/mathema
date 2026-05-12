# =============================================================
#  Mathēma backend — production Dockerfile
#  Multi-stage: deps → build → runtime (slim, non-root, healthcheck)
# =============================================================

# ----- stage 1: install deps (cached) -----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev=false

# ----- stage 2: build (TypeScript + Prisma client) -----
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# Prune dev deps for runtime image — drastically smaller
RUN npm prune --omit=dev

# ----- stage 3: runtime -----
FROM node:20-alpine
LABEL org.opencontainers.image.title="mathema-backend" \
      org.opencontainers.image.source="https://github.com/prior89/mathema"

RUN apk add --no-cache curl tini \
 && addgroup -S app && adduser -S app -G app

WORKDIR /app
ENV NODE_ENV=production \
    PORT=4000 \
    NODE_OPTIONS="--enable-source-maps"

COPY --from=build --chown=app:app /app/dist          ./dist
COPY --from=build --chown=app:app /app/node_modules  ./node_modules
COPY --from=build --chown=app:app /app/prisma        ./prisma
COPY --from=build --chown=app:app /app/package.json  ./

USER app
EXPOSE 4000

# 컨테이너 헬스 — Azure Container Apps 의 liveness probe 도 동일 path 사용 권장.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://localhost:4000/api/v1/health/live || exit 1

# tini 가 PID 1 — Container Apps 가 보낸 SIGTERM 을 NestJS 까지 전파시켜 graceful shutdown.
ENTRYPOINT ["/sbin/tini", "--"]
# 컨테이너 시작 시 마이그레이션 자동 적용 후 서버 기동.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]

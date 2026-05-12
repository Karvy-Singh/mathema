# Offline Roadmap (Phase 7 — 후속 작업)

현재 Capacitor Android 셸은 통합되어 있고 PWA 호환 준비도 됐다. 오프라인 학습은 다음 두 트랙으로 단계 도입:

## 트랙 A: Vite PWA (가장 빠른 PoC)

`vite-plugin-pwa` 추가 → manifest + Workbox 자동 생성:

```bash
cd frontend
npm install --save-dev vite-plugin-pwa
```

`vite.config.ts`:
```ts
import { VitePWA } from 'vite-plugin-pwa';
plugins: [
  react(),
  VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      runtimeCaching: [
        { urlPattern: /\/api\/v1\/(curriculum|concept-lessons|mastery)/, handler: 'StaleWhileRevalidate' },
        { urlPattern: /\/api\/v1\/recommendations/, handler: 'NetworkFirst' },
      ],
    },
    manifest: {
      name: 'Mathēma',
      short_name: 'Mathēma',
      lang: 'hi',
      theme_color: '#142850',
      background_color: '#EFEBDF',
      icons: [/* TODO icons */],
    },
  }),
]
```

→ 오프라인 시 기존에 받은 단원·개념학습 데이터는 그대로 노출. 답안 제출은 큐잉 안 됨(트랙 B 필요).

## 트랙 B: 답안 큐잉 + Capacitor SQLite

오프라인 중 푼 문제·답안을 로컬 DB 에 쌓고, 네트워크 복구 시 자동 동기화:

```bash
npm install @capacitor-community/sqlite @tanstack/query-persist-client-core @tanstack/query-sync-storage-persister
```

핵심 구조:
1. **로컬 큐**: `pending_attempts` 테이블 — `(id, payload, createdAt)`. POST `/attempts` 가 실패하면 큐에 저장.
2. **동기화 워커**: `online` 이벤트 + 30초 폴링으로 큐 비우기. 성공 시 row 삭제.
3. **충돌 해결**: 서버는 `Attempt.createdAt` 을 신뢰. duplicate `(userId, problemId, createdAt)` 은 멱등 upsert.
4. **로컬 마스터리 추정**: 오프라인 중 BKT 갱신을 클라이언트도 동일 알고리즘으로 수행 → 화면에 즉시 반영, 서버 sync 후 합치기.

## 트랙 C (장기): 단원 다운로드

전체 단원의 문제·개념학습을 사전 다운로드:
- `GET /curriculum/:unitId/offline-pack` → 1 단원분 JSON + LaTeX 렌더 + 이미지 (압축)
- 학생이 명시적으로 "오프라인 사용" 토글 후 다운로드
- 동기화 시 무엇이 변경됐는지 ETag 비교

---

위 트랙들은 *데이터 흐름* 변경이 크므로 분리 PR 로 진행. 본 PR 은 Phase 7 = 모니터링(App Insights + Prometheus) + E2E(Playwright) 까지 포함.

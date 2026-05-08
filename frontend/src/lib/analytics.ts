import { api } from './api';

/**
 * 사용자 행동 트래킹 — POC funnel/retention 분석용.
 *
 * 사용:
 *   track('cta.click', { name: 'start_study', unitId });
 *   track('perspective.change', { from: '단계별', to: '시각화' });
 *
 * - sessionId는 브라우저 탭 단위 (sessionStorage). 탭 닫으면 새 세션.
 * - fire-and-forget — 실패해도 사용자 흐름 영향 없음.
 * - 인증 토큰이 있으면 자동 첨부 (api.ts interceptor).
 */

const SESSION_KEY = 'mathema.analytics.session';
const QUEUE_FLUSH_MS = 1000;

function uuid(): string {
  // crypto.randomUUID 미지원 환경 fallback
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as any).randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getSessionId(): string {
  let s = sessionStorage.getItem(SESSION_KEY);
  if (!s) {
    s = uuid();
    sessionStorage.setItem(SESSION_KEY, s);
  }
  return s;
}

// 단순 큐 (네트워크 한 번에 묶지 않고 순차 발사 — 1개씩 fire and forget)
const queue: Array<{ eventType: string; payload: any; t: number }> = [];
let flushScheduled = false;

function scheduleFlush() {
  if (flushScheduled) return;
  flushScheduled = true;
  setTimeout(flush, QUEUE_FLUSH_MS);
}

async function flush() {
  flushScheduled = false;
  const sid = getSessionId();
  while (queue.length > 0) {
    const item = queue.shift()!;
    try {
      await api.post('/analytics/events', {
        eventType: item.eventType,
        payload: item.payload,
        sessionId: sid,
      });
    } catch {
      // silent — 분석 실패가 사용자 경험에 영향 X
    }
  }
}

export function track(eventType: string, payload: Record<string, any> = {}) {
  queue.push({ eventType, payload, t: Date.now() });
  scheduleFlush();
}

/** 페이지 진입 시 호출 (router useEffect 또는 mount) */
export function trackPageView(path: string, extra?: Record<string, any>) {
  track('page.view', { path, ...extra });
}

/** 명시적 사용자 행동 — CTA 버튼 클릭 등 */
export function trackClick(name: string, extra?: Record<string, any>) {
  track('cta.click', { name, ...extra });
}

/** 흐름 분기 — 모달 오픈/닫힘, 탭 전환 등 */
export function trackUi(action: string, extra?: Record<string, any>) {
  track('ui.' + action, extra);
}

/** 페이지를 떠날 때 큐를 비움 (best effort) */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (queue.length === 0) return;
    const sid = getSessionId();
    // sendBeacon은 토큰 헤더 못 붙이므로 그대로 axios 시도. unload 시점이라 종종 실패함 — 어차피 best effort.
    void flush();
    // 백업으로 sendBeacon (인증 없이라도 큐만이라도 던지기) — 현 backend는 인증 필수라 무시될 가능성 큼
    if (navigator.sendBeacon) {
      try {
        const blob = new Blob([JSON.stringify({ events: queue, sessionId: sid })], { type: 'application/json' });
        navigator.sendBeacon('/api/v1/analytics/events', blob);
      } catch { /* noop */ }
    }
  });
}

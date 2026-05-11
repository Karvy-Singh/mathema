import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { I18nProvider } from './lib/i18n';
import { initCapacitorBridge } from './native/capacitor-bridge';

// Sentry — VITE_SENTRY_DSN 미설정이면 no-op.
const dsn = (import.meta as any).env?.VITE_SENTRY_DSN as string | undefined;
if (dsn) {
  Sentry.init({
    dsn,
    environment: (import.meta as any).env?.MODE ?? 'development',
    tracesSampleRate: Number((import.meta as any).env?.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    // 개인식별정보 제거 — Default Privacy 강화
    sendDefaultPii: false,
  });
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 } },
});

// 안드로이드 래퍼 전용 초기화 — web 빌드에서는 모두 no-op.
initCapacitorBridge().catch(() => { /* ignore */ });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </I18nProvider>
  </React.StrictMode>,
);

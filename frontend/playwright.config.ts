import { defineConfig, devices } from '@playwright/test';

/**
 * Mathēma — E2E config.
 *
 * 실행:
 *   npm run e2e             # 전체
 *   npm run e2e -- --ui     # 인터랙티브
 *
 * 가정:
 *   - backend  http://localhost:4000  (start:dev)
 *   - frontend http://localhost:5173  (vite dev)
 *
 * CI 에서는 webServer 가 자동 기동.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // mobile (Capacitor 라는 wrapping 전이라 viewport 만 시뮬레이트)
    { name: 'mobile',   use: { ...devices['Pixel 7']        } },
  ],

  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});

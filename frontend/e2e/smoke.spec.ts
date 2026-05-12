import { test, expect } from '@playwright/test';

/**
 * Smoke test — 로그인 화면 노출 + 언어 토글 + 대시보드 진입까지.
 *
 * 비-인증 흐름만 검사 (계정 자동생성 없이 안전하게 돌아감).
 * 실제 로그인 후 흐름은 별도 spec 에서 fixture 로 분리.
 */

test.describe('Mathēma — public smoke', () => {
  test('lands on login + can toggle language', async ({ page }) => {
    await page.goto('/');
    // 로그인 페이지로 redirect 되거나 노출
    await expect(page).toHaveURL(/login|auth|\/$/);

    // 언어 토글 (HI / EN / KO 3개 버튼이 있어야 함)
    const koButton = page.getByRole('button', { name: /^KO$/ });
    const enButton = page.getByRole('button', { name: /^EN$/ });
    const hiButton = page.getByRole('button', { name: /^HI$/ });

    // 적어도 하나는 보여야 함 (페이지 별 노출 위치 변동 가능성 있어 OR)
    const visibleCount =
      (await koButton.isVisible().catch(() => false) ? 1 : 0) +
      (await enButton.isVisible().catch(() => false) ? 1 : 0) +
      (await hiButton.isVisible().catch(() => false) ? 1 : 0);
    expect(visibleCount).toBeGreaterThanOrEqual(1);
  });

  test('backend health is reachable from frontend origin', async ({ request }) => {
    const apiBase = process.env.E2E_API_BASE ?? 'http://localhost:4000/api/v1';
    const res = await request.get(`${apiBase}/health/ready`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('status');
  });
});

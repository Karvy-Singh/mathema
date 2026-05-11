/**
 * Capacitor native plugin bridge — 안드로이드 래퍼에 한정된 동작 (web 빌드에서는 no-op).
 *
 *  - 뒤로가기 버튼: ProtectedRoute / Modal stack 위에서 자연스러운 종료/뒤로 동작
 *  - StatusBar: 색상·아이콘 톤 일치
 *  - PushNotifications: 첫 진입 시 권한 요청 + FCM 토큰 백엔드 등록
 *
 * 플러그인은 동적 import — Capacitor.isNativePlatform() 일 때만 로드.
 * `@vite-ignore` + 변수 우회 — 패키지가 설치되어 있지 않은 web-only dev 환경에서도
 * Vite 가 모듈을 정적 분석하지 않도록 한다 (실제로 native 빌드에서만 로드됨).
 */
import { post } from '../lib/api';

// Vite 가 string literal 이 아니라 변수만 보고 resolve 를 건너뛰게 한다.
const PKG_CORE = '@capacitor/core';
const PKG_STATUS = '@capacitor/status-bar';
const PKG_APP = '@capacitor/app';
const PKG_PUSH = '@capacitor/push-notifications';

const dynImport = (name: string): Promise<any> =>
  import(/* @vite-ignore */ name).catch(() => null);

export async function initCapacitorBridge() {
  const core: any = await dynImport(PKG_CORE);
  const Capacitor = core?.Capacitor;
  if (!Capacitor?.isNativePlatform?.()) return;

  // ----- StatusBar -----
  const status: any = await dynImport(PKG_STATUS);
  if (status?.StatusBar && status?.Style) {
    try {
      await status.StatusBar.setStyle({ style: status.Style.Light });
      await status.StatusBar.setBackgroundColor({ color: '#EFEBDF' });
      await status.StatusBar.setOverlaysWebView({ overlay: false });
    } catch { /* plugin not installed in this build */ }
  }

  // ----- 뒤로가기 버튼 -----
  const appPlugin: any = await dynImport(PKG_APP);
  if (appPlugin?.App) {
    try {
      appPlugin.App.addListener('backButton', async () => {
        if (window.history.length > 1 && window.location.pathname !== '/') {
          window.history.back();
          return;
        }
        if ((window as any).__matheoLastBack && Date.now() - (window as any).__matheoLastBack < 2000) {
          appPlugin.App.exitApp();
          return;
        }
        (window as any).__matheoLastBack = Date.now();
        window.dispatchEvent(new CustomEvent('mathema-toast', {
          detail: { id: Date.now(), kind: 'info', text: 'Press back again to exit' },
        }));
      });
    } catch { /* plugin not installed */ }
  }

  // ----- 푸시 알림 (FCM) -----
  const pushMod: any = await dynImport(PKG_PUSH);
  if (pushMod?.PushNotifications) {
    try {
      const PN = pushMod.PushNotifications;
      const perm = await PN.checkPermissions();
      let granted = perm.receive === 'granted';
      if (!granted) {
        const r = await PN.requestPermissions();
        granted = r.receive === 'granted';
      }
      if (granted) {
        await PN.register();
        PN.addListener('registration', async (token: { value: string }) => {
          try {
            await post('/push/register', {
              token: token.value,
              platform: 'android',
              appVersion: '0.1.0',
            });
          } catch { /* network/backend down */ }
        });
        PN.addListener('registrationError', (err: any) => {
          // eslint-disable-next-line no-console
          console.warn('FCM registration error', err);
        });
      }
    } catch { /* plugin not installed */ }
  }
}

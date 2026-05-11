/**
 * Capacitor native plugin bridge — 안드로이드 래퍼에 한정된 동작 (web 빌드에서는 no-op).
 *
 *  - 뒤로가기 버튼: ProtectedRoute / Modal stack 위에서 자연스러운 종료/뒤로 동작
 *  - StatusBar: 색상·아이콘 톤 일치 (사파리·warm orange 강조 영역 회피)
 *  - PushNotifications: 첫 진입 시 권한 요청 + FCM 토큰 백엔드 등록
 *
 * 플러그인은 동적 import — Capacitor.isNativePlatform() 일 때만 로드.
 * web 빌드에서 모듈을 정적 의존시키면 번들이 부풀어오므로 lazy 처리.
 */
import { post } from '../lib/api';

export async function initCapacitorBridge() {
  let Capacitor: any;
  try {
    Capacitor = (await import('@capacitor/core')).Capacitor;
  } catch { return; }
  if (!Capacitor?.isNativePlatform?.()) return;

  // ----- StatusBar -----
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#EFEBDF' }); // 메인 BG 와 동일
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch { /* plugin not installed */ }

  // ----- 뒤로가기 버튼 -----
  try {
    const { App } = await import('@capacitor/app');
    App.addListener('backButton', async () => {
      // 1) 라우터 history 가 있으면 뒤로.
      if (window.history.length > 1 && window.location.pathname !== '/') {
        window.history.back();
        return;
      }
      // 2) 루트 화면에서 한번 더 누르면 종료.
      if ((window as any).__matheoLastBack && Date.now() - (window as any).__matheoLastBack < 2000) {
        App.exitApp();
        return;
      }
      (window as any).__matheoLastBack = Date.now();
      // 토스트 안내 — 모듈 의존성 회피 위해 직접 dispatch.
      window.dispatchEvent(new CustomEvent('mathema-toast', {
        detail: { id: Date.now(), kind: 'info', text: 'Press back again to exit' },
      }));
    });
  } catch { /* plugin not installed */ }

  // ----- 푸시 알림 (FCM) -----
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const perm = await PushNotifications.checkPermissions();
    let granted = perm.receive === 'granted';
    if (!granted) {
      const r = await PushNotifications.requestPermissions();
      granted = r.receive === 'granted';
    }
    if (granted) {
      await PushNotifications.register();
      PushNotifications.addListener('registration', async (token) => {
        try {
          await post('/push/register', {
            token: token.value,
            platform: 'android',
            appVersion: '0.1.0',
          });
        } catch { /* network/backend down */ }
      });
      PushNotifications.addListener('registrationError', (err) => {
        // eslint-disable-next-line no-console
        console.warn('FCM registration error', err);
      });
    }
  } catch { /* plugin not installed */ }
}

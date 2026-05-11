import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor 설정 — matheo Android 앱 래퍼.
 *
 * 빌드:
 *   npm run build                # Vite production build → dist/
 *   npx cap sync android         # dist 를 android/app/src/main/assets/public 로 복사
 *   npx cap open android         # Android Studio 열기 (또는 ./gradlew assembleRelease)
 *
 * 실제 단말 테스트:
 *   1) backend 서버를 0.0.0.0 으로 노출 (또는 ngrok)
 *   2) frontend/.env.production 에 VITE_API_BASE_URL=https://your-backend
 *   3) npm run build && npx cap sync android && npx cap open android
 *
 * Play Store 등록:
 *   - applicationId 변경 X (matheo 도메인 확정 후 ai.matheo.app 등으로 변경)
 *   - signing key 별도 관리 (.gitignore)
 *   - Play Console 에서 Internal Testing → Closed → Open → Production
 */
const config: CapacitorConfig = {
  appId: 'ai.matheo.app',
  appName: 'matheo',
  webDir: 'dist',
  server: {
    // 운영: WebView 가 dist/ 정적 자산을 로드.
    // 개발 시 라이브 리로드 원하면 url: 'http://10.0.2.2:5173' (Android 에뮬레이터에서 호스트 PC) 추가.
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    // Android Studio 가 자동 처리하지만 여기 명시해서 의도 분명히.
    allowMixedContent: false,
  },
};

export default config;

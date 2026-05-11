import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { post, tokens, get } from '../lib/api';
import type { Me } from '../lib/queries';
import { track } from '../lib/analytics';

type AuthState = {
  user: Me | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
};

export type GradeLevel = 'G_MIDDLE_1' | 'G_MIDDLE_2' | 'G_MIDDLE_3' | 'G_HIGH_1' | 'G_HIGH_2' | 'G_HIGH_3';
export type RegisterInput = {
  email: string; password: string; name: string;
  examDate: string; targetGrade: number;
  gradeLevel?: GradeLevel;
};

const Ctx = createContext<AuthState | null>(null);

// 데모 자동 로그인 — VITE_ENABLE_DEMO_AUTO_LOGIN 가 'true' 일 때만 활성화.
// production / Play 빌드에서는 반드시 false (또는 미설정) → /login 화면 진입.
const DEMO_AUTO_LOGIN = (import.meta as any).env?.VITE_ENABLE_DEMO_AUTO_LOGIN === 'true';
const DEMO_EMAIL = (import.meta as any).env?.VITE_DEMO_EMAIL ?? 'polopot123@gmail.com';
const DEMO_PASSWORD = (import.meta as any).env?.VITE_DEMO_PASSWORD ?? 'password1234';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      if (!tokens.get()) {
        // 토큰 없음 + 데모 모드 비활성화 → 무인증 상태로 진입 (ProtectedRoute가 /login 으로 리다이렉트).
        if (!DEMO_AUTO_LOGIN) {
          setReady(true);
          return;
        }
        // 데모 모드: 시드 계정으로 자동 로그인 시도.
        try {
          const t = await post<{ accessToken: string; refreshToken: string }>('/auth/login', {
            email: DEMO_EMAIL, password: DEMO_PASSWORD,
          });
          tokens.set(t.accessToken, t.refreshToken);
          const me = await get<Me>('/users/me');
          setUser(me);
        } catch {
          // 시드 없거나 백엔드 꺼짐 → 무인증 유지
        } finally {
          setReady(true);
        }
        return;
      }
      try {
        const me = await get<Me>('/users/me');
        setUser(me);
      } catch {
        tokens.clear();
      } finally {
        setReady(true);
      }
    };
    init();
  }, []);

  const login = async (email: string, password: string) => {
    const t = await post<{ accessToken: string; refreshToken: string }>('/auth/login', { email, password });
    tokens.set(t.accessToken, t.refreshToken);
    const me = await get<Me>('/users/me');
    setUser(me);
    track('auth.login', { method: 'password' });
    navigate('/');
  };

  /** Google Sign-In — Web GIS or Capacitor plugin 이 발급한 idToken 으로 백엔드 인증. */
  const loginWithGoogle = async (idToken: string) => {
    const t = await post<{ accessToken: string; refreshToken: string }>('/auth/google/id-token', { idToken });
    tokens.set(t.accessToken, t.refreshToken);
    const me = await get<Me>('/users/me');
    setUser(me);
    track('auth.login', { method: 'google' });
    navigate('/');
  };

  const register = async (input: RegisterInput) => {
    const t = await post<{ accessToken: string; refreshToken: string }>('/auth/register', input);
    tokens.set(t.accessToken, t.refreshToken);
    const me = await get<Me>('/users/me');
    setUser(me);
    track('auth.register', { targetGrade: input.targetGrade });
    navigate('/');
  };

  const logout = async () => {
    track('auth.logout');
    tokens.clear();
    sessionStorage.clear();
    setUser(null);
    // 데모 모드에서만 로그아웃 직후 시드 계정으로 재진입.
    // production: /login 으로 이동.
    if (DEMO_AUTO_LOGIN) {
      try {
        const t = await post<{ accessToken: string; refreshToken: string }>('/auth/login', {
          email: DEMO_EMAIL, password: DEMO_PASSWORD,
        });
        tokens.set(t.accessToken, t.refreshToken);
        const me = await get<Me>('/users/me');
        setUser(me);
        navigate('/');
        return;
      } catch {/* fall through */}
    }
    navigate('/login');
  };

  return <Ctx.Provider value={{ user, ready, login, loginWithGoogle, register, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('AuthProvider not mounted');
  return v;
}

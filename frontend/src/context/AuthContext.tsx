import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { post, tokens, get } from '../lib/api';
import type { Me } from '../lib/queries';
import { track } from '../lib/analytics';

type AuthState = {
  user: Me | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      // 데모 모드: 토큰이 없으면 시드 계정으로 자동 로그인.
      // 로그인/회원가입 화면을 건너뛰고 곧장 대시보드 진입.
      if (!tokens.get()) {
        try {
          const t = await post<{ accessToken: string; refreshToken: string }>('/auth/login', {
            email: 'polopot123@gmail.com', password: 'password1234',
          });
          tokens.set(t.accessToken, t.refreshToken);
          const me = await get<Me>('/users/me');
          setUser(me);
        } catch {
          // 시드가 없거나 백엔드가 꺼져있으면 무인증 상태 유지 (라우팅은 그대로 동작)
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
    // 데모 모드: 로그아웃 즉시 시드 계정으로 재진입 (로그인 화면 없음)
    try {
      const t = await post<{ accessToken: string; refreshToken: string }>('/auth/login', {
        email: 'polopot123@gmail.com', password: 'password1234',
      });
      tokens.set(t.accessToken, t.refreshToken);
      const me = await get<Me>('/users/me');
      setUser(me);
    } catch {
      // ignore — ProtectedRoute 가 안내 메시지를 표시
    }
    navigate('/');
  };

  return <Ctx.Provider value={{ user, ready, login, register, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('AuthProvider not mounted');
  return v;
}

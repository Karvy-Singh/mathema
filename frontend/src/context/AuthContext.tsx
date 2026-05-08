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

export type RegisterInput = {
  email: string; password: string; name: string;
  examDate: string; targetGrade: number;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      if (!tokens.get()) { setReady(true); return; }
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

  const logout = () => {
    track('auth.logout');
    tokens.clear();
    sessionStorage.clear();
    setUser(null);
    navigate('/login');
  };

  return <Ctx.Provider value={{ user, ready, login, register, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('AuthProvider not mounted');
  return v;
}

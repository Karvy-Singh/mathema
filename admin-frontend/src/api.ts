import axios from 'axios';

const TOKEN_KEY = 'matheo.admin.accessToken';

export const tokens = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({ baseURL: '/api/v1', timeout: 15000 });

api.interceptors.request.use((cfg) => {
  const t = tokens.get();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  // 어드민 lang 자동 첨부 — 단원명 등 백엔드 응답을 lang 기준으로 받음
  const lang = localStorage.getItem('matheo.admin.lang');
  if (lang === 'ko' || lang === 'en') cfg.headers['Accept-Language'] = lang;
  return cfg;
});

export const get = <T>(path: string, params?: any) =>
  api.get<{ data: T }>(path, { params }).then((r) => r.data.data);

export const post = <T>(path: string, body: any) =>
  api.post<{ data: T }>(path, body).then((r) => r.data.data);

export async function login(email: string, password: string) {
  const r = await post<{ accessToken: string; refreshToken: string }>('/auth/login', { email, password });
  tokens.set(r.accessToken);
  return r;
}

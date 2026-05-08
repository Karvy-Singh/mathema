import axios, { AxiosError, AxiosRequestConfig } from 'axios';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL ?? '/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

const TOKEN_KEY = 'mathema.access';
const REFRESH_KEY = 'mathema.refresh';

export const tokens = {
  get: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (a: string, r: string) => {
    localStorage.setItem(TOKEN_KEY, a);
    localStorage.setItem(REFRESH_KEY, r);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

api.interceptors.request.use((cfg) => {
  const t = tokens.get();
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  // 현재 i18n 언어를 매 요청마다 자동 첨부
  try {
    const lang = localStorage.getItem('mathema.lang');
    if (lang === 'ko' || lang === 'en') {
      cfg.headers['Accept-Language'] = lang;
    }
  } catch { /* ignore */ }
  return cfg;
});

let isRefreshing = false;
let pending: Array<(t: string) => void> = [];

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const original = err.config as AxiosRequestConfig & { _retry?: boolean };
    if (err.response?.status === 401 && !original?._retry && tokens.getRefresh()) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          pending.push((t) => {
            original.headers!.Authorization = `Bearer ${t}`;
            resolve(api(original));
          });
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
          refreshToken: tokens.getRefresh(),
        });
        const access = data.data.accessToken;
        const refresh = data.data.refreshToken;
        tokens.set(access, refresh);
        pending.forEach((fn) => fn(access));
        pending = [];
        original.headers!.Authorization = `Bearer ${access}`;
        return api(original);
      } catch (e) {
        tokens.clear();
        window.location.href = '/login';
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  },
);

// 백엔드는 { data, meta? } 로 감싸므로 unwrap 하는 helper
export async function get<T>(url: string, params?: any): Promise<T> {
  const r = await api.get(url, { params });
  return r.data.data as T;
}
export async function post<T>(url: string, body?: any): Promise<T> {
  const r = await api.post(url, body);
  return r.data.data as T;
}
export async function patch<T>(url: string, body?: any): Promise<T> {
  const r = await api.patch(url, body);
  return r.data.data as T;
}

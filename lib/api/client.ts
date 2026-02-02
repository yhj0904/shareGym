import AsyncStorage from '@react-native-async-storage/async-storage';
import { config, isBackendEnabled } from '@/constants/config';

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(config.AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setAuthToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await AsyncStorage.setItem(config.AUTH_TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(config.AUTH_TOKEN_KEY);
    }
  } catch (e) {
    console.warn('setAuthToken failed', e);
  }
}

function getBaseUrl(): string {
  return config.API_BASE_URL;
}

/**
 * 백엔드 API 공통 요청
 * - isBackendEnabled() false면 호출하지 말고 호출부에서 모크 사용
 */
export async function request<T = unknown>(
  method: RequestMethod,
  path: string,
  body?: unknown,
  options: RequestOptions = {}
): Promise<T> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    return Promise.reject(new Error('API_BASE_URL not configured'));
  }

  const url = path.startsWith('http') ? path : `${baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (!options.skipAuth) {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const init: RequestInit = {
    method,
    headers,
  };
  if (body !== undefined && method !== 'GET') {
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url, init);

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json().catch(() => ({}));
      message = (data as { message?: string }).message ?? (data as { error?: string }).error ?? message;
    } catch {}
    throw new Error(message || `HTTP ${res.status}`);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

export const api = {
  get: <T = unknown>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, body, options),
  put: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', path, body, options),
  patch: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', path, body, options),
  del: <T = unknown>(path: string, options?: RequestOptions) => request<T>('DELETE', path, undefined, options),
};

export { isBackendEnabled };

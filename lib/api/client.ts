import AsyncStorage from '@react-native-async-storage/async-storage';
import { config, isBackendEnabled } from '@/constants/config';
import * as apiCache from './cache';

export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  headers?: Record<string, string>;
  skipAuth?: boolean;
  /** true면 401 시 토큰 갱신 시도 안 함 (refresh 요청 자체 실패 시) */
  skipTokenRefresh?: boolean;
  /** true면 GET 캐시 사용 안 함 */
  skipCache?: boolean;
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

async function getRefreshToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(config.REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setRefreshToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await AsyncStorage.setItem(config.REFRESH_TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(config.REFRESH_TOKEN_KEY);
    }
  } catch (e) {
    console.warn('setRefreshToken failed', e);
  }
}

/** 401 발생 시 호출할 콜백 (앱에서 설정) */
let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(callback: (() => void) | null): void {
  onUnauthorized = callback;
}

/** 토큰 갱신 진행 중인지 (동시 요청 시 하나만 갱신 시도) */
let refreshPromise: Promise<string | null> | null = null;

/** refreshToken으로 액세스 토큰 갱신, 성공 시 새 토큰 반환 */
async function tryRefreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return null;
      const baseUrl = getBaseUrl();
      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return null;
      const response = (await res.json()) as any;
      // 백엔드 응답 형식 처리
      const newToken = response?.data?.accessToken || response?.accessToken || response?.token;
      const newRefreshToken = response?.data?.refreshToken || response?.refreshToken;
      if (newToken) {
        await setAuthToken(newToken);
        if (newRefreshToken) await setRefreshToken(newRefreshToken);
        return newToken;
      }
      return null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
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

  // GET 요청 캐시 확인
  if (method === 'GET' && !options.skipCache) {
    const cacheKey = apiCache.getCacheKey(method, url);
    const cached = apiCache.get(cacheKey);
    if (cached !== null) return cached as T;
  }

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (error) {
    // 네트워크 에러 (백엔드 연결 불가)
    const errorMessage = error instanceof Error ? error.message : 'Network request failed';
    throw new Error(`네트워크 오류: ${errorMessage}`);
  }

  // 401 시 토큰 갱신 시도 (skipTokenRefresh가 아니고 refresh 요청이 아닐 때)
  if (res.status === 401 && !options.skipTokenRefresh && !path.includes('/auth/refresh')) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      init.headers = headers;
      try {
        res = await fetch(url, init);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Network request failed';
        throw new Error(`네트워크 오류: ${errorMessage}`);
      }
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      await setAuthToken(null);
      await setRefreshToken(null);
      onUnauthorized?.();
    }
    let message = res.statusText;
    try {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        // 다양한 에러 응답 형식 처리
        message = data?.message || data?.error || data?.errorMessage || message;
      } else {
        const text = await res.text();
        if (text) message = text;
      }
    } catch (parseError) {
      // JSON 파싱 실패 시 기본 메시지 유지
      console.warn('Error response parsing failed:', parseError);
    }
    throw new Error(message || `HTTP ${res.status}`);
  }

  const text = await res.text();
  if (!text) return undefined as T;
  let result: T;
  try {
    result = JSON.parse(text) as T;
  } catch {
    result = text as T;
  }

  // GET 성공 시 캐시 저장
  if (method === 'GET' && !options.skipCache && res.ok) {
    const cacheKey = apiCache.getCacheKey(method, url);
    apiCache.set(cacheKey, result, path);
  }

  return result;
}

export const apiClient = {
  get: <T = unknown>(path: string, options?: RequestOptions) => request<T>('GET', path, undefined, options),
  post: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) => request<T>('POST', path, body, options),
  put: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PUT', path, body, options),
  patch: <T = unknown>(path: string, body?: unknown, options?: RequestOptions) => request<T>('PATCH', path, body, options),
  delete: <T = unknown>(path: string, options?: RequestOptions) => request<T>('DELETE', path, undefined, options),
};

// Backward compatibility
export const api = apiClient;

export { isBackendEnabled };
export { clear as clearApiCache, invalidate as invalidateApiCache } from './cache';

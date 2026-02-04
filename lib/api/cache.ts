/**
 * API 응답 캐시 (인메모리)
 * - GET 요청 결과를 TTL 동안 캐시
 * - mutation 시 관련 경로 캐시 무효화
 */

interface CacheEntry<T = unknown> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

/** 기본 TTL (ms) */
const DEFAULT_TTL = 60 * 1000; // 1분

/** 경로별 TTL 오버라이드 (긴 데이터는 더 길게) */
const PATH_TTL: Record<string, number> = {
  '/auth/me': 5 * 60 * 1000,      // 5분
  '/users/': 2 * 60 * 1000,       // 2분 (프로필 등)
  '/feed': 30 * 1000,             // 30초
  '/routines': 2 * 60 * 1000,     // 2분
};

function getTTL(path: string): number {
  for (const [prefix, ttl] of Object.entries(PATH_TTL)) {
    if (path.includes(prefix)) return ttl;
  }
  return DEFAULT_TTL;
}

export function getCacheKey(method: string, url: string): string {
  return `${method}:${url}`;
}

/** 캐시 조회 */
export function get<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

/** 캐시 저장 */
export function set<T>(key: string, data: T, path: string): void {
  const ttl = getTTL(path);
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  });
}

/** 경로 패턴에 해당하는 캐시 무효화 */
export function invalidate(pattern: string | RegExp): void {
  const keys = Array.from(cache.keys());
  keys.forEach((key) => {
    if (typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)) {
      cache.delete(key);
    }
  });
}

/** 전체 캐시 비우기 */
export function clear(): void {
  cache.clear();
}

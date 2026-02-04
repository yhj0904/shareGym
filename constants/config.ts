/**
 * 백엔드 연동 설정
 * - EXPO_PUBLIC_API_URL: .env 또는 EAS 시크릿에 설정
 *   - 개발: http://localhost:8080
 *   - 운영: https://api.garabu.org/sharefit
 * - 비어 있으면 모크 데이터 사용
 */
const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) || '';

const baseUrl = String(API_BASE_URL).replace(/\/$/, '');

export const config = {
  /** 백엔드 API 베이스 URL (끝에 / 제외) */
  API_BASE_URL: baseUrl,
  /** SSE 베이스 URL (API_BASE_URL + /sse) - 실시간 운동/알림 스트림용 */
  SSE_BASE_URL: baseUrl ? `${baseUrl}/sse` : '',
  /** 액세스 토큰 저장 키 */
  AUTH_TOKEN_KEY: 'sharegym_auth_token',
  /** 리프레시 토큰 저장 키 (자동 갱신용) */
  REFRESH_TOKEN_KEY: 'sharegym_refresh_token',
  /** 사용자 정보 저장 키 (오프라인용) */
  USER_CACHE_KEY: 'sharegym_user',
};

/** 백엔드 사용 여부 - URL이 설정되어 있으면 API 호출, 아니면 모크 */
export function isBackendEnabled(): boolean {
  return Boolean(config.API_BASE_URL);
}

/**
 * 백엔드 연동 설정
 * - EXPO_PUBLIC_API_URL: .env 또는 EAS 시크릿에 설정 (예: https://api.sharegym.com)
 * - 비어 있으면 모크 데이터 사용
 */
const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) || '';

export const config = {
  /** 백엔드 API 베이스 URL (끝에 / 제외) */
  API_BASE_URL: String(API_BASE_URL).replace(/\/$/, ''),
  /** 인증 토큰 저장 키 */
  AUTH_TOKEN_KEY: 'sharegym_auth_token',
  /** 사용자 정보 저장 키 (오프라인용) */
  USER_CACHE_KEY: 'sharegym_user',
};

/** 백엔드 사용 여부 - URL이 설정되어 있으면 API 호출, 아니면 모크 */
export function isBackendEnabled(): boolean {
  return Boolean(config.API_BASE_URL);
}

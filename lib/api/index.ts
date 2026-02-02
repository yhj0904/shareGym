/**
 * 백엔드 API 레이어
 * - isBackendEnabled() === true 일 때 스토어에서 이 API 호출
 * - 환경변수 EXPO_PUBLIC_API_URL 설정 시 백엔드 연동
 */
export { api, setAuthToken, isBackendEnabled } from './client';
export * from './auth';
export * from './workout';
export * from './group';
export * from './feed';
export * from './collaborative';

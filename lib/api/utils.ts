/**
 * API 레이어 공통 유틸리티
 * - 응답 언래핑: 백엔드가 { data: T } 또는 T 형식으로 반환할 수 있음
 * - Date 직렬화: JSON.stringify가 자동 처리하므로 별도 유틸 불필요
 */

/** 백엔드 응답이 T | { data: T } 형식일 때 실제 데이터 추출 */
export function unwrapResponse<T>(data: T | { data?: T } | null | undefined): T | null {
  if (data == null) return null;
  const wrapped = data as { data?: T };
  if (typeof wrapped === 'object' && 'data' in wrapped && wrapped.data !== undefined) {
    return wrapped.data;
  }
  return data as T;
}

/** 배열 응답 언래핑 - 항상 배열 반환 */
export function unwrapArrayResponse<T>(data: T[] | { data?: T[] } | null | undefined): T[] {
  const unwrapped = unwrapResponse(data);
  return Array.isArray(unwrapped) ? unwrapped : [];
}

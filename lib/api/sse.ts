/**
 * SSE (Server-Sent Events) 클라이언트
 * - 실시간 운동 방송, 알림 수신
 * - react-native-sse 사용 (EventSource polyfill)
 */

import EventSource from 'react-native-sse';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from '@/constants/config';

/** SSE 연결 옵션 */
export interface SSEOptions {
  /** Bearer 토큰 (없으면 AsyncStorage에서 로드) */
  token?: string | null;
  /** topic/query 파라미터 (예: groupId) */
  params?: Record<string, string>;
  /** 재연결 간격 (ms), 0이면 비활성화 */
  pollingInterval?: number;
}

/** SSE 연결 인스턴스 - close()로 정리 */
export type SSEConnection = { close: () => void };

/**
 * SSE 스트림 연결 - 백엔드 API v1 스펙
 * @param endpoint 백엔드 SSE 엔드포인트 경로
 * @param onMessage 메시지 수신 콜백
 * @param onError 에러 콜백
 */
export async function connectSSE(
  endpoint: string, // 예: 'user/123', 'workout/456', 'group/789', 'feed'
  onMessage: (data: unknown) => void,
  onError?: (err: Error) => void,
  options: SSEOptions = {}
): Promise<SSEConnection | null> {
  const apiBase = config.API_BASE_URL;
  if (!apiBase) return null;

  const token = options.token ?? (await AsyncStorage.getItem(config.AUTH_TOKEN_KEY));

  // 백엔드 SSE 엔드포인트 형식: /api/v1/sse/{endpoint}
  const url = new URL(`${apiBase}/sse/${endpoint}`);

  if (options.params) {
    Object.entries(options.params).forEach(([k, v]) => {
      url.searchParams.append(k, v);
    });
  }

  const es = new EventSource(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    pollingInterval: options.pollingInterval ?? 5000,
  });

  es.addEventListener('open', () => {
    console.log(`SSE connected to ${endpoint}`);
  });

  es.addEventListener('message', (event) => {
    try {
      const data = event.data ? JSON.parse(event.data) : null;
      onMessage(data);
    } catch {
      onMessage(event.data);
    }
  });

  es.addEventListener('error', (event: any) => {
    const err = event?.error ?? new Error(event?.message ?? 'SSE error');
    console.error(`SSE error on ${endpoint}:`, err);
    onError?.(err);
  });

  return {
    close: () => {
      es.removeAllEventListeners();
      es.close();
    },
  };
}

// 백엔드 SSE 엔드포인트별 헬퍼 함수
export async function connectUserNotifications(
  userId: string,
  onMessage: (data: unknown) => void,
  onError?: (err: Error) => void
): Promise<SSEConnection | null> {
  return connectSSE(`user/${userId}`, onMessage, onError);
}

export async function connectWorkoutStream(
  workoutId: string,
  onMessage: (data: unknown) => void,
  onError?: (err: Error) => void
): Promise<SSEConnection | null> {
  return connectSSE(`workout/${workoutId}`, onMessage, onError);
}

export async function connectGroupStream(
  groupId: string,
  onMessage: (data: unknown) => void,
  onError?: (err: Error) => void
): Promise<SSEConnection | null> {
  return connectSSE(`group/${groupId}`, onMessage, onError);
}

export async function connectFeedStream(
  onMessage: (data: unknown) => void,
  onError?: (err: Error) => void
): Promise<SSEConnection | null> {
  return connectSSE('feed', onMessage, onError);
}

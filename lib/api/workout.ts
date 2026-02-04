import { api } from './client';
import type { WorkoutSession } from '@/types';
import { unwrapResponse, unwrapArrayResponse } from './utils';
import { mapWorkoutToBackend, mapWorkoutFromBackend } from '@/data/exerciseMapping';

/** 백엔드 응답 타입 */
interface BackendWorkoutResponse {
  success: boolean;
  data: any;
  error?: any;
  timestamp: string;
}

/** 운동 히스토리 목록 조회 - 백엔드 API v1 스펙 */
export async function getWorkoutHistory(userId: string): Promise<WorkoutSession[]> {
  try {
    // 백엔드는 /workouts?userId={userId} 형식 사용
    const response = await api.get<BackendWorkoutResponse>(`/workouts?userId=${userId}&size=100`);

    if (response.success && response.data) {
      const workouts = response.data.content || response.data || [];
      return workouts.map((workout: any) => mapWorkoutFromBackend(workout) as WorkoutSession);
    }

    return [];
  } catch (error) {
    console.error('Failed to load workout history:', error);
    return [];
  }
}

/** 최근 운동 1건 조회 - 백엔드 API v1 스펙 */
export async function getLastWorkout(userId: string): Promise<WorkoutSession | null> {
  try {
    // 백엔드는 최근 1건 조회를 위해 페이징 사용
    const response = await api.get<BackendWorkoutResponse>(
      `/workouts?userId=${userId}&size=1&sort=createdAt,desc`
    );

    if (response.success && response.data) {
      const workouts = response.data.content || response.data || [];
      if (workouts.length > 0) {
        return mapWorkoutFromBackend(workouts[0]) as WorkoutSession;
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to load last workout:', error);
    return null;
  }
}

/** 운동 완료 저장 - 백엔드 API v1 스펙 */
export async function saveWorkout(session: WorkoutSession): Promise<WorkoutSession> {
  try {
    // 백엔드 형식으로 변환
    const backendSession = mapWorkoutToBackend(session as Record<string, unknown>);

    // 백엔드 API 호출
    const response = await api.post<BackendWorkoutResponse>('/workouts', backendSession);

    if (response.success && response.data) {
      // 응답을 프론트엔드 형식으로 변환
      return mapWorkoutFromBackend(response.data) as WorkoutSession;
    }

    // 실패 시 원본 세션 반환
    return session;
  } catch (error) {
    console.error('Failed to save workout:', error);
    throw error;
  }
}

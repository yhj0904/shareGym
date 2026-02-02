import { api } from './client';
import type { WorkoutSession } from '@/types';

/** 운동 히스토리 목록 조회 */
export async function getWorkoutHistory(userId: string): Promise<WorkoutSession[]> {
  const data = await api.get<WorkoutSession[] | { data: WorkoutSession[] }>(`/users/${userId}/workouts`);
  return Array.isArray(data) ? data : (data as { data: WorkoutSession[] }).data ?? [];
}

/** 최근 운동 1건 조회 */
export async function getLastWorkout(userId: string): Promise<WorkoutSession | null> {
  const data = await api.get<WorkoutSession | { data: WorkoutSession } | null>(`/users/${userId}/workouts/last`);
  if (data == null) return null;
  return (data as { data?: WorkoutSession }).data ?? (data as WorkoutSession);
}

/** 운동 완료 저장 (세션 종료 시 호출) */
export async function saveWorkout(session: WorkoutSession): Promise<WorkoutSession> {
  const payload = {
    ...session,
    date: session.date instanceof Date ? session.date.toISOString() : session.date,
    startTime: session.startTime instanceof Date ? session.startTime.toISOString() : session.startTime,
    endTime: session.endTime instanceof Date ? session.endTime?.toISOString() : session.endTime,
  };
  const res = await api.post<WorkoutSession | { data: WorkoutSession }>('/workouts', payload);
  return (res as { data?: WorkoutSession }).data ?? (res as WorkoutSession);
}

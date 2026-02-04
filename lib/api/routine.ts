/**
 * 루틴 CRUD API
 */

import { api } from './client';
import type { Routine, RoutineExercise } from '@/types';
import { unwrapResponse, unwrapArrayResponse } from './utils';

/** 사용자 루틴 목록 조회 */
export async function getRoutines(userId: string): Promise<Routine[]> {
  const data = await api.get<Routine[] | { data: Routine[] }>(`/users/${userId}/routines`);
  const list = unwrapArrayResponse(data);
  return list.map((r) => ({
    ...r,
    createdAt: r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt),
    lastUsed: r.lastUsed ? (r.lastUsed instanceof Date ? r.lastUsed : new Date(r.lastUsed)) : undefined,
  }));
}

/** 루틴 생성 */
export async function createRoutine(
  userId: string,
  name: string,
  exercises: RoutineExercise[]
): Promise<Routine> {
  const res = await api.post<Routine | { data: Routine }>('/routines', {
    userId,
    name,
    exercises: exercises.map((ex, i) => ({ ...ex, orderIndex: i })),
  });
  const routine = unwrapResponse(res) ?? (res as Routine);
  return {
    ...routine,
    createdAt: routine.createdAt instanceof Date ? routine.createdAt : new Date(routine.createdAt),
  };
}

/** 루틴 수정 */
export async function updateRoutine(id: string, updates: Partial<Routine>): Promise<Routine> {
  const res = await api.patch<Routine | { data: Routine }>(`/routines/${id}`, updates);
  return unwrapResponse(res) ?? (res as Routine);
}

/** 루틴 삭제 */
export async function deleteRoutine(id: string): Promise<void> {
  await api.del(`/routines/${id}`);
}

/** 루틴 즐겨찾기 토글 */
export async function toggleRoutineFavorite(id: string, isFavorite: boolean): Promise<Routine> {
  const res = await api.patch<Routine | { data: Routine }>(`/routines/${id}`, { isFavorite });
  return unwrapResponse(res) ?? (res as Routine);
}

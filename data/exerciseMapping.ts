/**
 * 운동 ID 매핑: 클라이언트(문자열) ↔ 백엔드(숫자)
 * - API 요청/응답 시 exerciseTypeId 변환
 * - 카테고리별 숫자 범위: chest 1000, back 2000, shoulders 3000, legs 4000,
 *   arms 5000, abs 6000, cardio 7000, bodyweight 8000, sports 9000,
 *   outdoor 9100, yoga 9200, stretching 9300
 */

import { exerciseDatabase } from './exercises';

const CATEGORY_BASE: Record<string, number> = {
  chest: 1000,
  back: 2000,
  shoulders: 3000,
  legs: 4000,
  arms: 5000,
  abs: 6000,
  cardio: 7000,
  bodyweight: 8000,
  sports: 9000,
  outdoor: 9100,
  yoga: 9200,
  stretching: 9300,
};

/** 클라이언트 ID → 백엔드 숫자 ID */
const STRING_TO_ID: Record<string, number> = {};
/** 백엔드 숫자 ID → 클라이언트 ID */
const ID_TO_STRING: Record<number, string> = {};

// exerciseDatabase 순회하여 매핑 생성
const categoryIndex: Record<string, number> = {};
exerciseDatabase.forEach((ex) => {
  const category = ex.category || 'bodyweight';
  const base = CATEGORY_BASE[category] ?? 8000;
  const idx = (categoryIndex[category] ?? 0) + 1;
  categoryIndex[category] = idx;
  const numId = base + idx;
  STRING_TO_ID[ex.id] = numId;
  ID_TO_STRING[numId] = ex.id;
});

/** 클라이언트 문자열 ID → 백엔드 숫자 ID */
export function toBackendId(clientId: string): number {
  return STRING_TO_ID[clientId] ?? 0;
}

/** 백엔드 숫자 ID → 클라이언트 문자열 ID */
export function toClientId(backendId: number): string {
  return ID_TO_STRING[backendId] ?? String(backendId);
}

/** WorkoutSession 내 exerciseTypeId 변환 (→ 백엔드) */
export function mapWorkoutToBackend(session: Record<string, unknown>): Record<string, unknown> {
  const exercises = (session.exercises as Array<Record<string, unknown>>) ?? [];

  // 백엔드 CreateWorkoutRequest 형식에 맞게 변환
  const workoutExercises = exercises.map((ex) => {
    const sets = (ex.sets as Array<Record<string, unknown>>) ?? [];
    return {
      exerciseId: toBackendId(String(ex.exerciseTypeId ?? '')),
      orderIndex: ex.orderIndex ?? 0,
      sets: sets.map((set, idx) => ({
        orderIndex: idx + 1,
        weight: set.weight ?? 0,
        reps: set.reps ?? 0,
        distance: set.distance,
        duration: set.duration,
        isCompleted: set.isCompleted ?? false,
      })),
    };
  });

  return {
    title: session.name || session.title || '운동',
    note: session.note || '',
    startTime: session.startTime,
    endTime: session.endTime || new Date().toISOString(),
    duration: session.duration || 0,
    exercises: workoutExercises,
  };
}

/** WorkoutSession 내 exerciseTypeId 변환 (← 백엔드) */
export function mapWorkoutFromBackend(workout: Record<string, unknown>): Record<string, unknown> {
  const exercises = (workout.exercises as Array<Record<string, unknown>>) ?? [];

  // 백엔드 WorkoutResponse를 프론트엔드 WorkoutSession으로 변환
  return {
    id: String(workout.id || ''),
    userId: String(workout.userId || ''),
    name: workout.title || workout.name || '',
    title: workout.title || workout.name || '',
    date: workout.startTime || workout.createdAt || new Date().toISOString(),
    startTime: workout.startTime || workout.createdAt,
    endTime: workout.endTime,
    duration: workout.duration || 0,
    note: workout.note || '',
    totalVolume: workout.totalVolume || 0,
    exerciseCount: exercises.length,
    exercises: exercises.map((ex: any) => {
      const exerciseId = ex.exerciseId || ex.exercise?.id;
      const sets = (ex.sets as Array<Record<string, unknown>>) ?? [];

      return {
        id: String(ex.id || ''),
        exerciseTypeId: typeof exerciseId === 'number' ? toClientId(exerciseId) : String(exerciseId),
        orderIndex: ex.orderIndex || 0,
        sets: sets.map((set: any) => ({
          id: String(set.id || ''),
          weight: set.weight || 0,
          reps: set.reps || 0,
          distance: set.distance,
          duration: set.duration,
          isCompleted: set.isCompleted ?? false,
          restTime: set.restTime,
        })),
      };
    }),
  };
}

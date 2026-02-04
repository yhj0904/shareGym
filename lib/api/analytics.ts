/**
 * 운동 통계/분석 API
 */

import { api } from './client';
import { unwrapResponse } from './utils';

/** 운동 패턴 DTO */
export interface ExercisePatternDto {
  exerciseTypeId: string;
  averageRestTime: number;
  averageSetsCount: number;
  typicalWeight: number;
  typicalReps: number;
  hardestSetIndex: number;
  lastWorkoutWeight: number;
  personalRecord: number;
  totalVolume: number;
  workoutCount: number;
}

/** 사용자 통계 DTO */
export interface UserStatsDto {
  lastWorkoutDate: string | null;
  workoutStreak: number;
  totalWorkouts: number;
  averageWorkoutDuration: number;
  preferredWorkoutTime: string;
  strongestExercises: string[];
  weakestExercises: string[];
}

/** 통계 응답 */
export interface WorkoutAnalyticsResponse {
  exercisePatterns: Record<string, ExercisePatternDto>;
  userStats: UserStatsDto;
}

/** 운동 통계 조회 */
export async function getWorkoutAnalytics(userId: string): Promise<WorkoutAnalyticsResponse | null> {
  try {
    const data = await api.get<WorkoutAnalyticsResponse | { data: WorkoutAnalyticsResponse }>(
      `/users/${userId}/workout-analytics`
    );
    const res = unwrapResponse(data) ?? (data as WorkoutAnalyticsResponse);
    return res ?? null;
  } catch {
    return null;
  }
}

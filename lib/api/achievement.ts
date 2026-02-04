/**
 * 업적 API
 */

import { api } from './client';
import { unwrapResponse } from './utils';

/** 사용자 업적 항목 */
export interface UserAchievementDto {
  achievementId: string;
  unlockedAt: string;
  progress: number;
  isNew?: boolean;
}

/** 업적 목록 응답 */
export interface AchievementsResponse {
  userAchievements: UserAchievementDto[];
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate?: string;
}

/** 사용자 업적 목록 조회 */
export async function getAchievements(userId: string): Promise<AchievementsResponse | null> {
  try {
    const data = await api.get<AchievementsResponse | { data: AchievementsResponse }>(
      `/users/${userId}/achievements`
    );
    const res = unwrapResponse(data) ?? (data as AchievementsResponse);
    if (!res) return null;
    return {
      ...res,
      userAchievements: (res.userAchievements ?? []).map((ua) => ({
        ...ua,
        unlockedAt: typeof ua.unlockedAt === 'string' ? ua.unlockedAt : new Date(ua.unlockedAt).toISOString(),
      })),
    };
  } catch {
    return null;
  }
}
